import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../config/mongodb";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const db = await getDb();
        const checkoutsCollection = db.collection("checkouts");

        // Count total schedules
        const totalCount = await checkoutsCollection.countDocuments();

        const schedules = await checkoutsCollection.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "orders",
                    localField: "orderId",
                    foreignField: "_id",
                    as: "order"
                }
            },
            { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } }
        ]).toArray();

        const formattedSchedules = schedules.map(item => {
            const orderId = item.order?._id?.toString() || item.orderId?.toString() || "";
            return {
                id: item._id.toString(),
                orderId: orderId,
                orderCode: orderId.slice(-6).toUpperCase(),
                customerName: item.customer?.username || "Guest",
                customerPhone: item.customer?.contactNo || "N/A",
                serviceMethod: item.serviceMethod,
                selectedSlot: item.selectedSlot || "N/A",
                status: item.order?.status || "pending",
                finalTotal: item.finalTotal,
                address: item.serviceMethod === "pickup" ? `${item.streetAddress}, ${item.barangay}, ${item.city}` : "Drop-off at Store",
                createdAt: item.createdAt,
                // Payment status — for consistent processing tracking
                paymentStatus: item.paymentStatus || item.order?.paymentStatus || "unpaid",
                // Weight tracking — for load management
                totalWeight: item.order?.totalWeight || 0,
                // Handover timestamps — for physical possession confirmation
                pickedUpAt: item.order?.pickedUpAt || null,
                receivedByStaffAt: item.order?.receivedByStaffAt || null,
                receivedByClientAt: item.order?.receivedByClientAt || null,
            };
        });

        return NextResponse.json({ 
            success: true, 
            schedules: formattedSchedules,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
