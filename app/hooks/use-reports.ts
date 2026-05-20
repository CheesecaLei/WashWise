"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportMetric, ServiceReport } from "../types/dashboard";

export function useReports() {
    const [metrics, setMetrics] = useState<ReportMetric[]>([]);
    const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
    const [checkouts, setCheckouts] = useState<{ finalTotal?: number; paymentStatus?: string; createdAt?: string }[]>([]);
    const [weightToday, setWeightToday] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/report-gen");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch reports");
            setMetrics(data.metrics);
            setServiceReports(data.serviceReports);
            setCheckouts(data.checkouts || []);
            setWeightToday(data.weightToday || 0);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load report data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const downloadExcel = (timeFilter: "all" | "month" | "week" = "all") => {
        if (checkouts.length === 0) return;

        let filteredCheckouts = checkouts;
        const now = new Date();
        if (timeFilter === "month") {
            filteredCheckouts = checkouts.filter(c => {
                if (!c.createdAt) return false;
                const d = new Date(c.createdAt);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (timeFilter === "week") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredCheckouts = checkouts.filter(c => {
                if (!c.createdAt) return false;
                return new Date(c.createdAt) >= weekAgo;
            });
        }

        // Prepare CSV data with proper formatting
        const headers = ["Date", "Total Price", "Payment Status"];
        
        // Convert checkouts to CSV rows
        const rows = filteredCheckouts.map(c => [
            c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A",
            `₱${(c.finalTotal || 0).toFixed(2)}`,
            c.paymentStatus === "paid" ? "Realized" : "Pending"
        ]);

        // Create CSV content
        const csvContent = [
            // Add headers
            headers,
            // Add data rows
            ...rows
        ].map(row => 
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');

        // Create blob with UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `washwise-financial-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    };

    return {
        metrics,
        serviceReports,
        checkouts,
        weightToday,
        loading,
        error,
        refresh: fetchData,
        downloadExcel,
    };
}
