"use client";

import { useEffect, useState } from "react";
import { CircleUserRound, ClipboardList, MapPin, Receipt, UserRound, Waves, ShoppingBasket, CircleQuestionMark, LayoutDashboard, FileText, Users, TrendingUp, Activity, Settings2, CalendarDays, Gift } from "lucide-react";
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { usePathname } from "next/navigation";
import { useLogout } from "../hooks/use-logout";
import { useLayoutShell } from "../providers/layout-shell-provider";
import { useOfflineStatus } from "../hooks/use-offline-status";
import { useProfile, type ProfileData } from "../hooks/use-profile";
import type { SidebarIconName } from "../types/layout-shell";
// import { ExpandMore } from '@mui/icons-material'

function SidebarIcon({ icon, size = 16 }: { icon: SidebarIconName; size?: number }) {
	const iconProps = { size, strokeWidth: 1.9 };

	switch (icon) {
		case "new-order":
			return <ShoppingBasket {...iconProps} />;
		case "orders":
			return <ClipboardList {...iconProps} />;
		case "profile":
			return <UserRound {...iconProps} />;
		case "address":
			return <MapPin {...iconProps} />;
		case "support":
			return <CircleQuestionMark {...iconProps} />;
		case "dashboard":
			return <LayoutDashboard {...iconProps} />;
		case "report":
			return <FileText {...iconProps} />;
		case "user-management":
			return <Users {...iconProps} />;
		case "progress":
			return <TrendingUp {...iconProps} />;
		case "activities":
			return <Activity {...iconProps} />;
		case "services":
			return <Settings2 {...iconProps} />;
		case "scheduling":
			return <CalendarDays {...iconProps} />;
		case "rewards":
			return <Gift {...iconProps} />;
		default:
			return <Receipt {...iconProps} />;
	}
}

// export default function SidebarRedirect() {
    
// }

export default function Sidebar({ isAdmin: propIsAdmin }: { isAdmin?: boolean }) {
	const pathname = usePathname();
	const isOffline = useOfflineStatus();
	const { fetchProfile } = useProfile();
	const [profileUser, setProfileUser] = useState<ProfileData | null>(null);
	const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

	const {
		brandName,
		sidebarTitle,
		accountTitle,
		navItems,
		accountItems,
		sidebarCollapsed,
		toggleSidebar,
		navigate,
	} = useLayoutShell();
    const { logout, isSubmitting, apiError } = useLogout();
	const compactSidebar = sidebarCollapsed;

	useEffect(() => {
		if (!isOffline) {
			fetchProfile().then((result) => {
				if (result.success) {
					setProfileUser(result.user);
				}
			});
		}
	}, [fetchProfile, isOffline]);

	const isAdmin = pathname.startsWith("/admin");

	function normalizePath(path: string | null | undefined) {
		if (!path) {
			return "/";
		}

		if (path === "/") {
			return path;
		}

		return path.replace(/\/+$/, "");
	}

	function isItemActive(href: string) {
		const current = normalizePath(pathname);
		const target = normalizePath(href);

		if (target === "/") {
			return current === "/";
		}

		return current === target || current.startsWith(`${target}/`);
	}

	async function handleSignOut() {
		const result = await logout();

		if (!result.ok) {
			setConfirmLogoutOpen(false);
			return;
		}

		window.location.href = "/auth/login";
	}

	return (
		<Box
			component="aside"
			sx={{
				width: compactSidebar ? { xs: 76, md: 104 } : 250,
				height: "100dvh",
				position: "sticky",
				top: 0,
				flexShrink: 0,
				borderRight: 1,
				borderColor: "divider",
				bgcolor: "background.paper",
				px: compactSidebar ? { xs: 0.8, md: 1.2 } : 2,
				py: { xs: 2, md: 5 },
				display: "flex",
				flexDirection: "column",
				overflowY: "auto",
				overflowX: "hidden",
				transition: "width 0.2s ease",
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="center" mb={2.6}>
				<Stack
					direction="row"
					alignItems="center"
					spacing={1}
					onClick={toggleSidebar}
					sx={{ cursor: "pointer", borderRadius: 1, px: 0.5, py: 0.3 }}
				>
					<Avatar sx={{ bgcolor: "primary.main", width: 30, height: 30 }}>
						<Waves size={16} />
					</Avatar>
					{!compactSidebar && (
						<Typography variant="h6" sx={{ fontSize: 22, fontWeight: 700, color: "primary.main" }}>
							{brandName}
						</Typography>
					)}
				</Stack>
			</Stack>

			{!compactSidebar && (
				<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, px: 1 }}>
					{sidebarTitle}
				</Typography>
			)}
			{/* Offline banner */}
			{isOffline && (
				<Box sx={{ mb: 1.5 }}>
					{compactSidebar ? (
						<Tooltip title="You're offline — only New Order is available" placement="right">
							<Box sx={{ display: "flex", justifyContent: "center" }}>
								<WifiOffIcon sx={{ fontSize: 18, color: "warning.main" }} />
							</Box>
						</Tooltip>
					) : (
						<Chip
							icon={<WifiOffIcon sx={{ fontSize: "14px !important" }} />}
							label="Offline mode"
							size="small"
							color="warning"
							variant="outlined"
							sx={{ width: "100%", fontWeight: 700, fontSize: 11 }}
						/>
					)}
				</Box>
			)}
			<List dense sx={{ py: 1 }}>
				{navItems.map((item) => {
					const isNewOrder = item.href === "/member/new-order";
					const isDisabled = isOffline && !isNewOrder;
					return (
						<Tooltip
							key={item.id}
							title={isDisabled ? "Not available offline" : ""}
							placement="right"
						>
							<span>
								<ListItemButton
									selected={isItemActive(item.href)}
									disabled={isDisabled}
									onClick={() => !isDisabled && navigate(item.href)}
									sx={{
										borderRadius: 0.5,
										mb: compactSidebar ? 1.1 : 0.4,
										px: compactSidebar ? 0.8 : 1.2,
										height: compactSidebar ? 56 : "auto",
										justifyContent: compactSidebar ? "center" : "flex-start",
										display: "flex",
										alignItems: "center",
										opacity: isDisabled ? 0.38 : 1,
										"&.Mui-selected": {
											bgcolor: "primary.main",
											color: "primary.contrastText",
											"&:hover": { bgcolor: "primary.dark" },
										},
									}}
								>
									<ListItemIcon
										sx={{ minWidth: compactSidebar ? 0 : 28, color: "inherit", justifyContent: "center", width: compactSidebar ? "100%" : "auto", display: "flex" }}
									>
										<SidebarIcon icon={item.icon} size={compactSidebar ? 20 : 16} />
									</ListItemIcon>
									{!compactSidebar && <ListItemText primary={item.label} />}
								</ListItemButton>
							</span>
						</Tooltip>
					);
				})}
			</List>

			<Divider sx={{ my: 1.8 }} />

			{!compactSidebar && (
				<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, px: 1 }}>
					{accountTitle}
				</Typography>
			)}
			<List dense sx={{ py: 1 }}>
				{accountItems.map((item) => (
					<Tooltip
						key={item.id}
						title={isOffline ? "Not available offline" : ""}
						placement="right"
					>
						<span>
							<ListItemButton
								selected={isItemActive(item.href)}
								disabled={isOffline}
								onClick={() => !isOffline && navigate(item.href)}
								sx={{
									borderRadius: 0.5,
									mb: compactSidebar ? 1.1 : 0.4,
									px: compactSidebar ? 0.8 : 1.2,
									height: compactSidebar ? 56 : "auto",
									justifyContent: compactSidebar ? "center" : "flex-start",
									display: "flex",
									alignItems: "center",
									opacity: isOffline ? 0.38 : 1,
									"&.Mui-selected": {
										bgcolor: "primary.main",
										color: "primary.contrastText",
										"&:hover": { bgcolor: "primary.dark" },
									},
								}}
							>
								<ListItemIcon
									sx={{ minWidth: compactSidebar ? 0 : 28, color: "inherit", justifyContent: "center", width: compactSidebar ? "100%" : "auto", display: "flex" }}
								>
									<SidebarIcon icon={item.icon} size={compactSidebar ? 20 : 16} />
								</ListItemIcon>
								{!compactSidebar && <ListItemText primary={item.label} />}
							</ListItemButton>
						</span>
					</Tooltip>
				))}
			</List>

			<Box mt="auto" pt={2}>
				<Paper
					elevation={0}
					sx={{ p: 1.2, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}
				>
					<Stack direction="row" spacing={1.1} alignItems="center">
						<Avatar sx={{ width: compactSidebar ? 40 : 34, height: compactSidebar ? 40 : 34, bgcolor: "primary.main" }}>
							<CircleUserRound size={compactSidebar ? 18 : 17} />
						</Avatar>
						{!compactSidebar && (
							<Box sx={{ minWidth: 0 }}>
								<Typography sx={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
									{profileUser?.username || "—"}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
									{profileUser?.email || (isAdmin ? "Admin" : "Member")}
								</Typography>
							</Box>
						)}
					</Stack>
				</Paper>
				{!compactSidebar && (
					<>
						<Button
							fullWidth
							variant="outlined"
							color="error"
							sx={{ mt: 1.2, borderRadius: 1.3 }}
							onClick={() => setConfirmLogoutOpen(true)}
							disabled={isSubmitting}
						>
							{isSubmitting ? "Signing Out..." : "Sign Out"}
						</Button>
						{apiError && (
							<Alert severity="error" sx={{ mt: 1 }}>
								{apiError}
							</Alert>
						)}
					</>
				)}
			</Box>

			<Dialog
				open={confirmLogoutOpen}
				onClose={() => !isSubmitting && setConfirmLogoutOpen(false)}
				PaperProps={{
					sx: { borderRadius: 3, p: 1 }
				}}
			>
				<DialogTitle sx={{ fontWeight: 700 }}>Confirm Logout</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to log out of your account? Any unsaved progress may be lost.
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button 
						variant="text"
						onClick={() => setConfirmLogoutOpen(false)} 
						disabled={isSubmitting}
						sx={{ 
							color: "primary.main",
							fontWeight: 600,
							"&:hover": { color: "primary.dark", background: "rgba(0,0,0,0.05)" }
						}}
					>
						Cancel
					</Button>
					<Button 
						onClick={handleSignOut} 
						color="error" 
						variant="contained" 
						disabled={isSubmitting}
						sx={{ borderRadius: 1.5, px: 3 }}
					>
						{isSubmitting ? "Logging out..." : "Log Out"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
