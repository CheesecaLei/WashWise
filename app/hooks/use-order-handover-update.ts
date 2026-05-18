"use client";

import { useCallback, useState } from "react";

export interface HandoverUpdateRequest {
	orderId: string;
	pickedUpAt?: string | null;
	receivedByStaffAt?: string | null;
	receivedByClientAt?: string | null;
}

export interface HandoverUpdateResponse {
	success: boolean;
	message?: string;
	order?: {
		_id: string;
		pickedUpAt: string | null;
		receivedByStaffAt: string | null;
		receivedByClientAt: string | null;
	};
	error?: string;
}

/**
 * Admin hook for updating order handover timestamps.
 * Records: Picked Up, Received by Staff, Received by Client milestones.
 */
export function useOrderHandoverUpdate() {
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateHandover = useCallback(
		async (request: HandoverUpdateRequest): Promise<HandoverUpdateResponse> => {
			setIsUpdating(true);
			setError(null);

			try {
				const response = await fetch("/api/admin/order/update-handover", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(request),
				});

				const data = (await response.json()) as HandoverUpdateResponse;

				if (!response.ok || !data.success) {
					const errorMessage = data.error || "Failed to update handover status";
					setError(errorMessage);
					return { success: false, error: errorMessage };
				}

				return data;
			} catch (err) {
				const errorMessage = "Network error. Please try again.";
				setError(errorMessage);
				return { success: false, error: errorMessage };
			} finally {
				setIsUpdating(false);
			}
		},
		[]
	);

	return {
		isUpdating,
		error,
		updateHandover,
	};
}
