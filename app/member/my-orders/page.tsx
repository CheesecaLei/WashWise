"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
	CalendarClock,
	Circle,
	CircleCheckBig,
	Clock3,
	Download,
	MessageSquare,
	PackageOpen,
	Truck,
	ChevronRight,
} from "lucide-react";
import {
	alpha,
	Avatar,
	Box,
	Button,
	Chip,
	Divider,
	Grid,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import PremiumPagination from "../../components/pagination";
import { formatPeso } from "../../lib/currency";
import { useLayoutShell } from "../../providers/layout-shell-provider";
import { useOrder } from "../../hooks/use-order";
import { pusherClient } from "../../lib/pusher-client";
import type { FetchTransactionsResponse } from "../../types/new-order";

type TimelineStatus = "done" | "current" | "pending";

function timelineIcon(status: TimelineStatus) {
	if (status === "done") return <CircleCheckBig size={17} />;
	if (status === "current") return <Clock3 size={17} />;
	return <Circle size={17} />;
}

function timelineColor(status: TimelineStatus) {
	if (status === "done") return "primary.main";
	if (status === "current") return "info.main";
	return "text.disabled";
}

function getStatusColor(status?: string) {
	switch (status?.toLowerCase()) {
		case "waiting":
			return "warning" as const;
		case "in-progress":
			return "info" as const;
		case "ready":
			return "success" as const;
		case "out-for-delivery":
			return "primary" as const;
		case "closed":
		case "completed":
			return "default" as const;
		default:
			return "default" as const;
	}
}

function getStatusLabel(status?: string, serviceMethod?: string) {
	switch (status?.toLowerCase()) {
		case "waiting":
			return "Awaiting Action";
		case "in-progress":
			return "In-Progress";
		case "ready":
			return serviceMethod === "pickup" ? "Ready for Delivery" : "Ready for Pickup";
		case "out-for-delivery":
			return "Out for Delivery";
		case "closed":
		case "completed":
			return "Finished";
		default:
			return status || "Confirmed";
	}
}

export default function MyOrdersPage() {
	const { navigate } = useLayoutShell();
	const { fetchTransactions, isLoadingOrder } = useOrder();
	const [transactions, setTransactions] = useState<FetchTransactionsResponse["transactions"]>([]);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);

	const loadData = useCallback((pageNum: number = 1) => {
		fetchTransactions(pageNum).then((result: any) => {
			if (result.success && result.transactions) {
				setTransactions(result.transactions);
				setPagination(result.pagination);
			}
		});
	}, [fetchTransactions]);

	useEffect(() => {
		loadData(page);
	}, [loadData, page]);

	useEffect(() => {
		if (!pusherClient) return;

		const channel = pusherClient.subscribe("order-updates");
		
		channel.bind("order-status-updated", (data: any) => {
			console.log("Member: Order status updated!", data);
			
			let statusLabel = data.status;
			if (data.status === "ready") {
				statusLabel = data.serviceMethod === "pickup" ? "Ready for Delivery" : "Ready for Pickup";
			} else if (data.status === "closed") {
				statusLabel = "Finished";
			}

			toast.info(`Your order #${data.orderId?.slice(-6).toUpperCase()} is now ${statusLabel}!`, {
				icon: <span>✨</span>
			});
			loadData(page);
		});

		return () => {
			pusherClient.unsubscribe("order-updates");
		};
	}, [loadData, page]);

	const currentTransaction = transactions && transactions.length > 0 ? transactions[0] : null;
	const currentOrderId = currentTransaction?._id.slice(-6).toUpperCase();

	const stats = useMemo(() => {
		if (!transactions) return { total: 0, weight: 0 };
		return {
			total: pagination?.total || transactions.length,
			weight: transactions.reduce((sum, t) => {
				const w = t.order?.services.reduce((s, item) => s + (item.unitLabel.toLowerCase().includes("kg") ? item.quantity : 0), 0) || 0;
				return sum + w;
			}, 0)
		};
	}, [transactions, pagination]);

	if (isLoadingOrder && (!transactions || transactions.length === 0)) {
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
					<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1} mb={1.5}>
						<Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
							My Orders
						</Typography>
						<Button variant="text" size="small" startIcon={<Download size={14} />}>
							Export History
						</Button>
					</Stack>

					{transactions && transactions.length > 0 ? (
						<Grid container spacing={1.5}>
							<Grid size={{ xs: 12, xl: 8.5 }}>
								{/* Current Order Card */}
								<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
									<Box
										sx={{
											p: 1.5,
											display: "grid",
											gridTemplateColumns: { xs: "1fr", md: "1fr auto auto auto" },
											gap: 1,
											alignItems: "center",
											bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
										}}
									>
										<Box>
											<Typography variant="caption" sx={{ textTransform: "uppercase", color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
												Most Recent Order
											</Typography>
											<Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: "primary.main" }}>
												#{currentOrderId}
											</Typography>
										</Box>
										<Box>
											<Typography variant="caption" sx={{ textTransform: "uppercase", color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
												Scheduled For
											</Typography>
											<Typography sx={{ fontWeight: 700, fontSize: 13 }}>{currentTransaction?.selectedSlot}</Typography>
										</Box>
										<Box>
											<Typography variant="caption" sx={{ textTransform: "uppercase", color: "text.secondary", fontWeight: 700, fontSize: 10 }}>
												Payment
											</Typography>
											<Chip 
												label={currentTransaction?.paymentStatus?.replace("_", " ").toUpperCase() || "UNPAID"}
												size="small"
												variant="outlined"
												sx={{
													fontWeight: 700,
													fontSize: 10,
													height: 22,
													color: currentTransaction?.paymentStatus === "paid" ? "success.main" : currentTransaction?.paymentStatus === "refunded" ? "error.main" : "warning.main",
													borderColor: currentTransaction?.paymentStatus === "paid" ? "success.main" : currentTransaction?.paymentStatus === "refunded" ? "error.main" : "warning.main",
												}}
											/>
										</Box>
										<Chip 
											label={getStatusLabel(currentTransaction?.order?.status, currentTransaction?.serviceMethod)} 
											color={getStatusColor(currentTransaction?.order?.status)} 
											size="small" 
											sx={{ justifySelf: { xs: "flex-start", md: "flex-end" }, height: 24, fontWeight: 700 }} 
										/>
									</Box>

									<Box sx={{ p: 1.5 }}>
										<Grid container spacing={1.5}>
											<Grid size={{ xs: 12, md: 7 }}>
												<Stack spacing={1}>
													{[
														{ id: 1, label: "Order Received", timestamp: new Date(currentTransaction?.createdAt || "").toLocaleString(), status: "done" as const },
														{ id: 2, label: "Awaiting Pickup/Drop-off", timestamp: "Tomorrow, " + currentTransaction?.selectedSlot, status: "current" as const },
														{ id: 3, label: "Cleaning in Progress", timestamp: "Pending", status: "pending" as const },
														{ id: 4, label: "Ready for Delivery", timestamp: "Pending", status: "pending" as const },
													].map((item) => (
														<Stack key={item.id} direction="row" spacing={1} alignItems="flex-start">
															<Avatar
																sx={{
																	width: 24,
																	height: 24,
																	bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
																	color: timelineColor(item.status),
																	fontSize: 12,
																}}
															>
																{timelineIcon(item.status)}
															</Avatar>
															<Box>
																<Typography sx={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{item.label}</Typography>
																<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
																	{item.timestamp}
																</Typography>
															</Box>
														</Stack>
													))}
												</Stack>
											</Grid>

											<Grid size={{ xs: 12, md: 5 }}>
												<Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1 }}>
													<Typography sx={{ fontWeight: 700, fontSize: 12, mb: 0.8 }}>Service Breakdown</Typography>
													<Stack spacing={0.6}>
														{currentTransaction?.order?.services.map((item: any, idx: number) => (
															<Stack key={idx} direction="row" justifyContent="space-between" spacing={1}>
																<Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
																	{item.label}
																</Typography>
																<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>
																	{formatPeso(item.lineTotal)}
																</Typography>
															</Stack>
														))}
														{currentTransaction?.order?.totalWeight && currentTransaction.order.totalWeight > 0 && (
															<Stack direction="row" justifyContent="space-between" spacing={1} sx={{ py: 0.5, borderTop: 1, borderColor: "divider" }}>
																<Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Total Weight</Typography>
																<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>{currentTransaction.order.totalWeight} kg</Typography>
															</Stack>
														)}
														{currentTransaction && currentTransaction.logisticsFee > 0 && (
															<Stack direction="row" justifyContent="space-between" spacing={1}>
																<Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Logistics Fee</Typography>
																<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>{formatPeso(currentTransaction.logisticsFee)}</Typography>
															</Stack>
														)}
														{currentTransaction && currentTransaction.promoDiscount > 0 && (
															<Stack direction="row" justifyContent="space-between" spacing={1}>
																<Typography variant="caption" color="success.main" sx={{ fontSize: 11 }}>Promo Discount</Typography>
																<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: "success.main" }}>-{formatPeso(currentTransaction.promoDiscount)}</Typography>
															</Stack>
														)}
														{currentTransaction?.order?.loyaltyDiscount && currentTransaction.order.loyaltyDiscount > 0 && (
															<Stack direction="row" justifyContent="space-between" spacing={1}>
																<Typography variant="caption" color="success.main" sx={{ fontSize: 11 }}>Loyalty Discount</Typography>
																<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: "success.main" }}>-{formatPeso(currentTransaction.order.loyaltyDiscount)}</Typography>
															</Stack>
														)}
													</Stack>
													<Divider sx={{ my: 0.8 }} />
													<Stack direction="row" justifyContent="space-between" alignItems="center">
														<Typography sx={{ fontWeight: 700, fontSize: 12 }}>Total Amount</Typography>
														<Typography sx={{ fontWeight: 800, color: "primary.main", fontSize: 18 }}>
															{formatPeso(currentTransaction?.finalTotal || 0)}
														</Typography>
													</Stack>
												</Paper>

												<Button fullWidth variant="contained" size="small" sx={{ mt: 1, mb: 0.8 }} startIcon={<MessageSquare size={14} />}>
													Message Support
												</Button>

												<Button
													fullWidth
													variant="outlined"
													size="small"
													onClick={() => navigate(`/member/new-order/placed?transactionId=${currentTransaction?._id}`)}
												>
													View Full Details
												</Button>
											</Grid>
										</Grid>
									</Box>
								</Paper>

								{/* Older Orders Table */}
								<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, mt: 1.5, overflow: "hidden" }}>
									<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.2 }}>
										<Typography sx={{ fontWeight: 700, fontSize: 14 }}>Order History</Typography>
										<Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
											<Button size="small" variant="outlined" sx={{ py: 0.5 }}>Export CSV</Button>
											<Button size="small" variant="outlined" sx={{ py: 0.5 }}>Filter</Button>
										</Stack>
									</Stack>

									<Box sx={{ overflowX: "auto" }}>
										<Table size="small" sx={{ minWidth: { xs: 620, md: 680 } }}>
											<TableHead>
												<TableRow>
													<TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Order ID</TableCell>
													<TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Date Placed</TableCell>
													<TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Services</TableCell>
													<TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Amount</TableCell>
													<TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Status</TableCell>
													<TableCell align="right" sx={{ fontSize: 11, fontWeight: 700 }}>Action</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{transactions.map((item) => (
													<TableRow key={item._id} sx={{ "&:hover": { bgcolor: "background.default" } }}>
														<TableCell sx={{ fontWeight: 700, color: "primary.main", fontSize: 12 }}>#{item._id.slice(-6).toUpperCase()}</TableCell>
														<TableCell sx={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
														<TableCell sx={{ fontSize: 12 }}>{item.order?.services.map((s: any) => s.label).join(", ")}</TableCell>
														<TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{formatPeso(item.finalTotal)}</TableCell>
														<TableCell>
															<Chip 
																size="small" 
																label={getStatusLabel(item.order?.status, item.serviceMethod)} 
																color={getStatusColor(item.order?.status)} 
																sx={{ height: 20, fontSize: 10, fontWeight: 700 }} 
															/>
														</TableCell>
														<TableCell align="right">
															<Button size="small" variant="text" sx={{ fontSize: 11 }} onClick={() => navigate(`/member/new-order/placed?transactionId=${item._id}`)}>
																Details
															</Button>
														</TableCell>
													</TableRow>
												))}
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
												loading={isLoadingOrder}
											/>
										</Box>
									)}
								</Paper>
							</Grid>

							<Grid size={{ xs: 12, xl: 3.5 }}>
								<Stack spacing={1.2}>
									<Paper elevation={0} sx={{ p: 1.2, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
										<Stack direction="row" alignItems="center" spacing={1} mb={1}>
											<Avatar sx={{ width: 28, height: 28, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
												<PackageOpen size={14} />
											</Avatar>
											<Typography sx={{ fontWeight: 700, fontSize: 13 }}>Your Stats</Typography>
										</Stack>
										<Grid container spacing={0.8}>
											<Grid size={6}>
												<Paper variant="outlined" sx={{ p: 1, textAlign: "center", borderRadius: 1 }}>
													<Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{stats.total}</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Total Orders</Typography>
												</Paper>
											</Grid>
											<Grid size={6}>
												<Paper variant="outlined" sx={{ p: 1, textAlign: "center", borderRadius: 1 }}>
													<Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{stats.weight}kg</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Est. Weight</Typography>
												</Paper>
											</Grid>
										</Grid>
									</Paper>

									<Paper
										elevation={0}
										sx={{
											p: 1.2,
											borderRadius: 1.5,
											color: "primary.contrastText",
											bgcolor: "primary.main",
											backgroundImage: (theme) =>
												`radial-gradient(circle at 80% 20%, ${alpha(theme.palette.common.white, 0.26)} 0, transparent 40%), radial-gradient(circle at 30% 100%, ${alpha(theme.palette.common.white, 0.2)} 0, transparent 34%)`,
										}}
									>
										<Typography sx={{ fontWeight: 700, mb: 0.4, fontSize: 13 }}>Quick Re-order?</Typography>
										<Typography variant="body2" sx={{ opacity: 0.92, mb: 0.8, fontSize: 11 }}>
											Place a new laundry order with one click.
										</Typography>
										<Button
											fullWidth
											variant="contained"
											color="inherit"
											size="small"
											sx={{ color: "primary.main", fontWeight: 700, backgroundColor: "white", fontSize: 11, py: 0.6 }}
											onClick={() => navigate("/member/new-order")}
										>
											Start New Order
										</Button>
									</Paper>

									<Paper elevation={0} sx={{ p: 1.2, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
										<Stack direction="row" alignItems="center" spacing={1} mb={0.6}>
											<CalendarClock size={14} />
											<Typography sx={{ fontWeight: 700, fontSize: 12 }}>Last Pickup Location</Typography>
										</Stack>
										<Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, fontSize: 10 }}>
											Address
										</Typography>
										<Typography sx={{ mt: 0.3, mb: 0.8, fontSize: 11 }}>
											{currentTransaction?.streetAddress || "No saved address"}, {currentTransaction?.barangay}, {currentTransaction?.city}
										</Typography>
										<Button fullWidth variant="outlined" size="small" sx={{ py: 0.5, fontSize: 11 }}>Update Preferences</Button>
									</Paper>

									<Paper elevation={0} sx={{ p: 1.2, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
										<Stack direction="row" alignItems="center" spacing={1}>
											<Truck size={14} />
											<Box>
												<Typography sx={{ fontWeight: 700, fontSize: 12 }}>Pickup/Delivery Service</Typography>
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
													{currentTransaction?.serviceMethod === "pickup" ? "Full Logistics Support" : "Self Service Selected"}
												</Typography>
											</Box>
										</Stack>
									</Paper>
								</Stack>
							</Grid>
						</Grid>
					) : (
						<Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, border: 1, borderColor: "divider" }}>
							<Box sx={{ mb: 2, color: "text.secondary" }}>
								<PackageOpen size={48} />
							</Box>
							<Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No Orders Yet</Typography>
							<Typography sx={{ color: "text.secondary", mb: 3 }}>You haven't placed any laundry orders yet. Start your first order now!</Typography>
							<Button variant="contained" onClick={() => navigate("/member/new-order")}>
								Start My First Order
							</Button>
						</Paper>
					)}
				</Box>

				<Footer />
			</Box>
		</Box>
	);
}
