import { getDb } from "../../../config/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
    try {
        const db = await getDb();
        
        // 1. Total Customers
        const totalCustomers = await db.collection("users").countDocuments({ role: "member" });
        
        // 2. Active Orders (not draft, not completed)
        const activeOrders = await db.collection("orders").countDocuments({ 
            status: { $in: ["confirmed", "Processing", "In Transit", "Ready"] } 
        });

        // 3. Total Services Processed
        const orders = await db.collection("orders").find({ status: { $ne: "draft" } }).toArray();
        const totalServices = orders.reduce((acc, order) => acc + (order.services?.length || 0), 0);

        // 4. Revenue & Analytics from checkouts
        const checkouts = await db.collection("checkouts").find().toArray();
        const totalRevenue = checkouts.reduce((acc, checkout) => acc + (checkout.finalTotal || 0), 0);
        const completedJobs = await db.collection("orders").countDocuments({ status: "Completed" });
        const avgOrderValue = checkouts.length > 0 ? totalRevenue / checkouts.length : 0;

        // 5. Recent Orders with user details
        const recentOrdersRaw = await db.collection("orders").aggregate([
            { $match: { status: { $ne: "draft" } } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }
        ]).toArray();

        const recentOrders = recentOrdersRaw.map(order => ({
            id: order._id.toString(),
            orderNumber: order._id.toString().slice(-6).toUpperCase(),
            service: order.services?.[0]?.name || "Laundry Service",
            date: new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            amount: `\u20B1${(order.subtotal || 0).toLocaleString()}`,
            status: order.status === "confirmed" ? "Processing" : order.status,
            customer: order.userDetails?.username || order.userDetails?.email || "Unknown"
        }));

        const dashboardData = {
            stats: [
                { id: "customers", label: "Total Customers", value: totalCustomers, icon: "users", accent: "primary" },
                { id: "orders", label: "Active Orders", value: activeOrders, icon: "orders", accent: "info" },
                { id: "items", label: "Services Processed", value: totalServices, icon: "items", accent: "success" }
            ],
            analytics: [
                { id: "revenue", label: "Total Revenue", value: `\u20B1${totalRevenue.toLocaleString()}`, trend: "+12%", trendDirection: "up" },
                { id: "completed", label: "Completed Jobs", value: completedJobs.toString(), trend: "+5%", trendDirection: "up" },
                { id: "avg_value", label: "Avg. Order Value", value: `\u20B1${avgOrderValue.toFixed(2)}`, trend: "-2%", trendDirection: "down" }
            ],
            quickStats: [
                { id: "pending_pickup", label: "Pending Pickups", value: await db.collection("checkouts").countDocuments({ serviceMethod: "pickup" }) },
                { id: "pending_delivery", label: "Pending Deliveries", value: await db.collection("checkouts").countDocuments({ serviceMethod: "delivery" }) }
            ],
            recentOrders
        };

        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}