"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	EmailOutlined,
	LockOutlined,
	PersonOutline,
	HomeOutlined,
	Visibility,
	VisibilityOff,
	ArrowBack,
} from "@mui/icons-material";
import {
	Alert,
	alpha,
	Box,
	Button,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import AuthLayoutWrapper from "../components/AuthLayoutWrapper";
import {
	authFooterBrandText,
	authFooterLinks,
	forgotPasswordPageCopy,
} from "../../data/auth";
import { useForgotPassword } from "../../hooks/use-forgot-password";
import type { ForgotPasswordStep } from "../../types/auth";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const { isSubmitting, apiError, verifyInitial, verifyChallenge, resetPassword, clearApiError } = useForgotPassword();

	const [step, setStep] = useState<ForgotPasswordStep>("initial");
	const [userId, setUserId] = useState<string>("");
	const [providedType, setProvidedType] = useState<"email" | "username" | null>(null);

	// Form Values
	const [initialCredential, setInitialCredential] = useState("");
	const [secondaryCredential, setSecondaryCredential] = useState("");
	const [address, setAddress] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const activeStepIndex = step === "initial" ? 0 : step === "challenge" ? 1 : 2;

	const handleInitialSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!initialCredential.trim()) return;

		const result = await verifyInitial(initialCredential);
		if (result.ok && result.data) {
			setUserId(result.data.userId);
			setProvidedType(result.data.providedType);
			setStep("challenge");
		}
	};

	const handleChallengeSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!secondaryCredential.trim() || !address.trim()) return;

		const result = await verifyChallenge(userId, secondaryCredential, address);
		if (result.ok) {
			setStep("reset");
		}
	};

	const handleResetSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPassword || newPassword !== confirmPassword) return;

		const result = await resetPassword(userId, newPassword);
		if (result.ok) {
			router.push("/auth/login?reset=success");
		}
	};

	return (
		<AuthLayoutWrapper>
			<Box sx={{ px: { xs: 2, sm: 6 }, py: { xs: 3, sm: 5 } }}>
				<Box sx={{ mb: 2, textAlign: "center" }}>
					<Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
						{forgotPasswordPageCopy.title}
					</Typography>
				</Box>

				<Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 4 }}>
					{[0, 1, 2].map((idx) => (
						<Box 
							key={idx} 
							sx={{ 
								width: activeStepIndex === idx ? 32 : 10, 
								height: 6, 
								borderRadius: 3, 
								bgcolor: (theme) => activeStepIndex === idx ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3),
								transition: "all 0.3s ease"  
							}} 
						/>
					))}
				</Stack>

				{step === "initial" && (
					<Box component="form" onSubmit={handleInitialSubmit}>
						<Stack spacing={2.5}>
							<TextField
								fullWidth
								label="Email or Username"
								variant="outlined"
								value={initialCredential}
								onChange={(e) => {
									setInitialCredential(e.target.value);
									if (apiError) clearApiError();
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<PersonOutline />
										</InputAdornment>
									),
								}}
							/>
							{apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}
							<Button
								type="submit"
								variant="contained"
								size="large"
								disabled={isSubmitting || !initialCredential.trim()}
								sx={{ mt: 1, width: "100%", py: 1.5 }}
							>
								{isSubmitting ? "Verifying..." : forgotPasswordPageCopy.submitInitial}
							</Button>
						</Stack>
					</Box>
				)}

				{step === "challenge" && (
					<Box component="form" onSubmit={handleChallengeSubmit}>
						<Stack spacing={2.5}>
							<TextField
								fullWidth
								label={providedType === "email" ? "Username" : "Email Address"}
								variant="outlined"
								value={secondaryCredential}
								onChange={(e) => {
									setSecondaryCredential(e.target.value);
									if (apiError) clearApiError();
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											{providedType === "email" ? <PersonOutline /> : <EmailOutlined />}
										</InputAdornment>
									),
								}}
							/>
							<TextField
								fullWidth
								label="Registered Address"
								variant="outlined"
								multiline
								rows={2}
								value={address}
								onChange={(e) => {
									setAddress(e.target.value);
									if (apiError) clearApiError();
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<HomeOutlined />
										</InputAdornment>
									),
								}}
							/>
							{apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}
							<Button
								type="submit"
								variant="contained"
								size="large"
								disabled={isSubmitting || !secondaryCredential.trim() || !address.trim()}
								sx={{ mt: 1, width: "100%", py: 1.5 }}
							>
								{isSubmitting ? "Verifying..." : forgotPasswordPageCopy.submitChallenge}
							</Button>
						</Stack>
					</Box>
				)}

				{step === "reset" && (
					<Box component="form" onSubmit={handleResetSubmit}>
						<Stack spacing={2.5}>
							<TextField
								fullWidth
								label="New Password"
								type={showPassword ? "text" : "password"}
								variant="outlined"
								value={newPassword}
								onChange={(e) => {
									setNewPassword(e.target.value);
									if (apiError) clearApiError();
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<LockOutlined />
										</InputAdornment>
									),
									endAdornment: (
										<InputAdornment position="end">
											<IconButton edge="end" onClick={() => setShowPassword(!showPassword)}>
												{showPassword ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
							<TextField
								fullWidth
								label="Confirm New Password"
								type={showPassword ? "text" : "password"}
								variant="outlined"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								error={confirmPassword !== "" && newPassword !== confirmPassword}
								helperText={confirmPassword !== "" && newPassword !== confirmPassword ? "Passwords do not match" : ""}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<LockOutlined />
										</InputAdornment>
									),
								}}
							/>
							{apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}
							<Button
								type="submit"
								variant="contained"
								size="large"
								disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
								sx={{ mt: 1, width: "100%", py: 1.5 }}
							>
								{isSubmitting ? "Resetting..." : forgotPasswordPageCopy.submitReset}
							</Button>
						</Stack>
					</Box>
				)}

				<Box sx={{ mt: 4, textAlign: "center" }}>
					<Button
						component={Link}
						href="/auth/login"
						variant="text"
						startIcon={<ArrowBack />}
						sx={{ 
							textTransform: "none", 
							color: "primary.main",
							fontWeight: 600,
							"&:hover": { color: "primary.dark", background: "rgba(0,0,0,0.05)" }
						}}
					>
						{forgotPasswordPageCopy.backToLogin}
					</Button>
				</Box>
			</Box>
		</AuthLayoutWrapper>
	);
}
