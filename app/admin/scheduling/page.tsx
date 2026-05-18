"use client";

import { useState, useMemo } from "react";
import { 
    CalendarDays, 
    Clock, 
    MapPin, 
    Phone, 
    RefreshCcw, 
    Truck, 
    Package, 
    User,
    Search,
    CheckCircle2,
    Circle,
    MoreVertical,
} from "lucide-react";
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    InputAdornment,
    TextField,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { pusherClient } from "../../lib/pusher-client";
import { useSchedules, Schedule } from "../../hooks/use-schedules";
import { useOrderHandoverUpdate } from "../../hooks/use-order-handover-update";
import { useRecordPayment } from "../../hooks/use-record-payment";
import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";

function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
        case "waiting":
            return "info";
        case "in-progress":
            return "warning";
        case "ready":
            return "success";
        case "closed":
            return "default";
        default:
            return "primary";
    }
}

export default function SchedulingPage() {
    const { schedules, loading, error, refresh } = useSchedules();
    const { updateHandover, isUpdating } = useOrderHandoverUpdate();
    const { recordPayment, isRecording } = useRecordPayment();
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Schedule | null>(null);
    const [handoverAnchorEl, setHandoverAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOrderForHandover, setSelectedOrderForHandover] = useState<Schedule | null>(null);
    const [paymentAnchorEl, setPaymentAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOrderForPaymentStatus, setSelectedOrderForPaymentStatus] = useState<Schedule | null>(null);

    const recordHandover = async (orderId: string, handoverType: "picked-up" | "received-by-staff" | "received-by-client") => {
        const now = new Date().toISOString();
        const updateData: any = { orderId };

        switch (handoverType) {
            case "picked-up":
                updateData.pickedUpAt = now;
                break;
            case "received-by-staff":
                updateData.receivedByStaffAt = now;
                break;
            case "received-by-client":
                updateData.receivedByClientAt = now;
                break;
        }

        const result = await updateHandover(updateData);
        if (result.success) {
            toast.success(`✅ ${handoverType.replace("-", " ").toUpperCase()} recorded!`, { autoClose: 3000 });
            refresh();
        } else {
            toast.error(result.error || "Failed to record handover", { autoClose: 3000 });
        }
    };

    const handleRecordPayment = async (schedule: Schedule) => {
        setSelectedOrderForPayment(schedule);
        setPaymentDialogOpen(true);
    };

    const executeRecordPayment = async () => {
        if (!selectedOrderForPayment) return;

        const result = await recordPayment({
            orderId: selectedOrderForPayment.orderId,
            amount: selectedOrderForPayment.finalTotal,
            method: "COD",
            notes: "Payment received by staff",
        });

        if (result.success) {
            toast.success(`✅ Payment of ₱${selectedOrderForPayment.finalTotal.toFixed(2)} recorded!`, { autoClose: 3000 });
            refresh();
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
            console.log("Real-time: New order received!", data);
            toast.info(`New Order Received! #${data.orderId?.slice(-6).toUpperCase() || "N/A"}`, {
                icon: <span>🧺</span>
            });
            refresh();
        });

        updatesChannel.bind("order-status-updated", (data: any) => {
            console.log("Real-time: Order status updated!", data);
            refresh();
        });

        return () => {
            pusherClient.unsubscribe("admin-notifications");
            pusherClient.unsubscribe("order-updates");
        };
    }, [refresh]);

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => 
            s.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [schedules, searchQuery]);

    if (loading && schedules.length === 0) {
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
                    height: "100dvh",
                    overflow: "hidden"
                }}
            >
                <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, flex: 1, overflowY: "auto" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                                Order Scheduling
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Monitor and manage pickup and drop-off time slots.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1.5}>
                            <TextField
                                size="small"
                                placeholder="Search schedules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search size={16} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ 
                                    width: { xs: 150, sm: 250 },
                                    "& .MuiOutlinedInput-root": { borderRadius: 2 }
                                }}
                            />
                            <Button 
                                variant="contained" 
                                startIcon={<RefreshCcw size={18} className={loading ? "animate-spin" : ""} />}
                                onClick={refresh}
                                disabled={loading}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                Refresh
                            </Button>
                        </Stack>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>ORDER</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>CUSTOMER</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>METHOD & SLOT</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>LOCATION</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>WEIGHT</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>PAYMENT</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>HANDOVER</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredSchedules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <CalendarDays size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                                                <Typography color="text.secondary">No schedules found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSchedules.map((schedule) => (
                                            <TableRow key={schedule.id} hover>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: "primary.main" }}>
                                                        #{schedule.orderCode}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID: {schedule.id.slice(-6)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha("#3f51b5", 0.1), color: "primary.main" }}>
                                                            <User size={16} />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                                                                {schedule.customerName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <Phone size={10} /> {schedule.customerPhone}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Chip 
                                                            icon={schedule.serviceMethod === "pickup" ? <Truck size={12} /> : <Package size={12} />}
                                                            label={schedule.serviceMethod.toUpperCase()} 
                                                            size="small"
                                                            sx={{ 
                                                                height: 20, 
                                                                fontSize: 10, 
                                                                fontWeight: 700,
                                                                bgcolor: schedule.serviceMethod === "pickup" ? alpha("#4caf50", 0.1) : alpha("#ff9800", 0.1),
                                                                color: schedule.serviceMethod === "pickup" ? "success.main" : "warning.main",
                                                                "& .MuiChip-icon": { color: "inherit" }
                                                            }}
                                                        />
                                                        <Typography sx={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <Clock size={14} className="text-blue-500" /> {schedule.selectedSlot}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 250 }}>
                                                    <Typography variant="body2" sx={{ fontSize: 12, color: "text.primary", display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                                                        <MapPin size={14} className="text-red-400" style={{ marginTop: 2 }} />
                                                        {schedule.address}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                                                        {schedule.totalWeight} kg
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title="Manage Payment Status">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                setSelectedOrderForPaymentStatus(schedule);
                                                                setPaymentAnchorEl(e.currentTarget);
                                                            }}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={schedule.status} 
                                                        size="small" 
                                                        color={getStatusColor(schedule.status) as any}
                                                        sx={{ fontWeight: 700, fontSize: 10, height: 22 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title="View/Record Handover Stages">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                setSelectedOrderForHandover(schedule);
                                                                setHandoverAnchorEl(e.currentTarget);
                                                            }}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
                <Footer />
            </Box>

            <Dialog
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400, width: "100%" } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Record Payment Received</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2, fontSize: 13 }}>
                        Confirm payment received for Order #{selectedOrderForPayment?.orderCode}
                    </DialogContentText>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "rgba(76, 175, 80, 0.04)", borderColor: "success.light", mb: 1.5 }}>
                        <Stack spacing={0.8}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">
                                    Customer
                                </Typography>
                                <Typography variant="caption" fontWeight={700}>
                                    {selectedOrderForPayment?.customerName}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">
                                    Payment Method
                                </Typography>
                                <Typography variant="caption" fontWeight={700}>
                                    COD (Cash on Delivery)
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5, borderTop: 1, borderColor: "divider" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 12 }}>Amount</Typography>
                                <Typography sx={{ fontWeight: 800, color: "success.main", fontSize: 14 }}>
                                    ₱{selectedOrderForPayment?.finalTotal.toFixed(2)}
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

            <Menu
                anchorEl={handoverAnchorEl}
                open={Boolean(handoverAnchorEl)}
                onClose={() => {
                    setHandoverAnchorEl(null);
                    setSelectedOrderForHandover(null);
                }}
                PaperProps={{ sx: { minWidth: 280 } }}
            >
                <MenuItem disabled sx={{ fontWeight: 700, fontSize: 12, pb: 1 }}>
                    Handover Milestones
                </MenuItem>
                
                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForHandover) {
                            await recordHandover(selectedOrderForHandover.orderId, "picked-up");
                            setHandoverAnchorEl(null);
                            setSelectedOrderForHandover(null);
                        }
                    }}
                    disabled={isUpdating}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            {selectedOrderForHandover?.pickedUpAt ? (
                                <CheckCircle2 size={16} style={{ color: "#4caf50" }} />
                            ) : (
                                <Circle size={16} />
                            )}
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Picked Up</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            {selectedOrderForHandover?.pickedUpAt
                                ? new Date(selectedOrderForHandover.pickedUpAt).toLocaleString()
                                : "Awaiting pickup from client"}
                        </Typography>
                    </Stack>
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForHandover) {
                            await recordHandover(selectedOrderForHandover.orderId, "received-by-staff");
                            setHandoverAnchorEl(null);
                            setSelectedOrderForHandover(null);
                        }
                    }}
                    disabled={isUpdating}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            {selectedOrderForHandover?.receivedByStaffAt ? (
                                <CheckCircle2 size={16} style={{ color: "#4caf50" }} />
                            ) : (
                                <Circle size={16} />
                            )}
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Received by Staff</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            {selectedOrderForHandover?.receivedByStaffAt
                                ? new Date(selectedOrderForHandover.receivedByStaffAt).toLocaleString()
                                : "Awaiting facility receipt & weighing"}
                        </Typography>
                    </Stack>
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForHandover) {
                            await recordHandover(selectedOrderForHandover.orderId, "received-by-client");
                            setHandoverAnchorEl(null);
                            setSelectedOrderForHandover(null);
                        }
                    }}
                    disabled={isUpdating}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            {selectedOrderForHandover?.receivedByClientAt ? (
                                <CheckCircle2 size={16} style={{ color: "#4caf50" }} />
                            ) : (
                                <Circle size={16} />
                            )}
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Received by Client</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            {selectedOrderForHandover?.receivedByClientAt
                                ? new Date(selectedOrderForHandover.receivedByClientAt).toLocaleString()
                                : "Awaiting delivery confirmation"}
                        </Typography>
                    </Stack>
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={paymentAnchorEl}
                open={Boolean(paymentAnchorEl)}
                onClose={() => {
                    setPaymentAnchorEl(null);
                    setSelectedOrderForPaymentStatus(null);
                }}
                PaperProps={{ sx: { minWidth: 320 } }}
            >
                <MenuItem disabled sx={{ fontWeight: 700, fontSize: 12, pb: 1 }}>
                    Payment Status Tracking
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForPaymentStatus && selectedOrderForPaymentStatus.paymentStatus !== "unpaid") {
                            // Call endpoint to mark as unpaid
                            console.log("Marking order as unpaid");
                            setPaymentAnchorEl(null);
                            setSelectedOrderForPaymentStatus(null);
                            refresh();
                            toast.success("Order marked as unpaid");
                        }
                    }}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: selectedOrderForPaymentStatus?.paymentStatus === "unpaid" ? "#ff9800" : "transparent",
                                    border: "2px solid #ff9800",
                                }}
                            />
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Unpaid</Typography>
                            {selectedOrderForPaymentStatus?.paymentStatus === "unpaid" && (
                                <Chip label="Current" size="small" sx={{ height: 20, fontSize: 10, ml: "auto" }} />
                            )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            Order placed but no payment recorded
                        </Typography>
                    </Stack>
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForPaymentStatus) {
                            // Call endpoint to mark as partially paid
                            console.log("Marking order as partially paid");
                            setPaymentAnchorEl(null);
                            setSelectedOrderForPaymentStatus(null);
                            refresh();
                            toast.success("Order marked as partially paid");
                        }
                    }}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: selectedOrderForPaymentStatus?.paymentStatus === "partially_paid" ? "#ffc107" : "transparent",
                                    border: "2px solid #ffc107",
                                }}
                            />
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Partially Paid</Typography>
                            {selectedOrderForPaymentStatus?.paymentStatus === "partially_paid" && (
                                <Chip label="Current" size="small" sx={{ height: 20, fontSize: 10, ml: "auto" }} />
                            )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            Down-payment received, balance pending
                        </Typography>
                    </Stack>
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForPaymentStatus && selectedOrderForPaymentStatus.paymentStatus === "unpaid") {
                            await handleRecordPayment(selectedOrderForPaymentStatus);
                            setPaymentAnchorEl(null);
                            setSelectedOrderForPaymentStatus(null);
                        }
                    }}
                    disabled={selectedOrderForPaymentStatus?.paymentStatus !== "unpaid"}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: selectedOrderForPaymentStatus?.paymentStatus === "paid" ? "#4caf50" : "transparent",
                                    border: "2px solid #4caf50",
                                }}
                            />
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Paid</Typography>
                            {selectedOrderForPaymentStatus?.paymentStatus === "paid" && (
                                <Chip label="Current" size="small" sx={{ height: 20, fontSize: 10, ml: "auto" }} />
                            )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            Full transaction cleared
                        </Typography>
                    </Stack>
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        if (selectedOrderForPaymentStatus) {
                            // Call endpoint to mark as refunded
                            console.log("Marking order as refunded");
                            setPaymentAnchorEl(null);
                            setSelectedOrderForPaymentStatus(null);
                            refresh();
                            toast.success("Order marked as refunded");
                        }
                    }}
                    sx={{ py: 1.5 }}
                >
                    <Stack spacing={0.3} sx={{ width: "100%" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: selectedOrderForPaymentStatus?.paymentStatus === "refunded" ? "#f44336" : "transparent",
                                    border: "2px solid #f44336",
                                }}
                            />
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Refunded</Typography>
                            {selectedOrderForPaymentStatus?.paymentStatus === "refunded" && (
                                <Chip label="Current" size="small" sx={{ height: 20, fontSize: 10, ml: "auto" }} />
                            )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, ml: 3 }}>
                            Refund issued due to cancellation
                        </Typography>
                    </Stack>
                </MenuItem>
            </Menu>
        </Box>
    );
}
