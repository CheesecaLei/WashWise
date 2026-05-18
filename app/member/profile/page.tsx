"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Eye, EyeOff, Lock, Mail, Phone, Shield, UserRound, Bell, BellRing } from "lucide-react";
import {
	alpha,
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Divider,
	Grid,
	IconButton,
	InputAdornment,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useProfile, type ProfileData, type UpdateProfileResponse, type UpdatePasswordResponse } from "../../hooks/use-profile";
import { usePushNotifications } from "../../hooks/use-push-notifications";

export default function ProfilePage() {
	const { isLoading, isSaving, isChangingPassword, error, fetchProfile, updateProfile, updatePassword } = useProfile();
	const [formValues, setFormValues] = useState<ProfileData>({
		username: "",
		contactNo: "",
		email: "",
	});
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState("");

	// Password change state
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwordFields, setPasswordFields] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showCurrentPw, setShowCurrentPw] = useState(false);
	const [showNewPw, setShowNewPw] = useState(false);
	const [showConfirmPw, setShowConfirmPw] = useState(false);
	const [pwSuccess, setPwSuccess] = useState(false);
	const [pwError, setPwError] = useState("");

	// Push notifications state
	const { isSupported, isSubscribed, subscribe, unsubscribe, error: pushError } = usePushNotifications({ role: 'member' });
	const [isPushLoading, setIsPushLoading] = useState(false);

	useEffect(() => {
		fetchProfile().then((result) => {
			if (result.success) {
				setFormValues(result.user);
			}
		});
	}, [fetchProfile]);

	const handleFieldChange = (field: keyof ProfileData, value: string) => {
		setFormValues((prev) => ({ ...prev, [field]: value }));
		setSaveSuccess(false);
		setSaveError("");
	};

	const handleSave = async () => {
		setSaveSuccess(false);
		setSaveError("");
		const result = await updateProfile(formValues);
		if (!result.success) {
			setSaveError(result.error);
			return;
		}
		setSaveSuccess(true);
	};

	const handlePasswordChange = async () => {
		setPwSuccess(false);
		setPwError("");
		const result = await updatePassword(passwordFields);
		if (!result.success) {
			setPwError(result.error);
			return;
		}
		setPwSuccess(true);
		setPasswordFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
		setShowPasswordForm(false);
	};

	const handleTogglePasswordForm = () => {
		setShowPasswordForm((prev) => !prev);
		setPwError("");
		setPwSuccess(false);
		setPasswordFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
	};

	const handleTogglePush = async () => {
		setIsPushLoading(true);
		try {
			if (isSubscribed) {
				await unsubscribe();
			} else {
				await subscribe();
			}
		} catch (err) {
			console.error("Failed to toggle push notifications", err);
		} finally {
			setIsPushLoading(false);
		}
	};

	if (isLoading) {
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
					<Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 22 }, mb: 0.3 }}>
						Account Overview
					</Typography>
					<Typography sx={{ color: "text.secondary", mb: 1.8, fontSize: 13 }}>
						Manage your personal details, security settings, and communication preferences.
					</Typography>

					{error && (
						<Typography color="error" sx={{ mb: 1.5, fontSize: 13 }}>
							{error}
						</Typography>
					)}

					<Stack spacing={1.5}>
						<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
							<Box sx={{ p: { xs: 1.2, md: 1.5 } }}>
								<Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
									<Box
										sx={{
											width: 32,
											height: 32,
											display: "grid",
											placeItems: "center",
											borderRadius: 1,
											bgcolor: (theme) => alpha(theme.palette.info.main, 0.13),
											color: "info.main",
										}}
									>
										<UserRound size={16} />
									</Box>
									<Box>
										<Typography sx={{ fontWeight: 700, fontSize: 14 }}>Personal Information</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
											Update your contact details used for laundry orders.
										</Typography>
									</Box>
								</Stack>

								<Grid container spacing={1}>
									<Grid size={{ xs: 12, md: 6 }}>
										<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
											Username
										</Typography>
										<TextField
											fullWidth
											size="small"
											value={formValues.username}
											onChange={(event) => handleFieldChange("username", event.target.value)}
											sx={{ mt: 0.4 }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
											Contact Number
										</Typography>
										<TextField
											fullWidth
											size="small"
											value={formValues.contactNo}
											onChange={(event) => handleFieldChange("contactNo", event.target.value)}
											sx={{ mt: 0.4 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<Phone size={13} />
													</InputAdornment>
												),
											}}
										/>
									</Grid>

									<Grid size={12}>
										<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
											Email Address
										</Typography>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={0.8} sx={{ mt: 0.4 }} alignItems={{ xs: "stretch", sm: "center" }}>
											<TextField
												fullWidth
												size="small"
												value={formValues.email}
												onChange={(event) => handleFieldChange("email", event.target.value)}
												InputProps={{
													startAdornment: (
														<InputAdornment position="start">
															<Mail size={13} />
														</InputAdornment>
													),
												}}
											/>
											<Chip
												icon={<CheckCircle2 size={13} />}
												label="Verified"
												color="success"
												variant="outlined"
												sx={{ alignSelf: { xs: "flex-start", sm: "center" }, height: 28, fontSize: 11 }}
												size="small"
											/>
										</Stack>
										<Typography variant="caption" sx={{ color: "text.secondary", mt: 0.4, display: "block", fontSize: 10 }}>
											Your email is used for receipts and order updates.
										</Typography>
									</Grid>
								</Grid>
							</Box>

							<Divider />

							<Box sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<Box>
									{saveSuccess && (
										<Typography color="success.main" sx={{ fontSize: 12 }}>
											Profile updated successfully.
										</Typography>
									)}
									{saveError && (
										<Typography color="error" sx={{ fontSize: 12 }}>
											{saveError}
										</Typography>
									)}
								</Box>
								<Button
									variant="contained"
									size="small"
									onClick={handleSave}
									disabled={isSaving}
								>
									{isSaving ? "Saving…" : "Save Changes"}
								</Button>
							</Box>
						</Paper>

						<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: { xs: 1.2, md: 1.5 } }}>
							<Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
								<Box
									sx={{
										width: 32,
										height: 32,
										display: "grid",
										placeItems: "center",
										borderRadius: 1,
										bgcolor: (theme) => alpha(theme.palette.info.main, 0.13),
										color: "info.main",
									}}
								>
									<Shield size={16} />
								</Box>
								<Box>
									<Typography sx={{ fontWeight: 700, fontSize: 14 }}>Account Security</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
										Secure your account with a strong password.
									</Typography>
								</Box>
							</Stack>

							<Paper variant="outlined" sx={{ p: 1, borderRadius: 1, mb: 1 }}>
								<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
									<Stack direction="row" spacing={1} alignItems="center">
										<Box
											sx={{
												width: 28,
												height: 28,
												display: "grid",
												placeItems: "center",
												borderRadius: "50%",
												bgcolor: (theme) => alpha(theme.palette.text.primary, 0.08),
												color: "text.secondary",
											}}
										>
											<Lock size={12} />
										</Box>
										<Box>
											<Typography sx={{ fontWeight: 700, fontSize: 12 }}>Password</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
												Keep your account safe with a strong password.
											</Typography>
										</Box>
									</Stack>
									<Button
										variant={showPasswordForm ? "contained" : "outlined"}
										size="small"
										color={showPasswordForm ? "error" : "primary"}
										sx={{ py: 0.5, fontSize: 11 }}
										onClick={handleTogglePasswordForm}
									>
										{showPasswordForm ? "Cancel" : "Change Password"}
									</Button>
								</Stack>

								<Collapse in={showPasswordForm} unmountOnExit>
									<Box sx={{ mt: 1.5 }}>
										<Divider sx={{ mb: 1.5 }} />
										<Grid container spacing={1}>
											<Grid size={12}>
												<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
													Current Password
												</Typography>
												<TextField
													fullWidth
													size="small"
													type={showCurrentPw ? "text" : "password"}
													value={passwordFields.currentPassword}
													onChange={(e) => setPasswordFields((p) => ({ ...p, currentPassword: e.target.value }))}
													sx={{ mt: 0.4 }}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start"><Lock size={13} /></InputAdornment>
														),
														endAdornment: (
															<InputAdornment position="end">
																<IconButton size="small" onClick={() => setShowCurrentPw((v) => !v)} edge="end">
																	{showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
																</IconButton>
															</InputAdornment>
														),
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 6 }}>
												<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
													New Password
												</Typography>
												<TextField
													fullWidth
													size="small"
													type={showNewPw ? "text" : "password"}
													value={passwordFields.newPassword}
													onChange={(e) => setPasswordFields((p) => ({ ...p, newPassword: e.target.value }))}
													sx={{ mt: 0.4 }}
													helperText="Minimum 8 characters"
													InputProps={{
														endAdornment: (
															<InputAdornment position="end">
																<IconButton size="small" onClick={() => setShowNewPw((v) => !v)} edge="end">
																	{showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
																</IconButton>
															</InputAdornment>
														),
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 6 }}>
												<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 11 }}>
													Confirm New Password
												</Typography>
												<TextField
													fullWidth
													size="small"
													type={showConfirmPw ? "text" : "password"}
													value={passwordFields.confirmPassword}
													onChange={(e) => setPasswordFields((p) => ({ ...p, confirmPassword: e.target.value }))}
													sx={{ mt: 0.4 }}
													InputProps={{
														endAdornment: (
															<InputAdornment position="end">
																<IconButton size="small" onClick={() => setShowConfirmPw((v) => !v)} edge="end">
																	{showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
																</IconButton>
															</InputAdornment>
														),
													}}
												/>
											</Grid>
										</Grid>

										<Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
											<Box>
												{pwError && (
													<Typography color="error" sx={{ fontSize: 12 }}>{pwError}</Typography>
												)}
											</Box>
											<Button
												variant="contained"
												size="small"
												onClick={handlePasswordChange}
												disabled={isChangingPassword}
											>
												{isChangingPassword ? "Updating…" : "Update Password"}
											</Button>
										</Stack>
									</Box>
								</Collapse>
							</Paper>

							{pwSuccess && (
								<Paper variant="outlined" sx={{ p: 1, borderRadius: 1, mb: 1, borderColor: "success.main", bgcolor: (theme) => alpha(theme.palette.success.main, 0.07) }}>
									<Stack direction="row" spacing={0.6} alignItems="center">
										<CheckCircle2 size={12} color="green" />
										<Typography variant="caption" sx={{ color: "success.main", fontSize: 11, fontWeight: 600 }}>
											Password updated successfully.
										</Typography>
									</Stack>
								</Paper>
							)}

							<Paper
								variant="outlined"
								sx={{
									p: 1,
									borderRadius: 1,
									bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
									borderColor: (theme) => alpha(theme.palette.warning.main, 0.25),
								}}
							>
								<Stack direction="row" spacing={0.6} alignItems="center">
									<CircleAlert size={12} />
									<Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>
										Two-factor authentication is currently disabled. We recommend enabling it for better security.
									</Typography>
								</Stack>
							</Paper>
						</Paper>

						{/* Push Notifications Section */}
						<Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: { xs: 1.2, md: 1.5 } }}>
							<Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
								<Box
									sx={{
										width: 32,
										height: 32,
										display: "grid",
										placeItems: "center",
										borderRadius: 1,
										bgcolor: (theme) => alpha(theme.palette.success.main, 0.13),
										color: "success.main",
									}}
								>
									{isSubscribed ? <BellRing size={16} /> : <Bell size={16} />}
								</Box>
								<Box>
									<Typography sx={{ fontWeight: 700, fontSize: 14 }}>Push Notifications</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
										Receive background updates on your order status.
									</Typography>
								</Box>
							</Stack>

							<Paper variant="outlined" sx={{ p: 1, borderRadius: 1, mb: 1 }}>
								<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
									<Stack direction="row" spacing={1} alignItems="center">
										<Box>
											<Typography sx={{ fontWeight: 700, fontSize: 12 }}>
												{isSubscribed ? "Notifications Enabled" : "Notifications Disabled"}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
												{isSupported
													? "We will send you alerts even when the app is closed."
													: "Your browser does not support Web Push."}
											</Typography>
										</Box>
									</Stack>
									<Button
										variant={isSubscribed ? "outlined" : "contained"}
										size="small"
										color={isSubscribed ? "error" : "success"}
										sx={{ py: 0.5, fontSize: 11 }}
										onClick={handleTogglePush}
										disabled={!isSupported || isPushLoading}
									>
										{isPushLoading ? "Updating…" : isSubscribed ? "Disable" : "Enable"}
									</Button>
								</Stack>
								{pushError && (
									<Typography color="error" sx={{ mt: 1, fontSize: 11 }}>
										{pushError.message}
									</Typography>
								)}
							</Paper>
						</Paper>
					</Stack>
				</Box>

				<Footer />
			</Box>
		</Box>
	);
}
