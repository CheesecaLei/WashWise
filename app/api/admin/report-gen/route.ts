import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../config/mongodb";

export async function GET(_request: NextRequest) {
    try {
        const db = await getDb();
        
        // 1. Fetch data
        const usersCount = await db.collection("users").countDocuments({ role: { $ne: "admin" } });
        const orders = await db.collection("orders").find({ status: { $ne: "draft" } }).toArray();
        const checkouts = await db.collection("checkouts").find().toArray();
        
        // 2. Metrics
        const totalRevenue = checkouts.reduce((acc, c) => acc + (c.finalTotal || 0), 0);
        const totalOrders = orders.length;
        
        // Calculate growth (mocked for now as we need historical data)
        const metrics = [
            { id: "revenue", label: "Total Revenue", value: `\u20B1${totalRevenue.toLocaleString()}`, change: "+12.5%", changeType: "positive", icon: "revenue" },
            { id: "orders", label: "Total Orders", value: totalOrders.toString(), change: "+8.2%", changeType: "positive", icon: "orders" },
            { id: "customers", label: "Active Customers", value: usersCount.toString(), change: "+5.1%", changeType: "positive", icon: "customers" },
            { id: "views", label: "Page Views", value: "1,284", change: "-2.4%", changeType: "negative", icon: "views" },
        ];

        // 3. Service Performance Report
        // Group orders by service using the clarified structure
        const serviceMap: Record<string, { orders: number; revenue: number }> = {};
        
        orders.forEach(order => {
            const orderServices = order.services || [];
            orderServices.forEach((s: any) => {
                const name = s.label || s.name || "Unknown Service";
                const lineTotal = Number(s.lineTotal) || 0;
                
                if (!serviceMap[name]) {
                    serviceMap[name] = { orders: 0, revenue: 0 };
                }
                serviceMap[name].orders += 1;
                serviceMap[name].revenue += lineTotal;
            });
        });

        const serviceReports = Object.entries(serviceMap).map(([name, data], index) => {
            return {
                id: (index + 1).toString(),
                name,
                orders: data.orders,
                revenue: `\u20B1${data.revenue.toLocaleString()}`,
                average: `\u20B1${(data.orders > 0 ? data.revenue / data.orders : 0).toFixed(2)}`,
                growth: "+4.5%" // Mocked as we lack historical comparison data
            };
        });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const ordersToday = await db.collection("orders").find({
            status: { $ne: "draft" },
            createdAt: { $gte: startOfDay }
        }).toArray();
        const weightToday = ordersToday.reduce((acc, o) => acc + (Number(o.totalWeight) || 0), 0);

        return NextResponse.json({
            metrics,
            serviceReports,
            weightToday,
            checkouts: checkouts.map(c => ({
                finalTotal: c.finalTotal || 0,
                paymentStatus: c.paymentStatus || "unpaid",
                createdAt: c.createdAt || new Date().toISOString()
            }))
        });
    } catch (error) {
        console.error("Report API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
