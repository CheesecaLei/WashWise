import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../config/mongodb";
import { recordActivity } from "../../../../lib/logger";

/**
 * Admin endpoint to record payment received for an order.
 * 
 * Only marks paymentStatus as "paid" when payment is explicitly received by admin.
 * Follows industry standard: order created → unpaid → payment recorded → paid
 *
 * Body: {
 *   orderId: string (MongoDB ObjectId)
 *   amount: number (payment amount received)
 *   method?: string (e.g., "cash", "online", "check")
 *   notes?: string (additional notes)
 * }
 */
export async function PATCH(request: NextRequest) {
	try {
		// Verify admin role
		const userRole = request.headers.get("x-user-role");
		if (userRole !== "admin") {
			return NextResponse.json(
				{ success: false, error: "Unauthorized. Admin access required." },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { orderId, amount, method = "COD", notes = "" } = body;

		if (!orderId || !ObjectId.isValid(orderId)) {
			return NextResponse.json(
				{ success: false, error: "Invalid order ID" },
				{ status: 400 }
			);
		}

		if (amount === undefined || amount < 0) {
			return NextResponse.json(
				{ success: false, error: "Invalid payment amount" },
				{ status: 400 }
			);
		}

		const db = await getDb();
		const ordersCollection = db.collection("orders");
		const checkoutsCollection = db.collection("checkouts");

		// Verify order exists and get current status
		const order = await ordersCollection.findOne({
			_id: new ObjectId(orderId),
		});

		if (!order) {
			return NextResponse.json(
				{ success: false, error: "Order not found" },
				{ status: 404 }
			);
		}

		// Update order paymentStatus to "paid"
		await ordersCollection.updateOne(
			{ _id: new ObjectId(orderId) },
			{
				$set: {
					paymentStatus: "paid",
					updatedAt: new Date(),
				},
			}
		);

		// Also update the associated checkout record
		await checkoutsCollection.updateOne(
			{ orderId: new ObjectId(orderId) },
			{
				$set: {
					paymentStatus: "paid",
					paymentReceivedAt: new Date(),
					paymentAmount: amount,
					paymentMethod: method,
				},
			}
		);

		// Record activity for audit trail
		const admin = await db.collection("users").findOne({
			_id: new ObjectId(request.headers.get("x-user-id")),
		});

		await recordActivity({
			type: "payment-received",
			orderCode: orderId.toString().slice(-6).toUpperCase(),
			paymentAmount: amount,
			paymentMethod: method,
			performedBy: admin?.username || "Admin",
			notes,
		});

		return NextResponse.json({
			success: true,
			message: `Payment of ₱${amount.toFixed(2)} recorded successfully`,
			order: {
				_id: orderId,
				paymentStatus: "paid",
				paymentAmount: amount,
				paymentMethod: method,
				paymentReceivedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Error recording payment:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * GET endpoint to fetch payment status for an order.
 * Query: ?orderId=<ObjectId>
 */
export async function GET(request: NextRequest) {
	try {
		const userRole = request.headers.get("x-user-role");
		if (userRole !== "admin") {
			return NextResponse.json(
				{ success: false, error: "Unauthorized. Admin access required." },
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const orderId = searchParams.get("orderId");

		if (!orderId || !ObjectId.isValid(orderId)) {
			return NextResponse.json(
				{ success: false, error: "Invalid order ID" },
				{ status: 400 }
			);
		}

		const db = await getDb();
		const ordersCollection = db.collection("orders");
		const checkoutsCollection = db.collection("checkouts");

		const order = await ordersCollection.findOne({
			_id: new ObjectId(orderId),
		});

		const checkout = await checkoutsCollection.findOne({
			orderId: new ObjectId(orderId),
		});

		if (!order) {
			return NextResponse.json(
				{ success: false, error: "Order not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			payment: {
				_id: orderId,
				paymentStatus: order.paymentStatus || "unpaid",
				finalTotal: checkout?.finalTotal || order.subtotal || 0,
				paymentAmount: checkout?.paymentAmount || null,
				paymentMethod: checkout?.paymentMethod || order.paymentMethod || "COD",
				paymentReceivedAt: checkout?.paymentReceivedAt?.toISOString() || null,
				createdAt: order.createdAt?.toISOString(),
				updatedAt: order.updatedAt?.toISOString(),
			},
		});
	} catch (error) {
		console.error("Error fetching payment status:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
