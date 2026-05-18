"use client";

import { useEffect, useState } from "react";
import {
	BadgeCheck,
	ClipboardList,
	Flame,
	PackageCheck,
	Receipt,
	Truck,
	Wind,
	Sparkles,
	Plus,
	ArrowRight,
	Gift,
} from "lucide-react";
import {
	alpha,
	Avatar,
	Box,
	Button,
	Chip,
	Grid,
	InputAdornment,
	Paper,
	Stack,
	TextField,
	Typography,
	CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { Search } from "@mui/icons-material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useLayoutShell } from "../../providers/layout-shell-provider";
import { useOrder } from "../../hooks/use-order";
import { useRewards } from "../../hooks/use-rewards";
import { pusherClient } from "../../lib/pusher-client";
import type {
	Activity,
	ActivityStatus,
	PulseMetricAccent,
	PulseMetricIconName,
} from "../../types/dashboard";

function statusColor(status: ActivityStatus) {
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

function metricIcon(icon: PulseMetricIconName) {
	const iconProps = { size: 16, strokeWidth: 1.9 };

	switch (icon) {
		case "washing":
			return <Wind {...iconProps} />;
		case "drying":
			return <Flame {...iconProps} />;
		case "ironing":
			return <Sparkles {...iconProps} />;
		case "to-deliver":
			return <Truck {...iconProps} />;
		case "ready":
			return <PackageCheck {...iconProps} />;
		case "completed":
			return <BadgeCheck {...iconProps} />;
		default:
			return <Receipt {...iconProps} />;
	}
}

function metricColor(accent: PulseMetricAccent) {
	switch (accent) {
		case "primary":
			return "primary" as const;
		case "warning":
			return "warning" as const;
		case "secondary":
			return "secondary" as const;
		case "info":
			return "info" as const;
		case "success":
			return "success" as const;
		case "neutral":
			return "neutral" as const;
		default:
			return "primary" as const;
	}
}

export default function DashboardPage() {
	const { navigate } = useLayoutShell();
	const { fetchDashboard, isLoadingOrder } = useOrder();
	const [pulseMetrics, setPulseMetrics] = useState<any[]>([]);
	const [activities, setActivities] = useState<Activity[]>([]);
	const { summary } = useRewards();

	useEffect(() => {
		fetchDashboard().then((result) => {
			if (result.success) {
				setPulseMetrics(result.pulseMetrics);
				setActivities(result.activities);
			}
		});
	}, [fetchDashboard]);

	useEffect(() => {
		if (!pusherClient) return;

		const channel = pusherClient.subscribe("order-updates");
		
		channel.bind("order-status-updated", (data: any) => {
			console.log("Member Dashboard: Real-time update received!", data);
			
			let statusLabel = data.status;
			if (data.status === "ready") {
				statusLabel = data.serviceMethod === "pickup" ? "Ready for Delivery" : "Ready for Pickup";
			} else if (data.status === "closed") {
				statusLabel = "Finished";
			}

			toast.info(`Status Update: Order #${data.orderId?.slice(-6).toUpperCase()} is now ${statusLabel}`, {
				icon: <span>🧺</span>
			});
			fetchDashboard().then((result) => {
				if (result.success) {
					setPulseMetrics(result.pulseMetrics);
					setActivities(result.activities);
				}
			});
		});

		return () => {
			pusherClient.unsubscribe("order-updates");
		};
	}, [fetchDashboard]);

	if (isLoadingOrder && activities.length === 0) {
		return (
			<Box sx={{ display: "flex", bgcolor: "background.default", minHeight: "100dvh" }}>
				<Sidebar />
				<Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={{ minHeight: "100dvh", height: { xs: "auto", md: "100dvh" }, display: "flex", bgcolor: "background.default", overflow: { xs: "visible", md: "hidden" } }}>
			<Sidebar />

			<Box
				component="main"
				sx={{
					flex: 1,
					minWidth: 0,
					height: { xs: "auto", md: "100dvh" },
					overflowY: "auto",
					overflowX: "hidden",
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
							bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.15 : 0.08),
						}}
					>
						<Typography variant="h5" sx={{ mb: 0.3, fontWeight: 700, fontSize: { xs: 20, md: 24 } }}>
							Need a fresh start?
						</Typography>
						<Typography color="text.secondary" sx={{ maxWidth: 660, mb: 1.5, fontSize: 13 }}>
							Schedule a pickup now and we&apos;ll handle the rest. Our expert cleaners ensure your garments
							get the care they deserve.
						</Typography>
						<Button variant="contained" sx={{ px: 2, py: 0.8, borderRadius: 0.5}} startIcon={<Plus size={16}/>} onClick={() => navigate("/member/new-order")}>
							Start New Order
						</Button>
					</Paper>

					<Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
						<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
							Active Pulse
						</Typography>
						<Chip label="REAL-TIME" size="small" color="info" variant="outlined" />
					</Stack>

					<Grid container spacing={1.5} mb={2.5} columns={{ xs: 2, sm: 3, md: 5 }}>
						{pulseMetrics.map((metric) => (
							<Grid key={metric.id} size={1}>
								<Paper
									elevation={0}
									sx={{
										p: 1.5,
										borderRadius: 1.5,
										border: 1,
										borderColor: "divider",
										textAlign: "center",
										height: "100%",
									}}
								>
									<Avatar
										sx={{
											width: 32,
											height: 32,
											mx: "auto",
											mb: 0.8,
												bgcolor: (theme) => alpha(theme.palette[metricColor(metric.accent)].main, 0.13),
												color: `${metricColor(metric.accent)}.main`,
										}}
									>
										{metricIcon(metric.icon)}
									</Avatar>
									<Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>{metric.value}</Typography>
									<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
										{metric.label}
									</Typography>
								</Paper>
							</Grid>
						))}
					</Grid>

					<Grid container spacing={1.5}>
						<Grid size={{ xs: 12, lg: 8 }}>
							<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, mb: 1.2 }}>
								Recent Activities
							</Typography>

							<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5, mb: 1.5 }}>
								<TextField
									size="small"
									placeholder="Track order number..."
									fullWidth
									sx={{
										"& .MuiOutlinedInput-root": {
											height: 36,
											borderRadius: 999,
											bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
											"& fieldset": { borderColor: "transparent" },
											"&:hover fieldset": { borderColor: "transparent" },
											"&.Mui-focused fieldset": { borderColor: "transparent" },
										},
									}}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Search fontSize="small" sx={{ color: "text.secondary" }} />
											</InputAdornment>
										),
									}}
								/>
							</Paper>

							<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
								{activities.length > 0 ? (
									<Stack spacing={1}>
										{activities.map((activity: Activity) => (
											<Stack key={activity.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default" }}>
												<Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light", color: "primary.contrastText" }}>
													<Receipt size={14} />
												</Avatar>
												<Box flex={1}>
													<Typography sx={{ fontWeight: 700, fontSize: 12 }}>{activity.service}</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
														Order {activity.orderNumber} • {activity.date}
													</Typography>
												</Box>
												<Box textAlign="right">
													<Typography sx={{ fontWeight: 700, fontSize: 12 }}>{activity.amount}</Typography>
													<Chip size="small" label={activity.status} color={statusColor(activity.status)} sx={{ mt: 0.2, height: 18 }} />
												</Box>
											</Stack>
										))}
									</Stack>
								) : (
									<Box sx={{ py: 4, textAlign: "center" }}>
										<Typography color="text.secondary">No recent activities found.</Typography>
									</Box>
								)}
								<Button
									color="info"
									variant="text"
									size="small"
									fullWidth
									sx={{
										mt: 1,
										fontWeight: 700,
										fontSize: 12,
										"& .MuiButton-endIcon": { ml: 0.3 },
									}}
									endIcon={<ArrowRight size={14} />}
									onClick={() => navigate("/member/my-orders")}
								>
									View Order History
								</Button>
							</Paper>
						</Grid>

						<Grid size={{ xs: 12, lg: 4 }}>
							<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16, mb: 1.2 }}>
								Quick Shortcuts
							</Typography>
							<Stack spacing={1}>
								<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }} onClick={() => navigate("/member/new-order")}>
									<Avatar sx={{ width: 32, height: 32, mb: 1, bgcolor: "background.default", color: "text.primary" }}>
										<ClipboardList size={16} />
									</Avatar>
									<Typography sx={{ fontWeight: 700, fontSize: 13 }}>Flexible Scheduling</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mt: 0.3 }}>
										Choose your preferred pickup and delivery windows.
									</Typography>
								</Paper>
								<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }} onClick={() => navigate("/member/my-orders")}>
									<Avatar sx={{ width: 32, height: 32, mb: 1, bgcolor: "background.default", color: "text.primary" }}>
										<Truck size={16} />
									</Avatar>
									<Typography sx={{ fontWeight: 700, fontSize: 13 }}>Delivery Tracking</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mt: 0.3 }}>
										Follow your rider in real-time as they approach.
									</Typography>
								</Paper>
							</Stack>

							<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16, mt: 2.5, mb: 1.2 }}>
								Loyalty Rewards
							</Typography>
							<Paper 
								elevation={0} 
								sx={{ 
									p: 1.5, 
									borderRadius: 1.5, 
									color: "white",
									background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
									cursor: "pointer",
									"&:hover": { opacity: 0.95 }
								}} 
								onClick={() => navigate("/member/rewards")}
							>
								<Stack direction="row" spacing={1.5} alignItems="center">
									<Avatar sx={{ bgcolor: alpha("#fff", 0.2), color: "white" }}>
										<Gift size={20} />
									</Avatar>
									<Box>
										<Typography sx={{ fontWeight: 800, fontSize: 15 }}>{summary?.totalPoints || 0} Points</Typography>
										<Typography variant="body2" sx={{ opacity: 0.8, fontSize: 11 }}>
											Current Tier: {summary?.currentTier.toUpperCase() || "STARTER"}
										</Typography>
									</Box>
									<ArrowRight size={18} style={{ marginLeft: "auto" }} />
								</Stack>
							</Paper>
						</Grid>
					</Grid>
				</Box>

				<Footer />
			</Box>
		</Box>
	);
}
