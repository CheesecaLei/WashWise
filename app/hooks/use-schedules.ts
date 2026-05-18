"use client";

import { useState, useEffect, useCallback } from "react";

export interface Schedule {
    id: string;
    orderId: string;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    serviceMethod: "pickup" | "dropoff";
    selectedSlot: string;
    status: string;
    finalTotal: number;
    address: string;
    createdAt: string;
    // Payment status tracking
    paymentStatus: "unpaid" | "partially_paid" | "paid" | "refunded";
    // Weight tracking
    totalWeight: number;
    // Handover timestamps (ISO string or null)
    pickedUpAt: string | null;
    receivedByStaffAt: string | null;
    receivedByClientAt: string | null;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useSchedules() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);

    const fetchSchedules = useCallback(async (pageNum: number = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/scheduling?page=${pageNum}&limit=10`);
            const data = await response.json();

            if (data.success) {
                setSchedules(data.schedules);
                setPagination(data.pagination);
            } else {
                setError(data.error || "Failed to fetch schedules");
            }
        } catch (err) {
            setError("An error occurred while fetching schedules");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules(page);
    }, [fetchSchedules, page]);

    return {
        schedules,
        loading,
        error,
        page,
        setPage,
        pagination,
        refresh: () => fetchSchedules(page)
    };
}
