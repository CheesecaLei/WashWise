"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityLog, ActivityStat } from "../types/dashboard";

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useActivities() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<ActivityStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);

    const fetchData = useCallback(async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/logs?page=${pageNum}&limit=20`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch logs");
            setLogs(data.logs);
            setStats(data.stats);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load activity logs.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(page);
    }, [fetchData, page]);

    return {
        logs,
        stats,
        loading,
        error,
        page,
        setPage,
        pagination,
        refresh: () => fetchData(page),
    };
}
