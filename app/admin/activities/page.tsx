"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Truck, Activity, UserCog, UserMinus, RefreshCcw, Package, Clock } from "lucide-react";
import {
	alpha,
	Avatar,
	Box,
	Grid,
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	IconButton,
} from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import PremiumPagination from "../../components/pagination";
import { useActivities } from "../../hooks/use-activities";


function getActivityIcon(type: string) {
	const iconProps = { size: 18, strokeWidth: 1.9 };

	switch (type) {
		case "order-received":
			return <AlertCircle {...iconProps} />;
		case "order-completed":
			return <CheckCircle2 {...iconProps} />;
		case "delivery-completed":
			return <Truck {...iconProps} />;
		case "order-delayed":
			return <Activity {...iconProps} />;
		case "user-updated":
			return <UserCog {...iconProps} />;
		case "user-deleted":
			return <UserMinus {...iconProps} />;
		default:
			return <Activity {...iconProps} />;
	}
}

function getActivityColor(type: string) {
	switch (type) {
		case "order-received":
			return "primary";
		case "order-completed":
			return "success";
		case "delivery-completed":
			return "info";
		case "order-delayed":
			return "warning";
		case "user-updated":
			return "secondary";
		case "user-deleted":
			return "error";
		default:
			return "neutral";
	}
}

function getActivityLabel(type: string) {
	switch (type) {
		case "order-received":
			return "Order Received";
		case "order-completed":
			return "Order Completed";
		case "delivery-completed":
			return "Delivery Completed";
		case "order-delayed":
			return "Order Delayed";
		case "user-updated":
			return "User Account Updated";
		case "user-deleted":
			return "User Account Deleted";
		default:
			return "System Activity";
	}
}

function getActivityStatIcon(icon: string) {
	const iconProps = { size: 18, strokeWidth: 1.9 };

	switch (icon) {
		case "completed":
			return <CheckCircle2 {...iconProps} />;
		case "ready":
			return <Package {...iconProps} />;
		case "deliveries":
			return <Truck {...iconProps} />;
		case "processing":
			return <Clock {...iconProps} />;
		default:
			return <Activity {...iconProps} />;
	}
}

export default function ActivitiesPage() {
	const { logs, stats, loading, error, page, setPage, pagination, refresh: fetchLogs } = useActivities();

	if (loading && logs.length === 0) {
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
								Activities
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: 12 }}>
								View and manage system activities and logs.
							</Typography>
						</Box>
						<IconButton onClick={fetchLogs} disabled={loading} size="small">
							<RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
						</IconButton>
					</Stack>

					{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

					<Grid container spacing={1.5} mb={2.5}>
						{stats.map((stat) => {
							return (
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
										<Avatar
											sx={{
												width: 36,
												height: 36,
												mx: "auto",
												mb: 1,
												bgcolor: (theme) => {
													const color = stat.color as "primary" | "secondary" | "success" | "error" | "info" | "warning";
													return alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.13);
												},
												color: `${stat.color}.main`,
											}}
										>
											{getActivityStatIcon(stat.icon)}
										</Avatar>
										<Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1, mb: 0.4 }}>
											{stat.value}
										</Typography>
										<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
											{stat.label}
										</Typography>
									</Paper>
								</Grid>
							);
						})}
					</Grid>

					<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
						<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
							Recent Activities
						</Typography>

						<Stack spacing={1}>
							{logs.length > 0 ? (
								logs.map((activity) => (
									<Paper
										key={activity.id}
										elevation={0}
										sx={{
											border: 1,
											borderColor: "divider",
											borderRadius: 1.2,
											p: 1.2,
											bgcolor: "background.default",
										}}
									>
										<Stack direction="row" spacing={1} alignItems="flex-start">
											<Avatar
												sx={{
													width: 36,
													height: 36,
													bgcolor: (theme) => {
														const color = getActivityColor(activity.type) as "primary" | "secondary" | "success" | "error" | "info" | "warning";
														return alpha(theme.palette[color]?.main || theme.palette.grey[400], 0.13);
													},
													color: `${getActivityColor(activity.type)}.main`,
													flexShrink: 0,
												}}
											>
												{getActivityIcon(activity.type)}
											</Avatar>

											<Box flex={1}>
												<Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
													<Box>
														<Typography sx={{ fontWeight: 700, fontSize: 13 }}>
															{getActivityLabel(activity.type)}
														</Typography>
														<Typography sx={{ fontWeight: 600, fontSize: 12, color: "primary.main", mt: 0.2 }}>
															{activity.orderCode !== "N/A" ? `${activity.orderCode} from ${activity.customerName}` : activity.customerName}
															{activity.quantity > 0 ? ` - ${activity.quantity} services` : ""}
														</Typography>
													</Box>
													<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", ml: 1 }}>
														{activity.minutesAgo === 0 ? "Just now" : `${activity.minutesAgo} mins ago`}
													</Typography>
												</Stack>
												<Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>
													By: {activity.performedBy} {(activity as Record<string, unknown>).details ? ` - ${(activity as Record<string, unknown>).details}` : ""}
												</Typography>
											</Box>
										</Stack>
									</Paper>
								))
							) : (
								<Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>No recent activities.</Typography>
							)}
						</Stack>

						{pagination && pagination.totalPages > 1 && (
							<PremiumPagination
								page={page}
								count={pagination.totalPages}
								onChange={(_, value) => setPage(value)}
								totalItems={pagination.total}
								rowsPerPage={pagination.limit}
								loading={loading}
							/>
						)}
					</Paper>
				</Box>

				<Footer />
			</Box>
		</Box>
	);
}
