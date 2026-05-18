"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Users, Eye, Download, RefreshCcw } from "lucide-react";
import {
	alpha,
	Avatar,
	Box,
	Button,
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
	Alert,
	IconButton,
} from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useReports } from "../../hooks/use-reports";
import type { ReportMetricIcon, ReportMetric, ServiceReport } from "../../types/dashboard";

function getMetricIcon(icon: ReportMetricIcon | string) {
	const iconProps = { size: 18, strokeWidth: 1.9 };

	switch (icon) {
		case "revenue":
			return <DollarSign {...iconProps} />;
		case "orders":
			return <TrendingUp {...iconProps} />;
		case "customers":
			return <Users {...iconProps} />;
		case "views":
			return <Eye {...iconProps} />;
		default:
			return <TrendingUp {...iconProps} />;
	}
}

export default function ReportPage() {
	const { metrics, serviceReports, loading, error, refresh: fetchReports, downloadExcel } = useReports();

	if (loading && metrics.length === 0) {
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
								Report
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: 12 }}>
								Sales analytics and business metrics overview.
							</Typography>
						</Box>
						<IconButton onClick={fetchReports} disabled={loading} size="small">
							<RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
						</IconButton>
					</Stack>

					{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

					<Grid container spacing={1.5} mb={2.5}>
						{metrics.map((metric) => (
							<Grid key={metric.id} size={{ xs: 12, md: 6, lg: 3 }}>
								<Paper
									elevation={0}
									sx={{
										p: 1.5,
										borderRadius: 1.5,
										border: 1,
										borderColor: "divider",
									}}
								>
									<Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
										<Avatar
											sx={{
												width: 32,
												height: 32,
												bgcolor: (theme) => alpha(theme.palette.primary.main, 0.13),
												color: "primary.main",
											}}
										>
											{getMetricIcon(metric.icon)}
										</Avatar>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												fontSize: 10,
												color:
													metric.changeType === "positive"
														? "success.main"
														: "error.main",
											}}
										>
											{metric.change}
										</Typography>
									</Stack>
									<Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.4 }}>
										{metric.value}
									</Typography>
									<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
										{metric.label}
									</Typography>
								</Paper>
							</Grid>
						))}
					</Grid>

					<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
						<Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
							<Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
								Service Performance Report
							</Typography>
							<Button
								size="small"
								variant="outlined"
								startIcon={<Download size={14} />}
								onClick={downloadExcel}
								sx={{ fontSize: 11 }}
								disabled={serviceReports.length === 0}
							>
								Download CSV
							</Button>
						</Box>

						<Box sx={{ overflowX: "auto" }}>
							<Table size="small" sx={{ minWidth: { xs: 620, md: 740 } }}>
								<TableHead>
									<TableRow sx={{ bgcolor: "background.default" }}>
										<TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Service Name</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, fontSize: 11 }}>
											Orders
										</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, fontSize: 11 }}>
											Revenue
										</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, fontSize: 11 }}>
											Avg Value
										</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, fontSize: 11 }}>
											Growth
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{serviceReports.length > 0 ? (
										serviceReports.map((service) => (
											<TableRow key={service.id} sx={{ "&:hover": { bgcolor: "background.default" } }}>
												<TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{service.name}</TableCell>
												<TableCell align="right" sx={{ fontSize: 12 }}>
													{service.orders}
												</TableCell>
												<TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: "success.main" }}>
													{service.revenue}
												</TableCell>
												<TableCell align="right" sx={{ fontSize: 12 }}>
													{service.average}
												</TableCell>
												<TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: "success.main" }}>
													{service.growth}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={5} align="center" sx={{ py: 4 }}>
												<Typography variant="body2" color="text.secondary">No report data found.</Typography>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</Box>
					</Paper>
				</Box>

				<Footer />
			</Box>
		</Box>
	);
}
