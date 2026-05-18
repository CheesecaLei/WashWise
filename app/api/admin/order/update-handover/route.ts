import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../config/mongodb";

/**
 * Admin endpoint to record order handover milestones.
 * Updates: Picked Up, Received by Staff, Received by Client timestamps.
 *
 * Body: {
 *   orderId: string (MongoDB ObjectId)
 *   pickedUpAt?: ISO string | null
 *   receivedByStaffAt?: ISO string | null
 *   receivedByClientAt?: ISO string | null
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
		const { orderId, pickedUpAt, receivedByStaffAt, receivedByClientAt } = body;

		if (!orderId || !ObjectId.isValid(orderId)) {
			return NextResponse.json(
				{ success: false, error: "Invalid order ID" },
				{ status: 400 }
			);
		}

		const db = await getDb();
		const ordersCollection = db.collection("orders");

		// Build update object — only include fields that are explicitly provided
		const updateData: any = { updatedAt: new Date() };

		if (pickedUpAt !== undefined) {
			updateData.pickedUpAt = pickedUpAt ? new Date(pickedUpAt) : null;
		}
		if (receivedByStaffAt !== undefined) {
			updateData.receivedByStaffAt = receivedByStaffAt ? new Date(receivedByStaffAt) : null;
		}
		if (receivedByClientAt !== undefined) {
			updateData.receivedByClientAt = receivedByClientAt ? new Date(receivedByClientAt) : null;
		}

		// Verify order exists
		const order = await ordersCollection.findOne({
			_id: new ObjectId(orderId),
		});

		if (!order) {
			return NextResponse.json(
				{ success: false, error: "Order not found" },
				{ status: 404 }
			);
		}

		// Update order with new handover timestamps
		const result = await ordersCollection.updateOne(
			{ _id: new ObjectId(orderId) },
			{ $set: updateData }
		);

		if (result.modifiedCount === 0) {
			return NextResponse.json(
				{ success: false, error: "Failed to update order handover status" },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Order handover timestamps updated successfully",
			order: {
				_id: order._id.toString(),
				pickedUpAt: updateData.pickedUpAt?.toISOString() || null,
				receivedByStaffAt: updateData.receivedByStaffAt?.toISOString() || null,
				receivedByClientAt: updateData.receivedByClientAt?.toISOString() || null,
			},
		});
	} catch (error) {
		console.error("Error updating order handover status:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * GET endpoint to fetch order handover status and details.
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

		const order = await ordersCollection.findOne({
			_id: new ObjectId(orderId),
		});

		if (!order) {
			return NextResponse.json(
				{ success: false, error: "Order not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			order: {
				_id: order._id.toString(),
				status: order.status,
				paymentStatus: order.paymentStatus,
				totalWeight: order.totalWeight,
				pickedUpAt: order.pickedUpAt?.toISOString() || null,
				receivedByStaffAt: order.receivedByStaffAt?.toISOString() || null,
				receivedByClientAt: order.receivedByClientAt?.toISOString() || null,
				createdAt: order.createdAt?.toISOString(),
				updatedAt: order.updatedAt?.toISOString(),
			},
		});
	} catch (error) {
		console.error("Error fetching order handover status:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
