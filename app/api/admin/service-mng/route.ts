import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../config/mongodb";
import { recordActivity } from "../../../lib/logger";
import { pusherServer } from "../../../lib/pusher";
import { broadcastToSubscriptions } from "../../../lib/push";
import { sendSms } from "../../../lib/sms";
import { sendEmail } from "../../../lib/email";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const db = await getDb();
        
        // Count total orders (non-draft)
        const totalCount = await db.collection("orders").countDocuments({ status: { $ne: "draft" } });
        
        // Fetch orders joined with checkouts and users with pagination
        const ordersRaw = await db.collection("orders").aggregate([
            { $match: { status: { $ne: "draft" } } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "checkouts",
                    localField: "_id",
                    foreignField: "orderId",
                    as: "checkoutDetails"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$checkoutDetails", preserveNullAndEmptyArrays: true } }
        ]).toArray();

        const orders = ordersRaw.map(order => ({
            id: order._id.toString(),
            orderCode: order._id.toString().slice(-6).toUpperCase(),
            customerName: order.userDetails?.username || "Guest",
            customerPhone: order.userDetails?.contactNo || "N/A",
            items: order.services?.length || 0,
            amount: `\u20B1${(order.subtotal || 0).toLocaleString()}`,
            status: order.status, // Current DB status
            serviceMethod: order.checkoutDetails?.serviceMethod || "dropoff",
            orderTime: new Date(order.createdAt).toLocaleString(),
            estimatedCompletion: order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "N/A",
            rewardId: order.checkoutDetails?.rewardId || null,
            rewardDiscount: order.checkoutDetails?.rewardDiscount || 0
        }));

        // Progress Stats
        const [activeCount, completedCount, inProgressCount, waitingCount] = await Promise.all([
            db.collection("orders").countDocuments({ status: { $in: ["waiting", "in-progress", "ready", "out-for-delivery"] } }),
            db.collection("orders").countDocuments({ status: "closed" }),
            db.collection("orders").countDocuments({ status: "in-progress" }),
            db.collection("orders").countDocuments({ status: { $in: ["waiting", "confirmed"] } })
        ]);

        const stats = [
            { id: "active", label: "Active Orders", value: activeCount, color: "primary", icon: "active" },
            { id: "completed", label: "Completed", value: completedCount, color: "success", icon: "completed" },
            { id: "processing", label: "In Progress", value: inProgressCount, color: "warning", icon: "processing" },
            { id: "pending", label: "Waiting", value: waitingCount, color: "info", icon: "pending" },
        ];

        return NextResponse.json({ 
            orders, 
            stats,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("Order Progress API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
    "waiting":              ["picked-up", "received-by-staff", "in-progress", "ready", "closed"],
    "picked-up":            ["received-by-staff", "in-progress", "ready", "closed"],
    "received-by-staff":    ["in-progress", "ready", "closed"],
    "in-progress":          ["ready", "closed"],
    "ready":                ["out-for-delivery", "received-by-client", "closed"],
    "out-for-delivery":     ["received-by-client", "closed"],
    "received-by-client":   ["closed"],
    "closed":               [],
};

export async function PATCH(request: NextRequest) {
    try {
        const { orderId, status } = await request.json();
        
        if (!orderId || !ObjectId.isValid(orderId) || !status) {
            return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 });
        }

        const db = await getDb();
        const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const currentStatus = order.status || "waiting";
        const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowedNext.includes(status)) {
            return NextResponse.json(
                { error: `Invalid transition: ${currentStatus} → ${status}` },
                { status: 422 }
            );
        }

        const now = new Date();
        const milestoneUpdate: Record<string, Date> = {};
        if (status === "picked-up")           milestoneUpdate.pickedUpAt = now;
        if (status === "received-by-staff")   milestoneUpdate.receivedByStaffAt = now;
        if (status === "received-by-client")  milestoneUpdate.receivedByClientAt = now;

        const result = await db.collection("orders").updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { status: status, ...milestoneUpdate, updatedAt: now } }
        );

        const customer = await db.collection("users").findOne({ _id: order?.userId });
        
        await recordActivity({
            type: status === "closed" ? "order-completed" : "order-received",
            orderCode: orderId.toString().slice(-6).toUpperCase(),
            customerName: customer?.username || "Guest",
            quantity: order?.services?.length || 0,
            performedBy: "Admin", // For now, could be dynamic from session
            details: `Status changed to ${status}`
        });

        // Trigger Pusher update
        try {
            const checkout = await db.collection("checkouts").findOne({ orderId: new ObjectId(orderId) });
            await pusherServer.trigger("order-updates", "order-status-updated", {
                orderId,
                status,
                serviceMethod: checkout?.serviceMethod || "dropoff"
            });
        } catch (pusherError) {
            console.error("Pusher trigger failed:", pusherError);
        }

        // Trigger Push Notification for the Member
        try {
            console.log(`[Push] Checking member subscriptions for userId: ${order?.userId}`);
            const memberSubs = customer?.pushSubscriptions || [];
            console.log(`[Push] Member has ${memberSubs.length} push subscription(s).`);
            if (memberSubs.length > 0) {
                await broadcastToSubscriptions(memberSubs, {
                    title: "Order Status Update! 🧺",
                    body: `Your order #${orderId.toString().slice(-6).toUpperCase()} is now: ${status}`,
                    url: "/member/dashboard"
                });
                console.log(`[Push] Member push broadcast sent.`);
            } else {
                console.warn(`[Push] Member has no push subscriptions. They must enable notifications on their device.`);
            }
        } catch (pushError) {
            console.error("Member push notification failed:", pushError);
        }

        // SMS the specific Member
        try {
            const orderCode = orderId.toString().slice(-6).toUpperCase();
            if (customer?.contactNo) {
                await sendSms(
                    customer.contactNo,
                    `[WashWise] Your order #${orderCode} status has been updated to: ${status}. Open the app to view details.`
                );
            } else {
                console.warn(`[SMS] Member has no contactNo stored, skipping SMS.`);
            }
        } catch (smsError) {
            console.error("Member SMS failed:", smsError);
        }

        // Email the specific Member on status updates
        try {
            const orderCode = orderId.toString().slice(-6).toUpperCase();
            if (customer?.email) {
                await sendEmail({
                    to: customer.email,
                    subject: `[WashWise] Order #${orderCode} Status Updated to ${status}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                            <h2 style="color: #0284c7;">WashWise Order Status Update</h2>
                            <p>Hi <strong>${customer.username}</strong>,</p>
                            <p>Great news! Your laundry order <strong>#${orderCode}</strong> has moved to a new milestone:</p>
                            <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 16px;">Current Status: <strong style="text-transform: uppercase; color: #0284c7;">${status}</strong></p>
                            </div>
                            <p>You can track the live status of your order anytime on the <a href="http://localhost:3000/member/dashboard" style="color: #0284c7; text-decoration: none; font-weight: bold;">WashWise Dashboard</a>.</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #666;">This is an automated notification from WashWise. Please do not reply directly to this email.</p>
                        </div>
                    `
                });
            }
        } catch (emailError) {
            console.error("Member status update email failed:", emailError);
        }

		// Award loyalty points if order is closed
		if (status === "closed") {
			const { awardPointsForOrder } = await import("../../../lib/rewards-util");
			await awardPointsForOrder(order.userId.toString(), orderId);
		}

        return NextResponse.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Update Status Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
