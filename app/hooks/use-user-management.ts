"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserAccount, UserStat } from "../types/dashboard";

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useUserManagement() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [stats, setStats] = useState<UserStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);

    const fetchUsers = useCallback(async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/user-mng?page=${pageNum}&limit=10`);
            if (!response.ok) throw new Error("Failed to fetch users");
            
            const data = await response.json();
            setUsers(data.users);
            setPagination(data.pagination);
            
            // Map API stats to UserStat type
            const mappedStats: UserStat[] = [
                { id: "total", label: "Total Users", value: data.stats.total, color: "primary" },
                { id: "active", label: "Active", value: data.stats.active, color: "success" },
                { id: "inactive", label: "Inactive", value: data.stats.inactive, color: "warning" },
                { id: "suspended", label: "Suspended", value: data.stats.suspended, color: "error" },
            ];
            setStats(mappedStats);
            setError(null);
        } catch (err) {
            setError("Unable to load user data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserStatus = async (userId: string, status: string) => {
        try {
            const response = await fetch("/api/admin/user-mng", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, updates: { status } }),
            });

            if (!response.ok) throw new Error("Failed to update user");
            
            await fetchUsers(page); // Refresh data on current page
            return { ok: true };
        } catch (err) {
            console.error(err);
            return { ok: false, error: "Failed to update user status." };
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const response = await fetch("/api/admin/user-mng", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) throw new Error("Failed to delete user");
            
            await fetchUsers(page); // Refresh data on current page
            return { ok: true };
        } catch (err) {
            console.error(err);
            return { ok: false, error: "Failed to delete user." };
        }
    };

    useEffect(() => {
        fetchUsers(page);
    }, [fetchUsers, page]);

    return {
        users,
        stats,
        loading,
        error,
        page,
        setPage,
        pagination,
        refresh: () => fetchUsers(page),
        updateUserStatus,
        deleteUser,
    };
}
