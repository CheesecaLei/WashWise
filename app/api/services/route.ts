import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../config/mongodb";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : null;
		const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : null;

		const db = await getDb();
		const servicesCollection = db.collection("services");

		let services;
		let pagination = null;

		if (page !== null && limit !== null) {
			const skip = (page - 1) * limit;
			const totalCount = await servicesCollection.countDocuments({});
			services = await servicesCollection.find({}).skip(skip).limit(limit).toArray();
			pagination = {
				total: totalCount,
				page,
				limit,
				totalPages: Math.ceil(totalCount / limit)
			};
		} else {
			services = await servicesCollection.find({}).toArray();
		}

		return NextResponse.json({ success: true, services, pagination });
	} catch (error) {
		console.error("Error fetching services:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
