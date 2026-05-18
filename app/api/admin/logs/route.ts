import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../config/mongodb";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const db = await getDb();
        const logsCollection = db.collection("logs");
        
        // Count total logs
        const totalCount = await logsCollection.countDocuments();

        // Fetch paginated logs
        const logsRaw = await logsCollection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
        
        const logs = logsRaw.map(log => {
            const minutesAgo = Math.floor((new Date().getTime() - new Date(log.createdAt).getTime()) / 60000);
            
            return {
                id: log._id.toString(),
                type: log.type,
                orderCode: log.orderCode || "N/A",
                customerName: log.customerName || "N/A",
                quantity: log.quantity || 0,
                performedBy: log.performedBy,
                minutesAgo: minutesAgo < 1 ? 0 : minutesAgo,
                details: log.details || "",
                createdAt: log.createdAt
            };
        });

        // Fetch current order status counts for stats cards
        const ordersCollection = db.collection("orders");
        const [completed, inProgress, ready, outDelivery] = await Promise.all([
            ordersCollection.countDocuments({ status: "closed" }),
            ordersCollection.countDocuments({ status: "in-progress" }),
            ordersCollection.countDocuments({ status: "ready" }),
            ordersCollection.countDocuments({ status: "out-for-delivery" }),
        ]);

        // Activity Stats
        const stats = [
            { id: "completed", label: "Completed Order", value: completed, color: "success", icon: "completed" },
            { id: "processing", label: "In Progress", value: inProgress, color: "warning", icon: "processing" },
            { id: "ready", label: "Ready for Pickup/Delivery", value: ready, color: "primary", icon: "ready" },
            { id: "deliveries", label: "Out for Delivery", value: outDelivery, color: "info", icon: "deliveries" },
        ];

        return NextResponse.json({ 
            logs, 
            stats,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("Logs API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
