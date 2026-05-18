"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveOrder, OrderStatus, ProgressStat } from "../types/dashboard";

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useOrderProgress() {
    const [orders, setOrders] = useState<LiveOrder[]>([]);
    const [stats, setStats] = useState<ProgressStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);

    const fetchData = useCallback(async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/service-mng?page=${pageNum}&limit=10`);
            if (!response.ok) throw new Error("Failed to fetch progress data");
            const data = await response.json();
            setOrders(data.orders);
            setStats(data.stats);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError("Unable to load progress data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        try {
            setUpdatingId(orderId);
            const response = await fetch("/api/admin/service-mng", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status }),
            });

            if (!response.ok) throw new Error("Failed to update status");
            
            // Local update for responsiveness
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            return { ok: true };
        } catch (err) {
            console.error(err);
            return { ok: false, error: "Failed to update status." };
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [fetchData, page]);

    return {
        orders,
        stats,
        loading,
        error,
        updatingId,
        page,
        setPage,
        pagination,
        refresh: () => fetchData(page),
        updateStatus,
    };
}
