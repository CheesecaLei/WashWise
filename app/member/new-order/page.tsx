"use client";

import { useMemo, useState } from "react";
import { SunMedium, Waves, Flame, ShoppingBasket } from "lucide-react";
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
} from "@mui/material";
import { ClipboardList } from "lucide-react";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { logisticsFee } from "../../data/new-order";
import { formatPeso } from "../../lib/currency";
import { useLayoutShell } from "../../providers/layout-shell-provider";
import { useOrder } from "../../hooks/use-order";
import { useServices } from "../../hooks/use-services";
import { useOfflineStatus } from "../../hooks/use-offline-status";
import { useOfflineQueue } from "../../providers/offline-queue-provider";
import { toast } from "react-toastify";
import type { ServiceIconName, ServiceKey } from "../../types/new-order";

function serviceIcon(iconName: ServiceIconName) {
	switch (iconName) {
		case "waves":
			return <Waves size={18} />;
		case "sun":
			return <SunMedium size={18} />;
		case "flame":
			return <Flame size={18} />;
		default:
			return <Waves size={18} />;
	}
}

export default function NewOrderPage() {
	const { navigate } = useLayoutShell();
	const { createOrder, isSubmitting, apiError } = useOrder();
	const { services, isLoading: isLoadingServices } = useServices();
	const isOffline = useOfflineStatus();
	const { pendingCount } = useOfflineQueue();
	const [specialInstructions, setSpecialInstructions] = useState("");
	const [quantities, setQuantities] = useState<Record<string, string>>({});
	const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);

	const selectedServices = useMemo(() => {
		return services
			.map((service) => {
				const value = Number(quantities[service.id] || 0);
				const quantity = Number.isFinite(value) && value > 0 ? value : 0;

				return {
					...service,
					quantity,
					lineTotal: quantity * service.price,
				};
			})
			.filter((service) => service.quantity > 0);
	}, [quantities, services]);

	const subtotal = selectedServices.reduce((sum, service) => sum + service.lineTotal, 0);
	const total = subtotal + logisticsFee;

	// Weight validation
	const MAX_WEIGHT_KG = 20;
	const totalWeight = selectedServices.reduce((sum, s) => (s.unitLabel === "kg" ? sum + (s.quantity || 0) : sum), 0);
	const isOverweight = totalWeight > MAX_WEIGHT_KG;
	const canProceed = selectedServices.length > 0 && !isOverweight;

	const handleQuantityChange = (serviceId: string, value: string) => {
		if (value === "" || /^\d*\.?\d*$/.test(value)) {
			setQuantities((prev) => ({ ...prev, [serviceId]: value }));
		}
	};

	const handleProceed = async () => {
		if (isOffline) {
			setIsOfflineDialogOpen(true);
			return;
		}

		await executeCreateOrder();
	};

	const executeCreateOrder = async () => {
		if (isOverweight) {
			toast.error(`Order exceeds maximum allowed weight of ${MAX_WEIGHT_KG} kg. Please reduce weight.`);
			return;
		}
		const result = await createOrder({
			services: selectedServices.map((s) => ({
				id: s.id,
				quantity: s.quantity,
				lineTotal: s.lineTotal,
				label: s.label,
				unitLabel: s.unitLabel,
			})),
			specialInstructions,
			subtotal,
		});

		if (result.success) {
			if (result.orderId === "offline-queued") {
				toast.info("Order queued — it will be submitted automatically when you reconnect! 📶", {
					autoClose: 8000,
				});
				// Reset form
				setQuantities({});
				setSpecialInstructions("");
			} else if (result.orderId) {
				navigate(`/member/new-order/checkout?orderId=${result.orderId}`);
			}
		}
	};

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
					<Grid container spacing={1.5}>
						<Grid size={{ xs: 12, lg: 8.4 }}>
							<Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 22 }, mb: 0.3 }}>
								What do you need washed today?
							</Typography>
							<Typography color="text.secondary" sx={{ mb: 1.5, fontSize: 12 }}>
								Select the services you need and provide an estimate. Final weighing will be done at the
								facility.
							</Typography>

							<Stack spacing={1}>
								{isLoadingServices ? (
									<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
										<CircularProgress size={32} />
									</Box>
								) : services.length === 0 ? (
									<Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
										No services available at the moment.
									</Typography>
								) : (
									services.map((service) => (
										<Card key={service.id} sx={{ borderRadius: 1 }}>
											<CardContent sx={{ p: 1.2, "&:last-child": { pb: 1.2 } }}>
												<Stack direction="row" justifyContent="space-between" spacing={1.5} mb={1}>
													<Stack direction="row" spacing={1} alignItems="flex-start">
														<Avatar sx={{ width: 28, height: 28, bgcolor: "white", color: "primary.main", flexShrink: 0 }}>
															{serviceIcon(service.iconName)}
														</Avatar>
														<Box>
															<Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{service.label}</Typography>
															<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
																{service.description}
															</Typography>
														</Box>
													</Stack>
													<Typography sx={{ fontWeight: 700, color: "primary.main", fontSize: 12, whiteSpace: "nowrap" }}>
														{formatPeso(service.price)} / {service.unitLabel}
													</Typography>
												</Stack>

												<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
													<Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", minWidth: { xs: 0, sm: 110 } }}>
														{service.inputLabel}
													</Typography>
													<TextField
														size="small"
														value={quantities[service.id] || ""}
														onChange={(event) => handleQuantityChange(service.id, event.target.value)}
														placeholder={service.placeholder}
														sx={{ width: { xs: "100%", sm: 100 }, maxWidth: 180, "& .MuiOutlinedInput-root": { height: 32 } }}
													/>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
														{service.unitLabel}
													</Typography>
												</Stack>
											</CardContent>
										</Card>
									))
								)}
							</Stack>

							<Box mt={1.5}>
								<Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, mb: 0.8 }}>
									Special Instructions
								</Typography>
								<TextField
									multiline
									minRows={3}
									value={specialInstructions}
									onChange={(event) => setSpecialInstructions(event.target.value)}
									placeholder="E.g., use mild detergent for the white shirts, delicate handling for silk..."
									size="small"
									fullWidth
								/>
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.6, display: "block", fontSize: 10 }}>
									Your instructions help us treat your clothes with the care they deserve.
								</Typography>
							</Box>
						</Grid>

						<Grid size={{ xs: 12, lg: 3.6 }}>
							<Paper sx={{ borderRadius: 1.2, overflow: "hidden" }}>
								<Box sx={{ px: 1.2, py: 0.8, bgcolor: "rgba(2, 132, 199, 0.08)", borderBottom: 1, borderColor: "divider" }}>
									<Stack direction="row" alignItems="center" spacing={0.8}>
										<ClipboardList size={13} />
										<Typography sx={{ fontWeight: 700, color: "info.dark", fontSize: 12 }}>Live Summary</Typography>
									</Stack>
								</Box>
								<Box sx={{ p: 1.2 }}>
									{selectedServices.length === 0 ? (
										<Typography sx={{ color: "text.secondary", fontSize: 11, textAlign: "center", py: 1.5 }}>
											No services selected yet
										</Typography>
									) : (
										<Stack spacing={0.6} mb={1.2}>
											{selectedServices.map((service) => (
												<Stack key={service.id} direction="row" alignItems="center" justifyContent="space-between">
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
														{service.label} ({service.quantity} {service.unitLabel})
													</Typography>
													<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }}>
														{formatPeso(service.lineTotal)}
													</Typography>
												</Stack>
											))}
										</Stack>
									)}

									<Stack spacing={0.8}>
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
												Estimated Weight
											</Typography>
											<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }}>
												{totalWeight} kg
											</Typography>
										</Stack>
										{isOverweight && (
											<Typography color="error" variant="caption" sx={{ display: "block", textAlign: "center", mb: 1 }}>
												Order exceeds maximum allowed weight of {MAX_WEIGHT_KG} kg. Reduce weight to continue.
											</Typography>
										)}
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
												Subtotal
											</Typography>
											<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }}>
												{formatPeso(subtotal)}
											</Typography>
										</Stack>
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
												Logistics (Delivery)
											</Typography>
											<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }}>
												{formatPeso(logisticsFee)}
											</Typography>
										</Stack>
										<Divider />
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Typography sx={{ fontWeight: 700, fontSize: 11 }}>TOTAL</Typography>
											<Typography sx={{ fontWeight: 800, color: "primary.main", fontSize: 18 }}>
												{formatPeso(total)}
											</Typography>
										</Stack>
									</Stack>

									{apiError && (
										<Typography color="error" variant="caption" sx={{ display: "block", textAlign: "center", mb: 1 }}>
											{apiError}
										</Typography>
									)}
									<Button
										fullWidth
										variant="contained"
										disabled={!canProceed || isSubmitting}
										size="small"
										startIcon={<ShoppingBasket size={14} />}
										sx={{ mt: 1.2, fontSize: 12, py: 0.6 }}
										onClick={handleProceed}
									>
										{isSubmitting
											? "Processing..."
											: isOffline
											? `Queue Order${pendingCount > 0 ? ` (${pendingCount} pending)` : " (Offline)"}`
											: "Proceed to Checkout"}
									</Button>

									<Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", display: "block", mt: 0.8, fontSize: 9 }}>
										PRICES INCLUDE 12% VAT
									</Typography>
								</Box>
							</Paper>
						</Grid>
					</Grid>
				</Box>

				<Footer />
			</Box>

			<Dialog
			open={isOfflineDialogOpen}
			onClose={() => setIsOfflineDialogOpen(false)}
			PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400, width: "100%" } }}
		>
			<DialogTitle sx={{ fontWeight: 800 }}>Queue Order Offline</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ mb: 2, fontSize: 13 }}>
					You&apos;re offline. Your order will be saved locally and automatically submitted when you reconnect.
					You&apos;ll be prompted to complete checkout (pickup method &amp; payment) once it syncs.
				</DialogContentText>

				{/* Order summary */}
				<Paper variant="outlined" sx={{ p: 1.5, bgcolor: "rgba(2, 132, 199, 0.04)", borderColor: "info.light", mb: 1.5 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1, color: "info.dark" }}>
						Order Summary
					</Typography>
					<Stack spacing={0.5}>
						{selectedServices.map((s) => (
							<Stack key={s.id} direction="row" justifyContent="space-between">
								<Typography variant="caption" color="text.secondary">
									{s.label} × {s.quantity} {s.unitLabel}
								</Typography>
								<Typography variant="caption" fontWeight={700}>
									{formatPeso(s.lineTotal)}
								</Typography>
							</Stack>
						))}
						<Divider sx={{ my: 0.5 }} />
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="caption" fontWeight={700}>Est. Total</Typography>
							<Typography variant="caption" fontWeight={800} color="primary.main">
								{formatPeso(total)}
							</Typography>
						</Stack>
					</Stack>
				</Paper>

				{pendingCount > 0 && (
					<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
						📋 You already have {pendingCount} order{pendingCount === 1 ? "" : "s"} queued.
					</Typography>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={() => setIsOfflineDialogOpen(false)} color="inherit" size="small">
					Cancel
				</Button>
				<Button
					onClick={() => {
						setIsOfflineDialogOpen(false);
						executeCreateOrder();
					}}
					variant="contained"
					autoFocus
					size="small"
					sx={{ borderRadius: 2 }}
				>
					Confirm &amp; Queue
				</Button>
			</DialogActions>
		</Dialog>
		</Box>
	);
}
