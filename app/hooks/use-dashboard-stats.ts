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
            if (!response.ok) throw new Error("Failed to fetch dashboard data");
            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            setError("Unable to load dashboard data.");
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
