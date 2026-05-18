"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
	EmailOutlined,
	Google,
	LockOutlined,
	Visibility,
	VisibilityOff,
} from "@mui/icons-material";
import { GoogleLogin } from "@react-oauth/google";
import {
	Alert,
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
	initialLoginFormValues,
	loginPageCopy,
} from "../../data/auth";
import { useLogin } from "../../hooks/use-login";
import type { LoginFormValues } from "../../types/auth";

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

function validateLoginForm(values: LoginFormValues): LoginFormErrors {
	const errors: LoginFormErrors = {};

	if (!values.email.trim()) {
		errors.email = "Email address is required.";
	}

	if (!values.password) {
		errors.password = "Password is required.";
	}

	return errors;
}

export default function LoginPage() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [formValues, setFormValues] = useState<LoginFormValues>(initialLoginFormValues);
	const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
	const { login, isSubmitting, apiError, clearApiError } = useLogin();

	const handleFieldChange = (field: keyof LoginFormValues, value: string) => {
		setFormValues((previous) => ({
			...previous,
			[field]: value,
		}));

		if (formErrors[field]) {
			setFormErrors((previous) => ({
				...previous,
				[field]: undefined,
			}));
		}

		if (apiError) {
			clearApiError();
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const validationErrors = validateLoginForm(formValues);

		if (Object.keys(validationErrors).length > 0) {
			setFormErrors(validationErrors);
			return;
		}

		setFormErrors({});

		const result = await login(formValues);

		if (!result.ok) {
			return;
		}

		router.replace(result.user.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
	};

	const handleGoogleSuccess = async (credentialResponse: any) => {
		clearApiError();
		try {
			const response = await fetch("/api/auth/google", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ credential: credentialResponse.credential }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Google authentication failed.");
			}

			router.replace(data.user.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
		} catch (error: any) {
			console.error("Google login error:", error);
		}
	};

	return (
		<AuthLayoutWrapper>
			<Box sx={{ px: { xs: 2, sm: 6 }, py: { xs: 3, sm: 5 } }}>
				<Typography variant="h4" sx={{ fontWeight: 800, textAlign: "center", mb: 4, background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
					{loginPageCopy.title}
				</Typography>

				<Box component="form" onSubmit={handleSubmit} noValidate>
					<Stack spacing={2.5}>
						<TextField
							fullWidth
							required
							label={loginPageCopy.emailLabel}
							type="email"
							autoComplete="email"
							value={formValues.email}
							onChange={(event) => handleFieldChange("email", event.target.value)}
							error={Boolean(formErrors.email)}
							helperText={formErrors.email}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<EmailOutlined />
									</InputAdornment>
								),
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
									transition: "all 0.3s ease",
									background: "rgba(255,255,255,0.6)",
									"&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
									"&.Mui-focused": { boxShadow: "0 4px 20px rgba(56, 239, 125, 0.2)", background: "#fff" }
								}
							}}
						/>

						<TextField
							fullWidth
							required
							label={loginPageCopy.passwordLabel}
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							value={formValues.password}
							onChange={(event) => handleFieldChange("password", event.target.value)}
							error={Boolean(formErrors.password)}
							helperText={formErrors.password}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LockOutlined />
									</InputAdornment>
								),
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											edge="end"
											onClick={() => setShowPassword((previous) => !previous)}
											aria-label="toggle password visibility"
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
									transition: "all 0.3s ease",
									background: "rgba(255,255,255,0.6)",
									"&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
									"&.Mui-focused": { boxShadow: "0 4px 20px rgba(56, 239, 125, 0.2)", background: "#fff" }
								}
							}}
						/>

						{apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}
					</Stack>

					<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }} component="div">
						<Typography
							component={Link}
							href="/auth/forgotPass"
							variant="caption"
							sx={{ color: "text.secondary", fontWeight: 600, textDecoration: "none", transition: "color 0.2s ease", "&:hover": { color: "#11998e" } }}
						>
							{loginPageCopy.forgotPasswordLabel}
						</Typography>
					</Box>

					<Stack alignItems="center" spacing={2.5} sx={{ mt: 3 }}>
						<Button 
							type="submit" 
							variant="contained" 
							size="large" 
							disabled={isSubmitting}
							sx={{ 
								width: "100%",
								py: 1.5,
								borderRadius: 2.5,
								fontWeight: 700,
								textTransform: "none",
								fontSize: "1.1rem",
								background: "linear-gradient(45deg, #11998e 0%, #38ef7d 100%)",
								backgroundSize: "200% auto",
								transition: "all 0.4s ease",
								boxShadow: "0 4px 14px rgba(56, 239, 125, 0.3)",
								"&:hover": { 
									backgroundPosition: "right center",
									transform: "translateY(-2px)",
									boxShadow: "0 10px 20px rgba(56, 239, 125, 0.5)" 
								},
								"&:disabled": {
									background: "#e0e0e0",
									color: "#9e9e9e",
									boxShadow: "none",
								}
							}}
						>
							{isSubmitting ? "Logging In..." : loginPageCopy.submitLabel}
						</Button>

						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
							Or
						</Typography>

						<Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
							<GoogleLogin
								onSuccess={handleGoogleSuccess}
								onError={() => {
									console.error("Google Login Failed");
								}}
								useOneTap
								shape="pill"
								theme="outline"
								text="continue_with"
								width="300"
							/>
						</Box>
					</Stack>
				</Box>
			</Box>

			<Box
				sx={{
					borderTop: 1,
					borderColor: "divider",
					px: 3,
					py: 2.5,
					textAlign: "center",
					background: "rgba(248, 250, 252, 0.3)",
				}}
			>
				<Typography variant="body2" color="text.secondary" component="div">
					{loginPageCopy.noAccountPrompt}{" "}
					<Typography
						component={Link}
						href="/auth/signup"
						variant="body2"
						sx={{ 
							fontWeight: 800, 
							color: "#11998e", 
							textDecoration: "none",
							transition: "color 0.2s",
							"&:hover": { color: "#0d7a71" }
						}}
					>
						{loginPageCopy.signupLabel}
					</Typography>
					.
				</Typography>
			</Box>
		</AuthLayoutWrapper>
	);
}
