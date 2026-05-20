"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminStatCard, Activity, DashboardAnalyticsMetric, AdminQuickStat } from "../types/dashboard";

interface ExtendedActivity extends Activity {
    customer: string;
}

interface DashboardData {
    stats: AdminStatCard[];
    analytics: DashboardAnalyticsMetric[];
    quickStats: AdminQuickStat[];
    recentOrders: ExtendedActivity[];
}

export function useDashboardStats() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/dashboard");
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to fetch dashboard data");
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refresh: fetchData,
    };
}
