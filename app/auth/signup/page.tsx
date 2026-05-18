"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
	EmailOutlined,
	Google,
	HomeOutlined,
	LockOutlined,
	LocationCityOutlined,
	LocationOnOutlined,
	PhoneOutlined,
	PersonOutline,
	Visibility,
	VisibilityOff,
} from "@mui/icons-material";
import { GoogleLogin } from "@react-oauth/google";
import {
	Alert,
	alpha,
	Box,
	Button,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import AuthLayoutWrapper from "../components/AuthLayoutWrapper";
import {
	authFooterBrandText,
	authFooterLinks,
	buildSignupFormattedAddress,
	initialSignupFormValues,
	olongapoBarangays,
	signupFieldHints,
	signupFormLabels,
	signupFormRegex,
	signupPageCopy,
	signupReadonlyAddress,
	signupStepFields,
	signupSteps,
	signupValidationMessages,
} from "../../data/auth";
import { useSignup } from "../../hooks/use-signup";
import type { SignupFieldKey, SignupFormErrors, SignupFormValues } from "../../types/auth";

function normalizePhilippineMobile(rawValue: string) {
	const compactValue = rawValue.replace(/\D/g, "");

	if (signupFormRegex.localMobile.test(compactValue)) {
		return compactValue;
	}

	return null;
}

function limitPhilippineMobileInput(rawValue: string) {
	const compactValue = rawValue.replace(/\D/g, "");
	return compactValue.slice(0, 11);
}

function validateSignupForm(values: SignupFormValues, isGoogleSignup: boolean = false) {
	const errors: SignupFormErrors = {};

	if (!values.nameOrUsername.trim()) {
		errors.nameOrUsername = signupValidationMessages.nameOrUsernameRequired;
	}

	if (!values.email.trim()) {
		errors.email = signupValidationMessages.emailRequired;
	} else if (!signupFormRegex.gmail.test(values.email.trim())) {
		errors.email = signupValidationMessages.emailInvalid;
	}

	if (!values.houseOrUnit.trim()) {
		errors.houseOrUnit = signupValidationMessages.houseOrUnitRequired;
	}

	if (!values.street.trim()) {
		errors.street = signupValidationMessages.streetRequired;
	}

	if (!values.barangay.trim()) {
		errors.barangay = signupValidationMessages.barangayRequired;
	}

	if (!values.contactNumber.trim()) {
		errors.contactNumber = signupValidationMessages.contactRequired;
	} else if (!normalizePhilippineMobile(values.contactNumber)) {
		errors.contactNumber = signupValidationMessages.contactInvalid;
	}

	if (!isGoogleSignup) {
		if (!values.password) {
			errors.password = signupValidationMessages.passwordRequired;
		} else if (values.password.length < 8) {
			errors.password = signupValidationMessages.passwordMinLength;
		}

		if (!values.confirmPassword) {
			errors.confirmPassword = signupValidationMessages.confirmPasswordRequired;
		} else if (values.confirmPassword !== values.password) {
			errors.confirmPassword = signupValidationMessages.confirmPasswordMismatch;
		}
	}

	return errors;
}

function getStepErrors(allErrors: SignupFormErrors, stepIndex: number) {
	const stepErrors: SignupFormErrors = {};

	signupStepFields[stepIndex].forEach((field) => {
		if (allErrors[field]) {
			stepErrors[field] = allErrors[field];
		}
	});

	return stepErrors;
}

function findFirstErrorStep(allErrors: SignupFormErrors) {
	return signupStepFields.findIndex((stepFields) =>
		stepFields.some((field) => Boolean(allErrors[field])),
	);
}

export default function SignupPage() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const [formValues, setFormValues] = useState<SignupFormValues>(initialSignupFormValues);
	const [formErrors, setFormErrors] = useState<SignupFormErrors>({});
	const [successMessage, setSuccessMessage] = useState("");
	const [googleAuthData, setGoogleAuthData] = useState<{
		credential: string;
		email: string;
		name: string;
		picture?: string;
	} | null>(null);
	const { signup, isSubmitting, apiError, clearApiError } = useSignup();

	const isLastStep = activeStep === signupSteps.length - 1;
	const stepNumberLabel = `${signupPageCopy.stepLabelPrefix} ${activeStep + 1} ${signupPageCopy.stepLabelConnector} ${signupSteps.length}`;

	const formattedAddress = useMemo(
		() => buildSignupFormattedAddress(formValues),
		[formValues.barangay, formValues.houseOrUnit, formValues.street],
	);

	const handleFieldChange = (field: SignupFieldKey, value: string) => {
		const nextValue = field === "contactNumber" ? limitPhilippineMobileInput(value) : value;

		setFormValues((previous) => ({
			...previous,
			[field]: nextValue,
		}));

		if (formErrors[field]) {
			setFormErrors((previous) => ({
				...previous,
				[field]: undefined,
			}));
		}

		if (successMessage) {
			setSuccessMessage("");
		}

		if (apiError) {
			clearApiError();
		}
	};

	const handleNextStep = () => {
		const allErrors = validateSignupForm(formValues, Boolean(googleAuthData));
		const currentStepErrors = getStepErrors(allErrors, activeStep);

		if (Object.keys(currentStepErrors).length > 0) {
			setFormErrors((previous) => ({
				...previous,
				...currentStepErrors,
			}));
			setSuccessMessage("");
			return;
		}

		setActiveStep((previous) => Math.min(previous + 1, signupSteps.length - 1));
		setSuccessMessage("");
	};

	const handleBackStep = () => {
		setActiveStep((previous) => Math.max(previous - 1, 0));
		setSuccessMessage("");
		if (apiError) {
			clearApiError();
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const allErrors = validateSignupForm(formValues, Boolean(googleAuthData));

		if (Object.keys(allErrors).length > 0) {
			setFormErrors(allErrors);
			setSuccessMessage("");
			const firstErrorStep = findFirstErrorStep(allErrors);
			if (firstErrorStep >= 0) {
				setActiveStep(firstErrorStep);
			}
			return;
		}

		const normalizedMobile = normalizePhilippineMobile(formValues.contactNumber);
		const submitValues: SignupFormValues = {
			...formValues,
			contactNumber: normalizedMobile ?? formValues.contactNumber,
		};

		setFormErrors({});
		setFormValues((previous) => ({
			...previous,
			contactNumber: submitValues.contactNumber,
		}));

		if (googleAuthData) {
			// Google Signup Flow
			try {
				const response = await fetch("/api/auth/google", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						credential: googleAuthData.credential,
						address: buildSignupFormattedAddress(submitValues),
						contactNo: submitValues.contactNumber,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Google registration failed.");
				}

				router.replace(data.user.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
				return;
			} catch (error: any) {
				console.error("Google registration error:", error);
				// Set API error manually since we're not using the hook for Google auth
				return;
			}
		}

		const result = await signup(submitValues);

		if (result.ok) {
			router.replace("/auth/login");
			return;
		}

		setSuccessMessage("");
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

			if (!data.userExists) {
				// New user - populate form and proceed
				const { email, name, picture, credential } = data.googleProfile;
				setGoogleAuthData({ credential, email, name, picture });
				setFormValues((prev) => ({
					...prev,
					email,
					nameOrUsername: name,
				}));
				// Auto-advance is optional, but let's stay on Step 0 so they can enter contact number
				return;
			}

			router.replace(data.user.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
		} catch (error: any) {
			console.error("Google signup error:", error);
		}
	};

	const renderStepFields = () => {
		if (activeStep === 0) {
			return (
				<Stack spacing={1.4}>
					<TextField
						fullWidth
						required
						label={signupFormLabels.nameOrUsername}
						size="small"
						value={formValues.nameOrUsername}
						onChange={(event) => handleFieldChange("nameOrUsername", event.target.value)}
						error={Boolean(formErrors.nameOrUsername)}
						helperText={formErrors.nameOrUsername}
						disabled={Boolean(googleAuthData)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<PersonOutline fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					<TextField
						fullWidth
						required
						label={signupFormLabels.email}
						type="email"
						size="small"
						value={formValues.email}
						onChange={(event) => handleFieldChange("email", event.target.value)}
						error={Boolean(formErrors.email)}
						helperText={formErrors.email ?? signupFieldHints.email}
						disabled={Boolean(googleAuthData)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<EmailOutlined fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					<TextField
						fullWidth
						required
						label={signupFormLabels.contactNumber}
						size="small"
						value={formValues.contactNumber}
						onChange={(event) => handleFieldChange("contactNumber", event.target.value)}
						error={Boolean(formErrors.contactNumber)}
						helperText={formErrors.contactNumber ?? signupFieldHints.contactNumber}
						InputProps={{
							inputProps: {
								maxLength: 11,
								inputMode: "numeric",
							},
							startAdornment: (
								<InputAdornment position="start">
									<PhoneOutlined fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
						We use your contact number to coordinate pickup, delivery, and order updates. {" "}
						<Typography component={Link} href="/privacy" variant="caption" sx={{ fontWeight: 700, textDecoration: "none" }}>
							Read our Privacy Policy
						</Typography>
						.
					</Typography>

					{!googleAuthData && (
						<Stack alignItems="center" spacing={1} sx={{ pt: 1 }}>
							<Typography variant="caption" color="text.secondary">
								{signupPageCopy.orLabel}
							</Typography>
							<GoogleLogin
								onSuccess={handleGoogleSuccess}
								onError={() => {
									console.error("Google Login Failed");
								}}
								useOneTap
								shape="pill"
								theme="filled_blue"
								text="continue_with"
								width="240"
							/>
						</Stack>
					)}
				</Stack>
			);
		}

		if (activeStep === 1) {
			return (
				<Stack spacing={1.2}>
					<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
						We use your address details to route pickup and delivery operations. {" "}
						<Typography component={Link} href="/privacy" variant="caption" sx={{ fontWeight: 700, textDecoration: "none" }}>
							Read our Privacy Policy
						</Typography>
						.
					</Typography>

					<TextField
						fullWidth
						required
						label={signupFormLabels.houseOrUnit}
						size="small"
						value={formValues.houseOrUnit}
						onChange={(event) => handleFieldChange("houseOrUnit", event.target.value)}
						error={Boolean(formErrors.houseOrUnit)}
						helperText={formErrors.houseOrUnit}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<HomeOutlined fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					<TextField
						fullWidth
						required
						label={signupFormLabels.street}
						size="small"
						value={formValues.street}
						onChange={(event) => handleFieldChange("street", event.target.value)}
						error={Boolean(formErrors.street)}
						helperText={formErrors.street}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<LocationOnOutlined fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					<TextField
						select
						fullWidth
						required
						label={signupFormLabels.barangay}
						size="small"
						value={formValues.barangay}
						onChange={(event) => handleFieldChange("barangay", event.target.value)}
						error={Boolean(formErrors.barangay)}
						helperText={formErrors.barangay ?? signupFieldHints.barangay}
					>
						{olongapoBarangays.map((barangay) => (
							<MenuItem key={barangay} value={barangay}>
								{barangay}
							</MenuItem>
						))}
					</TextField>

					<TextField
						fullWidth
						label={signupFormLabels.landmark}
						size="small"
						value={formValues.landmark}
						onChange={(event) => handleFieldChange("landmark", event.target.value)}
					/>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
						<TextField
							fullWidth
							label={signupFormLabels.city}
							size="small"
							value={signupReadonlyAddress.city}
							InputProps={{
								readOnly: true,
								startAdornment: (
									<InputAdornment position="start">
										<LocationCityOutlined fontSize="small" />
									</InputAdornment>
								),
							}}
						/>
							<TextField fullWidth label={signupFormLabels.province} size="small" value={signupReadonlyAddress.province} InputProps={{ readOnly: true }} />
					</Stack>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
							<TextField fullWidth label={signupFormLabels.country} size="small" value={signupReadonlyAddress.country} InputProps={{ readOnly: true }} />
							<TextField fullWidth label={signupFormLabels.postalCode} size="small" value={signupReadonlyAddress.postalCode} InputProps={{ readOnly: true }} />
					</Stack>

					{formattedAddress && (
						<Typography variant="caption" sx={{ color: "text.secondary" }}>
								{signupPageCopy.addressPreviewPrefix} {formattedAddress}
						</Typography>
					)}
				</Stack>
			);
		}

		if (googleAuthData) {
			return (
				<Box sx={{ py: 4, textAlign: "center" }}>
					<Typography variant="body1" sx={{ mb: 2 }}>
						You are signing up with <strong>{googleAuthData.email}</strong>.
					</Typography>
					<Typography variant="body2" color="text.secondary">
						No password is required. Click the button below to complete your registration.
					</Typography>
				</Box>
			);
		}

		return (
			<Stack spacing={1.4}>
				<TextField
					fullWidth
					required
					label={signupFormLabels.password}
					type={showPassword ? "text" : "password"}
					size="small"
					value={formValues.password}
					onChange={(event) => handleFieldChange("password", event.target.value)}
					error={Boolean(formErrors.password)}
					helperText={formErrors.password ?? signupFieldHints.password}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<LockOutlined fontSize="small" />
							</InputAdornment>
						),
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									edge="end"
									onClick={() => setShowPassword((previous) => !previous)}
									aria-label="toggle password visibility"
								>
									{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
								</IconButton>
							</InputAdornment>
						),
					}}
				/>

				<TextField
					fullWidth
					required
					label={signupFormLabels.confirmPassword}
					type={showConfirmPassword ? "text" : "password"}
					size="small"
					value={formValues.confirmPassword}
					onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
					error={Boolean(formErrors.confirmPassword)}
					helperText={formErrors.confirmPassword}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<LockOutlined fontSize="small" />
							</InputAdornment>
						),
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									edge="end"
									onClick={() => setShowConfirmPassword((previous) => !previous)}
									aria-label="toggle confirm password visibility"
								>
									{showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
			</Stack>
		);
	};

	return (
		<AuthLayoutWrapper maxWidth={720}>
			<Box sx={{ px: { xs: 2, sm: 6 }, py: { xs: 3, sm: 5 } }}>
				<Typography variant="h4" sx={{ fontWeight: 800, textAlign: "center", mb: 0.8, background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
					{signupPageCopy.title}
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4, fontWeight: 500 }}>
					{signupPageCopy.subtitle}
				</Typography>

				<Box component="form" onSubmit={handleSubmit} noValidate>
					<Stack spacing={3}>
						<Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 2, mt: 1 }}>
							{signupSteps.map((step, idx) => (
								<Box 
									key={step.id} 
									sx={{ 
										width: activeStep === idx ? 32 : 10, 
										height: 6, 
										borderRadius: 3, 
										bgcolor: (theme) => activeStep === idx ? theme.palette.primary.main : (activeStep > idx ? theme.palette.primary.light : alpha(theme.palette.primary.main, 0.3)),
										transition: "all 0.3s ease" 
									}} 
								/>
							))}
						</Stack>

						<Box component="form" onSubmit={handleSubmit} noValidate>
							<Stack spacing={2}>
								<Stack spacing={0.3} alignItems="center">
									<Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1.1 }}>
										{stepNumberLabel}
									</Typography>
									<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
										{signupSteps[activeStep].title}
									</Typography>
									<Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center" }}>
										{signupSteps[activeStep].helper}
									</Typography>
								</Stack>

								<Stepper activeStep={activeStep} alternativeLabel sx={{ px: { xs: 0, sm: 1 } }}>
									{signupSteps.map((step) => (
										<Step key={step.id}>
											<StepLabel>{step.title}</StepLabel>
										</Step>
									))}
								</Stepper>

								{renderStepFields()}

								{apiError && <Alert severity="error">{apiError}</Alert>}
								{successMessage && <Alert severity="success">{successMessage}</Alert>}

								<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
									<Button type="button" color="inherit" onClick={handleBackStep} disabled={activeStep === 0 || isSubmitting}>
										{signupPageCopy.backLabel}
									</Button>

									{isLastStep ? (
										<Button type="submit" variant="contained" size="large" sx={{ px: 4, borderRadius: 1.2 }} disabled={isSubmitting}>
											{isSubmitting ? signupPageCopy.submitLoadingLabel : signupPageCopy.submitLabel}
										</Button>
									) : (
										<Button type="button" variant="contained" size="large" sx={{ px: 4, borderRadius: 1.2 }} onClick={handleNextStep}>
											{signupPageCopy.continueLabel}
										</Button>
									)}
								</Stack>

								{isLastStep && (
									<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
										By signing up, you agree to our {" "}
										<Typography component={Link} href="/terms" variant="caption" sx={{ fontWeight: 700, textDecoration: "none" }}>
											Terms and Conditions
										</Typography>
										{" "}and acknowledge our {" "}
										<Typography component={Link} href="/privacy" variant="caption" sx={{ fontWeight: 700, textDecoration: "none" }}>
											Privacy Policy
										</Typography>
										.
									</Typography>
								)}

								{isLastStep && isSubmitting && (
									<Typography variant="caption" sx={{ color: "text.secondary", textAlign: "right" }}>
										{signupPageCopy.submitLoadingStatus}
									</Typography>
								)}

								{isLastStep && !googleAuthData && (
									<Stack alignItems="center" spacing={1.2} sx={{ pt: 0.6 }}>
										<GoogleLogin
											onSuccess={handleGoogleSuccess}
											onError={() => {
												console.error("Google Login Failed");
											}}
											useOneTap
											shape="pill"
											theme="filled_blue"
											text="continue_with"
											width="240"
										/>
									</Stack>
								)}
							</Stack>
						</Box>

						{apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}
						{successMessage && <Alert severity="success" sx={{ borderRadius: 2 }}>{successMessage}</Alert>}

						<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ pt: 2 }}>
							<Button 
								type="button"
								variant="text"
								onClick={handleBackStep} 
								disabled={activeStep === 0 || isSubmitting}
								sx={{ 
									fontWeight: 600, 
									color: "primary.main",
									"&:hover": { color: "primary.dark", background: "rgba(0,0,0,0.05)" }
								}}
							>
								{signupPageCopy.backLabel}
							</Button>

							{isLastStep ? (
								<Button type="submit" variant="contained" size="large" sx={{ px: 5 }} disabled={isSubmitting}>
									{isSubmitting ? signupPageCopy.submitLoadingLabel : signupPageCopy.submitLabel}
								</Button>
							) : (
								<Button type="button" variant="contained" size="large" sx={{ px: 5 }} onClick={handleNextStep}>
									{signupPageCopy.continueLabel}
								</Button>
							)}
						</Stack>

						{isLastStep && isSubmitting && (
							<Typography variant="caption" sx={{ color: "text.secondary", textAlign: "right" }}>
								{signupPageCopy.submitLoadingStatus}
							</Typography>
						)}

						{isLastStep && !googleAuthData && (
							<Stack alignItems="center" spacing={1.2} sx={{ pt: 1 }}>
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
						)}
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
					{signupPageCopy.hasAccountPrompt}{" "}
					<Typography
						component={Link}
						href="/auth/login"
						variant="body2"
						sx={{ 
							fontWeight: 800, 
							color: "#11998e", 
							textDecoration: "none",
							transition: "color 0.2s",
							"&:hover": { color: "#0d7a71" }
						}}
					>
						{signupPageCopy.loginLabel}
					</Typography>
					.
				</Typography>
			</Box>
		</AuthLayoutWrapper>
	);
}
