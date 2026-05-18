import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../config/mongodb";
import { recordActivity } from "../../../lib/logger";
import { pusherServer } from "../../../lib/pusher";
import { broadcastToSubscriptions } from "../../../lib/push";
import { broadcastSms } from "../../../lib/sms";
import { calculateFinalCost, validateFinalCost, formatPricingBreakdown } from "../../../lib/pricing";
import type { CreateCheckoutRequest } from "../../../types/new-order";

export async function POST(request: NextRequest) {
	try {
		const userId = request.headers.get("x-user-id");
		if (!userId || !ObjectId.isValid(userId)) {
			return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		let body: CreateCheckoutRequest;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
		}

		if (!body.orderId || !ObjectId.isValid(body.orderId)) {
			return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
		}

		const db = await getDb();
		const ordersCollection = db.collection("orders");
		const checkoutsCollection = db.collection("checkouts");

		// Verify the order exists and belongs to the user
		const order = await ordersCollection.findOne({
			_id: new ObjectId(body.orderId),
			userId: new ObjectId(userId),
		});

		if (!order) {
			return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
		}

		if (order.status === "confirmed") {
			return NextResponse.json({ success: false, error: "Order is already confirmed" }, { status: 400 });
		}

		// ── Automatic Cost Calculation & Validation ────────────────────────────
		// Ensures totalCost = subtotal + logistics - promoDiscount - loyaltyDiscount
		// This prevents client-side tampering with pricing.
		const loyaltyDiscount = body.loyaltyDiscount || 0;
		const breakdown = calculateFinalCost({
			subtotal: order.subtotal || 0,
			logisticsFee: body.logisticsFee,
			promoDiscount: body.promoDiscount,
			loyaltyDiscount,
		});

		if (!validateFinalCost(body.finalTotal, breakdown.finalTotal)) {
			console.warn(`[Payment] Price mismatch: expected ₱${breakdown.finalTotal.toFixed(2)}, got ₱${body.finalTotal.toFixed(2)}`);
			return NextResponse.json({
				success: false,
				error: `Price mismatch. Expected: ₱${breakdown.finalTotal.toFixed(2)}, got: ₱${body.finalTotal.toFixed(2)}`
			}, { status: 400 });
		}

		// Create checkout transaction
		const newCheckout = {
			orderId: new ObjectId(body.orderId),
			userId: new ObjectId(userId),
			serviceMethod: body.serviceMethod,
			streetAddress: body.streetAddress || "",
			barangay: body.barangay || "",
			city: body.city || "",
			selectedSlot: body.selectedSlot || "",
			paymentMethod: body.paymentMethod || "COD",
			logisticsFee: body.logisticsFee,
			promoDiscount: body.promoDiscount,
			loyaltyDiscount,
			finalTotal: body.finalTotal,
			// Payment status remains unpaid until admin records receipt
			paymentStatus: "unpaid",
			createdAt: new Date(),
		};

		const result = await checkoutsCollection.insertOne(newCheckout);

		// Update order status — BUT DO NOT change paymentStatus yet
		// paymentStatus should only change when payment is actually received
		await ordersCollection.updateOne(
			{ _id: new ObjectId(body.orderId) },
			{ 
				$set: { 
					status: "waiting", 
					loyaltyDiscount,
					updatedAt: new Date()
				} 
			}
		);

		// Record activity
		const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
		await recordActivity({
			type: "order-received",
			orderCode: body.orderId.toString().slice(-6).toUpperCase(),
			customerName: user?.username || "Guest",
			quantity: order.services?.length || 0,
			performedBy: user?.username || "Guest",
			pricingBreakdown: formatPricingBreakdown(breakdown),
		});

		// Trigger Pusher notification for Admin
		try {
			await pusherServer.trigger("admin-notifications", "new-order", {
				orderId: body.orderId,
				customerName: user?.username || "Guest",
			});
		} catch (pusherError) {
			console.error("Pusher trigger failed:", pusherError);
		}

		// Trigger Push Notification for all Admins
		try {
			const admins = await db.collection("users").find({ role: "admin" }).toArray();
			console.log(`[Push] Found ${admins.length} admin(s). Checking subscriptions...`);
			const allAdminSubscriptions = admins.flatMap(admin => admin.pushSubscriptions || []);
			console.log(`[Push] Total admin push subscriptions: ${allAdminSubscriptions.length}`);

			if (allAdminSubscriptions.length > 0) {
				await broadcastToSubscriptions(allAdminSubscriptions, {
					title: "New Order Received! 🧺",
					body: `Order #${body.orderId.toString().slice(-6).toUpperCase()} from ${user?.username || "Guest"}`,
					url: "/admin/scheduling"
				});
				console.log(`[Push] Admin broadcast sent.`);
			} else {
				console.warn(`[Push] No admin subscriptions found. Admins must enable notifications.`);
			}
		} catch (pushError) {
			console.error("Admin push notification failed:", pushError);
		}

		// SMS all Admins
		try {
			// Re-use admins list already fetched above
			const admins = await db.collection("users").find({ role: "admin" }).toArray();
			const orderCode = body.orderId.toString().slice(-6).toUpperCase();
			await broadcastSms(
				admins,
				`[WashWise] New Order! #${orderCode} from ${user?.username || "Guest"}. Check the admin panel for details.`
			);
		} catch (smsError) {
			console.error("Admin SMS failed:", smsError);
		}

		return NextResponse.json({
			success: true,
			transactionId: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Error creating checkout transaction:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, status } = body;

        if (!orderId || !ObjectId.isValid(orderId) || !status) {
            return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
        }

        const db = await getDb();
        const result = await db.collection("orders").updateOne(
            { _id: new ObjectId(orderId), userId: new ObjectId(userId) },
            { $set: { status, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}