"use client";

import { useCallback, useState } from "react";

export interface RecordPaymentRequest {
	orderId: string;
	amount: number;
	method?: string;
	notes?: string;
}

export interface RecordPaymentResponse {
	success: boolean;
	message?: string;
	order?: {
		_id: string;
		paymentStatus: "paid";
		paymentAmount: number;
		paymentMethod: string;
		paymentReceivedAt: string;
	};
	error?: string;
}

/**
 * Admin hook for recording payment received.
 * Changes paymentStatus from "unpaid" to "paid" only when explicitly called.
 */
export function useRecordPayment() {
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const recordPayment = useCallback(
		async (request: RecordPaymentRequest): Promise<RecordPaymentResponse> => {
			setIsRecording(true);
			setError(null);

			try {
				const response = await fetch("/api/admin/order/record-payment", {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						"x-user-role": "admin",
					},
					body: JSON.stringify(request),
				});

				const data = (await response.json()) as RecordPaymentResponse;

				if (!response.ok || !data.success) {
					const errorMessage = data.error || "Failed to record payment";
					setError(errorMessage);
					return { success: false, error: errorMessage };
				}

				return data;
			} catch (err) {
				const errorMessage = "Network error. Please try again.";
				setError(errorMessage);
				return { success: false, error: errorMessage };
			} finally {
				setIsRecording(false);
			}
		},
		[]
	);

	return {
		isRecording,
		error,
		recordPayment,
	};
}
