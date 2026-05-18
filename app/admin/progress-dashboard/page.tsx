"use client";

import { useEffect, useState } from "react";
import {
	AlertCircle,
	Clock,
	CheckCircle2,
	Zap,
	Phone,
	Package,
	Truck,
	MapPin,
	RefreshCcw,
	Loader2,
	DollarSign,
} from "lucide-react";
import {
	alpha,
	Avatar,
	Box,
	Button,
	Grid,
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	IconButton,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Tooltip,
	Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import PremiumPagination from "../../components/pagination";
import { pusherClient } from "../../lib/pusher-client";
import { useOrderProgress } from "../../hooks/use-order-progress";
import { useRecordPayment } from "../../hooks/use-record-payment";
import type { LiveOrder, OrderStatus, ProgressStat } from "../../types/dashboard";

function getStatusIcon(status: OrderStatus) {
	const iconProps = { size: 14, strokeWidth: 1.9 };

	switch (status) {
		case "waiting":
			return <AlertCircle {...iconProps} />;
		case "in-progress":
			return <Clock {...iconProps} />;
		case "ready":
			return <Package {...iconProps} />;
		case "out-for-delivery":
			return <Truck {...iconProps} />;
		case "closed":
			return <CheckCircle2 {...iconProps} />;
		default:
			return <Clock {...iconProps} />;
	}
}

function getStatusLabel(status: OrderStatus, serviceMethod?: string) {
	switch (status) {
		case "waiting":
			return "Waiting";
		case "in-progress":
			return "In Progress";
		case "ready":
			return serviceMethod === "pickup" ? "Ready for Delivery" : "Ready for Pickup";
		case "out-for-delivery":
			return "Out for Delivery";
		case "closed":
			return "Order Finished";
		default:
			return status;
	}
}

function getStatusColor(status: OrderStatus) {
	switch (status) {
		case "waiting":
			return "#3f51b5";
		case "in-progress":
			return "#ff9800";
		case "ready":
			return "#4caf50";
		case "out-for-delivery":
			return "#00bcd4";
		case "closed":
			return "#9e9e9e";
		default:
			return "#757575";
	}
}

function getProgressStatIcon(icon: string) {
	const iconProps = { size: 18, strokeWidth: 1.9 };

	switch (icon) {
		case "active":
			return <Zap {...iconProps} />;
		case "completed":
			return <CheckCircle2 {...iconProps} />;
		case "processing":
			return <Clock {...iconProps} />;
		default:
			return <Truck {...iconProps} />;
	}
}

export default function ProgressDashboardPage() {
	const { orders, stats, loading, error, updatingId, refresh: fetchData, updateStatus: handleStatusChange } = useOrderProgress();
	const { recordPayment, isRecording } = useRecordPayment();
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<LiveOrder | null>(null);

	const handleRecordPayment = (order: LiveOrder) => {
		setSelectedOrderForPayment(order);
		setPaymentDialogOpen(true);
	};

	const executeRecordPayment = async () => {
		if (!selectedOrderForPayment) return;

		const result = await recordPayment({
			orderId: selectedOrderForPayment.id,
			amount: parseFloat(selectedOrderForPayment.amount.replace(/[₱,]/g, "")),
			method: "COD",
			notes: "Payment received by staff during delivery",
		});

		if (result.success) {
			toast.success(`✅ Payment of ${selectedOrderForPayment.amount} recorded!`, { autoClose: 3000 });
			fetchData();
			setPaymentDialogOpen(false);
			setSelectedOrderForPayment(null);
		} else {
			toast.error(result.error || "Failed to record payment", { autoClose: 3000 });
		}
	};

	useEffect(() => {
		const notificationsChannel = pusherClient.subscribe("admin-notifications");
		const updatesChannel = pusherClient.subscribe("order-updates");

		notificationsChannel.bind("new-order", (data: any) => {
			console.log("Real-time: New order for progress dashboard!", data);
			toast.info(`New Order Received! #${data.orderId?.slice(-6).toUpperCase() || "N/A"}`, {
				icon: <span>🧺</span>
			});
			fetchData();
		});

		updatesChannel.bind("order-status-updated", (data: any) => {
			console.log("Real-time: Order status updated!", data);
			
			let statusLabel = data.status;
			if (data.status === "ready") {
				statusLabel = data.serviceMethod === "pickup" ? "Ready for Delivery" : "Ready for Pickup";
			} else if (data.status === "closed") {
				statusLabel = "Finished";
			}

			toast.success(`Order #${data.orderId?.slice(-6).toUpperCase()} updated to ${statusLabel}`, {
				icon: <span>✅</span>
			});
			fetchData();
		});

		return () => {
			pusherClient.unsubscribe("admin-notifications");
			pusherClient.unsubscribe("order-updates");
		};
	}, [fetchData]);

	if (loading && orders.length === 0) {
		return (
			<Box sx={{ minHeight: "100dvh", display: "flex", bgcolor: "background.default" }}>
				<Sidebar />
				<Box component="main" sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	const orderStatusFlow: OrderStatus[] = ["waiting", "in-progress", "ready", "out-for-delivery", "closed"];

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
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
						<Box>
							<Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 20, md: 24 }, mb: 0.3 }}>
								Progress Dashboard
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: 12 }}>
								Track and monitor progress metrics and order workflow.
							</Typography>
						</Box>
						<IconButton onClick={fetchData} disabled={loading} size="small">
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
												bgcolor: (theme) => alpha(theme.palette[stat.color as any].main, 0.13),
												color: `${stat.color}.main`,
											}}
										>
											{getProgressStatIcon(stat.icon)}
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
							Live Order Tracking
						</Typography>

						<Stack spacing={1.5}>
							{orders.length > 0 ? (
								orders.map((order) => (
									<Paper
										key={order.id}
										elevation={0}
										sx={{
											border: 1,
											borderColor: "divider",
											borderRadius: 1.2,
											p: 1.5,
											bgcolor: "background.default",
											position: "relative",
											opacity: updatingId === order.id ? 0.6 : 1
										}}
									>
										{updatingId === order.id && (
											<Box sx={{ position: "absolute", top: 8, right: 8 }}>
												<Loader2 className="animate-spin" size={16} />
											</Box>
										)}
										<Grid container spacing={1.5}>
											<Grid size={{ xs: 12, sm: 6, md: 3 }}>
												<Stack spacing={0.5}>
													<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
														ORDER CODE
													</Typography>
													<Typography sx={{ fontWeight: 800, fontSize: 14, color: "primary.main" }}>
														{order.orderCode}
													</Typography>
												</Stack>
											</Grid>

											<Grid size={{ xs: 12, sm: 6, md: 3 }}>
												<Stack spacing={0.5}>
													<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
														CUSTOMER
													</Typography>
													<Typography sx={{ fontWeight: 700, fontSize: 13 }}>{order.customerName}</Typography>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Phone size={12} className="text-gray-400" />
														<Typography sx={{ fontSize: 11 }}>{order.customerPhone}</Typography>
													</Stack>
												</Stack>
											</Grid>

											<Grid size={{ xs: 12, sm: 6, md: 2 }}>
												<Stack spacing={0.5}>
													<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
														SERVICES
													</Typography>
													<Typography sx={{ fontWeight: 800, fontSize: 16 }}>{order.items}</Typography>
												</Stack>
											</Grid>

											<Grid size={{ xs: 12, sm: 6, md: 2 }}>
												<Stack spacing={0.5}>
													<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
														AMOUNT
													</Typography>
													<Typography sx={{ fontWeight: 800, fontSize: 14, color: "success.main" }}>
														{order.amount}
													</Typography>
													{order.rewardId && (
														<Chip 
															label={`\u20B1${order.rewardDiscount} Off`}
															size="small" 
															color="secondary" 
															variant="outlined"
															sx={{ fontSize: 9, height: 18, fontWeight: 800 }}
														/>
													)}
												</Stack>
											</Grid>
										</Grid>

										<Typography sx={{ fontWeight: 700, fontSize: 12, mt: 1.2, mb: 1 }}>
											Update Order Status
										</Typography>

										<Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", mb: 1.2, alignItems: "center" }}>
											{orderStatusFlow.map(
												(status) => {
													// Skip out-for-delivery if not a pickup order (logistics)
													if (status === "out-for-delivery" && order.serviceMethod !== "pickup") {
														return null;
													}
													
													const isActive = order.status === status;
													return (
														<Button
															key={status}
															size="small"
															variant={isActive ? "contained" : "outlined"}
															onClick={() => handleStatusChange(order.id, status)}
															startIcon={getStatusIcon(status)}
															disabled={updatingId === order.id}
															sx={{
																fontSize: 10,
																py: 0.4,
																px: 0.8,
																height: 28,
																bgcolor: isActive ? getStatusColor(status) : "transparent",
																color: isActive ? "white" : "inherit",
																borderColor: getStatusColor(status),
																"&:hover": {
																	bgcolor: isActive ? getStatusColor(status) : alpha(getStatusColor(status), 0.1),
																},
															}}
														>
															{getStatusLabel(status, order.serviceMethod)}
														</Button>
													);
												},
											)}
											
											{(order.status === "ready" || order.status === "out-for-delivery") && order.paymentStatus === "unpaid" && (
												<Tooltip title="Record payment received">
													<Button
														size="small"
														variant="contained"
														color="success"
														onClick={() => handleRecordPayment(order)}
														disabled={isRecording}
														startIcon={<DollarSign size={14} />}
														sx={{ py: 0.4, px: 0.8, fontSize: 10, fontWeight: 700, height: 28 }}
													>
														Record Payment
													</Button>
												</Tooltip>
											)}
										</Box>

										<Stack direction="row" justifyContent="space-between">
											<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
												Order Date: {order.orderTime}
											</Typography>
											<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
												Last Updated: {order.estimatedCompletion}
											</Typography>
										</Stack>
									</Paper>
								))
							) : (
								<Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
									No live orders found.
								</Typography>
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

			<Dialog
				open={paymentDialogOpen}
				onClose={() => setPaymentDialogOpen(false)}
				PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 420, width: "100%" } }}
			>
				<DialogTitle sx={{ fontWeight: 800, fontSize: 18 }}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<DollarSign size={22} />
						<span>Record Payment Received</span>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2.5, fontSize: 14, color: "text.secondary", mt: 1 }}>
						Confirm payment received for Order #{selectedOrderForPayment?.orderCode}
					</DialogContentText>
					<Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.04)", borderColor: "success.light", mb: 2 }}>
						<Stack spacing={1}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
									Customer Name
								</Typography>
								<Typography variant="caption" fontWeight={700} sx={{ fontSize: 13 }}>
									{selectedOrderForPayment?.customerName}
								</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
									Payment Method
								</Typography>
								<Typography variant="caption" fontWeight={700} sx={{ fontSize: 13 }}>
									Cash on Delivery (COD)
								</Typography>
							</Stack>
							<Divider sx={{ my: 0.5 }} />
							<Stack direction="row" justifyContent="space-between">
								<Typography sx={{ fontWeight: 700, fontSize: 13 }}>Amount Received</Typography>
								<Typography sx={{ fontWeight: 800, color: "success.main", fontSize: 16 }}>
									{selectedOrderForPayment?.amount}
								</Typography>
							</Stack>
						</Stack>
					</Paper>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setPaymentDialogOpen(false)} color="inherit" size="small">
						Cancel
					</Button>
					<Button
						onClick={executeRecordPayment}
						variant="contained"
						color="success"
						autoFocus
						size="small"
						disabled={isRecording}
						sx={{ borderRadius: 2 }}
					>
						{isRecording ? "Recording..." : "Confirm Payment"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
