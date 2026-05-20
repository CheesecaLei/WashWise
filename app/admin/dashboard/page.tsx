"use client";

import React from "react";
import {
	Box,
	Paper,
	Typography,
	Grid,
	Stack,
	Avatar,
	Chip,
	alpha,
	CircularProgress,
	Alert,
} from "@mui/material";
import { Users, FileText, PackageCheck, Receipt, ArrowDown, ArrowUp, RefreshCcw } from "lucide-react";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useDashboardStats } from "../../hooks/use-dashboard-stats";
import type { AdminStatCard, Activity, ActivityStatus, DashboardAnalyticsMetric, AdminQuickStat } from "../../types/dashboard";

interface ExtendedActivity extends Activity {
	customer: string;
}



function statIcon(icon: string) {
	const iconProps = { size: 20, strokeWidth: 1.9 };

	switch (icon) {
		case "users":
			return <Users {...iconProps} />;
		case "orders":
			return <FileText {...iconProps} />;
		case "items":
			return <PackageCheck {...iconProps} />;
		default:
			return <Receipt {...iconProps} />;
	}
}

function statColor(accent: string) {
	switch (accent) {
		case "primary":
			return "primary";
		case "info":
			return "info";
		case "success":
			return "success";
		default:
			return "primary";
	}
}

function statusColor(status: ActivityStatus | string) {
	switch (status) {
		case "Processing":
			return "warning" as const;
		case "In Transit":
			return "info" as const;
		case "Ready":
			return "success" as const;
		case "Completed":
			return "default" as const;
		default:
			return "default" as const;
	}
}

function trendColor(direction?: string) {
	if (direction === "down") {
		return "error.main";
	}

	return "success.main";
}

function trendIcon(direction?: string) {
	if (direction === "down") {
		return <ArrowDown size={16} />;
	}

	return <ArrowUp size={16} />;
}

export default function AdminDashboardPage() {
	const { data: dashboardData, loading, error, refresh: fetchDashboardData } = useDashboardStats();

	if (loading) {
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
					<Paper
						elevation={0}
						sx={{
							p: { xs: 1.5, md: 2 },
							borderRadius: 1.5,
							border: 1,
							borderColor: "divider",
							mb: 2,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						}}
					>
						<Box>
							<Typography variant="h5" sx={{ mb: 0.3, fontWeight: 700, fontSize: { xs: 20, md: 24 } }}>
								Dashboard
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: 13 }}>
								Real-time overview of your business metrics.
							</Typography>
						</Box>
						<RefreshCcw 
							size={20} 
							style={{ cursor: "pointer", color: "gray" }} 
							onClick={fetchDashboardData}
						/>
					</Paper>

					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
					)}

					{dashboardData && (
						<>
							<Grid container spacing={1.5} mb={2.5}>
								{dashboardData.stats.map((stat) => (
									<Grid key={stat.id} size={{ xs: 12, md: 6, lg: 4 }}>
										<Paper
											elevation={0}
											sx={{
												p: 1.8,
												borderRadius: 1.5,
												border: 1,
												borderColor: "divider",
												textAlign: "center",
												height: "100%",
												bgcolor: (theme) => {
													const color = statColor(stat.accent) as "primary" | "info" | "success";
													return alpha(theme.palette[color]?.main || theme.palette.primary.main, theme.palette.mode === "dark" ? 0.15 : 0.08);
												},
											}}
										>
											<Avatar
												sx={{
													width: 36,
													height: 36,
													mx: "auto",
													mb: 1,
													bgcolor: (theme) => {
														const color = statColor(stat.accent) as "primary" | "info" | "success";
														return alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.13);
													},
													color: `${statColor(stat.accent)}.main`,
												}}
											>
												{statIcon(stat.icon)}
											</Avatar>
											<Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1, mb: 0.4 }}>
												{stat.value.toLocaleString()}
											</Typography>
											<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12 }}>
												{stat.label}
											</Typography>
										</Paper>
									</Grid>
								))}
							</Grid>

							<Grid container spacing={1.5}>
								<Grid size={{ xs: 12, lg: 8 }}>
									<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
										<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
											Data Analytics
										</Typography>
										<Stack spacing={1}>
											{dashboardData.analytics.map((metric) => (
												<Box key={metric.id} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default" }}>
													<Stack direction="row" justifyContent="space-between" alignItems="center">
														<Stack>
															<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, mb: 0.3, fontSize: 11 }}>
																{metric.label}
															</Typography>
															<Typography sx={{ fontSize: 22, fontWeight: 800 }}>{metric.value}</Typography>
														</Stack>

														<Stack direction="row" alignItems="center" sx={{ color: trendColor(metric.trendDirection) }}>
															{trendIcon(metric.trendDirection)}
															<Typography sx={{ fontWeight: 700, ml: 0.3, fontSize: 13 }}>{metric.trend}</Typography>
														</Stack>
													</Stack>
												</Box>
											))}
										</Stack>
									</Paper>
								</Grid>

								<Grid size={{ xs: 12, lg: 4 }}>
									<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2, height: "100%" }}>
										<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16, mb: 1.2 }}>
											Quick Stats
										</Typography>
										<Stack spacing={1}>
											{dashboardData.quickStats.map((stat) => (
												<Box key={stat.id} sx={{ p: 1.2, borderRadius: 0.8, bgcolor: "background.default" }}>
													<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 0.3, fontSize: 11 }}>
														{stat.label}
													</Typography>
													<Typography sx={{ fontWeight: 800, fontSize: 18 }}>{stat.value.toLocaleString()}</Typography>
												</Box>
											))}
										</Stack>
									</Paper>
								</Grid>
							</Grid>

							<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2, mt: 1.5 }}>
								<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
									Recent Orders
								</Typography>
								<Stack spacing={1}>
									{dashboardData.recentOrders.length > 0 ? (
										dashboardData.recentOrders.map((order) => (
											<Stack key={order.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default" }}>
												<Avatar sx={{ width: 36, height: 36, bgcolor: "primary.light", color: "primary.contrastText" }}>
													<Receipt size={16} />
												</Avatar>
												<Box flex={1}>
													<Typography sx={{ fontWeight: 700, fontSize: 13 }}>{order.service}</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
														Order {order.orderNumber} • {order.date} • {order.customer}
													</Typography>
												</Box>
												<Box textAlign="right">
													<Typography sx={{ fontWeight: 700, fontSize: 12 }}>{order.amount}</Typography>
													<Chip size="small" label={order.status} color={statusColor(order.status)} sx={{ mt: 0.3, height: 20 }} />
												</Box>
											</Stack>
										))
									) : (
										<Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
											No orders found.
										</Typography>
									)}
								</Stack>
							</Paper>
						</>
					)}
				</Box>

				<Footer />
			</Box>
		</Box>
	);
}


