"use client";

import { useState } from "react";
import { MoreVertical, Mail, Phone, RefreshCcw, Trash2, UserCheck, UserX } from "lucide-react";
import {
	Avatar,
	Box,
	Chip,
	Grid,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	CircularProgress,
	Alert,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import PremiumPagination from "../../components/pagination";
import { useUserManagement } from "../../hooks/use-user-management";
import type { UserStatus } from "../../types/dashboard";

function getStatusColor(status: UserStatus) {
	const colors: Record<UserStatus, "success" | "warning" | "error"> = {
		active: "success",
		inactive: "warning",
		suspended: "error",
	};
	return colors[status] || "default";
}

function getStatusLabel(status: UserStatus) {
	const labels: Record<UserStatus, string> = {
		active: "Active",
		inactive: "Inactive",
		suspended: "Suspended",
	};
	return labels[status] || status;
}

export default function UserManagementPage() {
	const { users, stats, loading, error, page, setPage, pagination, refresh, updateUserStatus, deleteUser } = useUserManagement();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
		setAnchorEl(event.currentTarget);
		setSelectedUserId(userId);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedUserId(null);
	};

	const handleAction = async (action: 'active' | 'suspended' | 'delete') => {
		if (!selectedUserId) return;

		if (action === 'delete') {
			if (confirm("Are you sure you want to delete this user?")) {
				await deleteUser(selectedUserId);
			}
		} else {
			await updateUserStatus(selectedUserId, action);
		}
		handleMenuClose();
	};

	if (loading && users.length === 0) {
		return (
			<Box sx={{ minHeight: "100dvh", display: "flex", bgcolor: "background.default" }}>
				<Sidebar />
				<Box component="main" sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={{ minHeight: "100dvh", display: "flex", bgcolor: "background.default" }}>
			<Sidebar />

			<Box
				component="main"
				sx={{
					flex: 1,
					minWidth: 0,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1.25, md: 2 }, flex: 1 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
						<Box>
							<Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 20, md: 24 }, mb: 0.3 }}>
								User Management
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: 12 }}>
								Manage and monitor user accounts and activities.
							</Typography>
						</Box>
						<IconButton onClick={refresh} disabled={loading} size="small">
							<RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
						</IconButton>
					</Stack>

					{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

					<Grid container spacing={1.5} mb={2.5}>
						{stats.map((stat) => (
							<Grid key={stat.id} size={{ xs: 12, md: 6, lg: 3 }}>
								<Paper
									elevation={0}
									sx={{
										p: 1.8,
										borderRadius: 1.5,
										border: 1,
										borderColor: "divider",
										textAlign: "center",
									}}
								>
									<Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1, mb: 0.4, color: `${stat.color}.main` }}>
										{stat.value.toLocaleString()}
									</Typography>
									<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
										{stat.label}
									</Typography>
								</Paper>
							</Grid>
						))}
					</Grid>

					<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
						<Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
							<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
								User Accounts
							</Typography>
						</Box>

						<Box sx={{ overflowX: "auto" }}>
							<Table size="small" sx={{ minWidth: { xs: 640, md: 800 } }}>
								<TableHead>
									<TableRow sx={{ bgcolor: "background.default" }}>
										<TableCell sx={{ fontWeight: 700, fontSize: 11 }}>User</TableCell>
										<TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Email</TableCell>
										<TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Phone</TableCell>
										<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>
											Orders
										</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, fontSize: 11 }}>
											Total Spent
										</TableCell>
										<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>
											Status
										</TableCell>
										<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>
											Action
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{users.length > 0 ? (
										users.map((user) => (
											<TableRow key={user.id} sx={{ "&:hover": { bgcolor: "background.default" } }}>
												<TableCell sx={{ fontSize: 12 }}>
													<Stack direction="row" spacing={1} alignItems="center">
														<Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: 'primary.light' }}>
															{user.name.charAt(0).toUpperCase()}
														</Avatar>
														<Box>
															<Typography sx={{ fontWeight: 700, fontSize: 12 }}>{user.name}</Typography>
															<Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>
																Joined {user.joinDate}
															</Typography>
														</Box>
													</Stack>
												</TableCell>
												<TableCell sx={{ fontSize: 11 }}>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Mail size={13} className="text-gray-400" />
														<Typography sx={{ fontSize: 11 }}>{user.email}</Typography>
													</Stack>
												</TableCell>
												<TableCell sx={{ fontSize: 11 }}>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Phone size={13} className="text-gray-400" />
														<Typography sx={{ fontSize: 11 }}>{user.phone}</Typography>
													</Stack>
												</TableCell>
												<TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>
													{user.orders}
												</TableCell>
												<TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: "success.main" }}>
													{user.totalSpent}
												</TableCell>
												<TableCell align="center">
													<Chip
														label={getStatusLabel(user.status)}
														color={getStatusColor(user.status)}
														size="small"
														sx={{ height: 22, fontSize: 10, minWidth: 70 }}
													/>
												</TableCell>
												<TableCell align="center">
													<IconButton 
														size="small" 
														sx={{ color: "text.secondary" }}
														onClick={(e) => handleMenuOpen(e, user.id)}
													>
														<MoreVertical size={14} />
													</IconButton>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 4 }}>
												<Typography variant="body2" color="text.secondary">No users found.</Typography>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</Box>

						{pagination && pagination.totalPages > 1 && (
							<Box sx={{ p: 1 }}>
								<PremiumPagination
									page={page}
									count={pagination.totalPages}
									onChange={(_, value) => setPage(value)}
									totalItems={pagination.total}
									rowsPerPage={pagination.limit}
									loading={loading}
								/>
							</Box>
						)}
					</Paper>
				</Box>

				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
					PaperProps={{
						elevation: 3,
						sx: { minWidth: 160, borderRadius: 1.5 }
					}}
				>
					<MenuItem onClick={() => handleAction('active')}>
						<ListItemIcon><UserCheck size={16} className="text-green-600" /></ListItemIcon>
						<ListItemText primary="Activate User" primaryTypographyProps={{ fontSize: 13 }} />
					</MenuItem>
					<MenuItem onClick={() => handleAction('suspended')}>
						<ListItemIcon><UserX size={16} className="text-orange-600" /></ListItemIcon>
						<ListItemText primary="Suspend User" primaryTypographyProps={{ fontSize: 13 }} />
					</MenuItem>
					<MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
						<ListItemIcon><Trash2 size={16} className="text-red-600" /></ListItemIcon>
						<ListItemText primary="Delete Account" primaryTypographyProps={{ fontSize: 13 }} />
					</MenuItem>
				</Menu>

				<Footer />
			</Box>
		</Box>
	);
}
