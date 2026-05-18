"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportMetric, ServiceReport } from "../types/dashboard";

export function useReports() {
    const [metrics, setMetrics] = useState<ReportMetric[]>([]);
    const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/report-gen");
            if (!response.ok) throw new Error("Failed to fetch reports");
            const data = await response.json();
            setMetrics(data.metrics);
            setServiceReports(data.serviceReports);
            setError(null);
        } catch (err) {
            setError("Unable to load report data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const downloadExcel = () => {
        if (serviceReports.length === 0) return;

        // Prepare CSV data with proper formatting
        const headers = ["Service Name", "Orders", "Revenue", "Avg Value", "Growth"];
        
        // Convert service reports to CSV rows
        const rows = serviceReports.map(service => [
            service.name,
            service.orders.toString(),
            service.revenue,
            service.average,
            service.growth
        ]);

        // Create CSV content
        const csvContent = [
            // Add title and metadata
            [`WashWise Service Performance Report`],
            [`Generated: ${new Date().toLocaleString()}`],
            [], // Empty row for spacing
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
        link.download = `washwise-service-report-${new Date().toISOString().split('T')[0]}.csv`;
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
        loading,
        error,
        refresh: fetchData,
        downloadExcel,
    };
}
