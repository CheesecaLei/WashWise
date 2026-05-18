import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../config/mongodb";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const db = await getDb();
		const servicesCollection = db.collection("services");
		const body = await request.json();

		const { _id, createdAt, ...updateData } = body;

		if (updateData.price) updateData.price = Number(updateData.price);
		updateData.updatedAt = new Date().toISOString();

		const result = await servicesCollection.findOneAndUpdate(
			{ _id: new ObjectId(id) },
			{ $set: updateData },
			{ returnDocument: 'after' }
		);

		if (!result) {
			return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, service: result });
	} catch (error) {
		console.error("Error updating service:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const db = await getDb();
		const servicesCollection = db.collection("services");

		const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 0) {
			return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: "Service deleted successfully" });
	} catch (error) {
		console.error("Error deleting service:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
