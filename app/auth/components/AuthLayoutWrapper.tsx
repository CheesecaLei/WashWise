"use client";

import React from "react";
import Link from "next/link";
import { Box, Paper, Stack, Typography, keyframes, ThemeProvider, createTheme, useTheme } from "@mui/material";
import { authFooterBrandText, authFooterLinks } from "../../data/auth";





const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatReverse = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(20px) rotate(-5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

export default function AuthLayoutWrapper({ children, maxWidth = 520 }: { children: React.ReactNode; maxWidth?: number | { xs: number, sm: number } }) {
	const parentTheme = useTheme();
	
	const mergedTheme = React.useMemo(() => {
		const primaryMain = parentTheme.palette.primary.main;
		const primaryLight = parentTheme.palette.primary.light;
		
		const authThemeOverrides = createTheme({
			components: {
				MuiTextField: {
					styleOverrides: {
						root: {
							"& .MuiOutlinedInput-root": {
								borderRadius: 8,
								transition: "all 0.3s ease",
								background: "rgba(255,255,255,0.6)",
								"&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
								"&.Mui-focused": { 
									boxShadow: `0 4px 20px ${primaryLight}40`, 
									background: "#fff" 
								}
							}
						}
					}
				},
				MuiButton: {
					styleOverrides: {
						contained: {
							borderRadius: 20,
							fontWeight: 700,
							textTransform: "none",
							fontSize: "1.1rem",
							background: `linear-gradient(45deg, ${primaryMain} 0%, ${primaryLight} 100%)`,
							backgroundSize: "200% auto",
							transition: "all 0.4s ease",
							boxShadow: `0 4px 14px ${primaryMain}40`,
							color: "#ffffff",
							"&:hover": { 
								backgroundPosition: "right center",
								transform: "translateY(-2px)",
								boxShadow: `0 10px 20px ${primaryMain}60` 
							},
							"&:disabled": {
								background: "#e0e0e0",
								color: "#9e9e9e",
								boxShadow: "none",
							}
						}
					}
				}
			}
		});
		
		return createTheme(parentTheme, authThemeOverrides);
	}, [parentTheme]);

	return (
		<ThemeProvider theme={mergedTheme}>
			<Box
			sx={{
				minHeight: "100dvh",
				display: "flex",
				flexDirection: "column",
				position: "relative",
				overflow: "hidden",
				background: "linear-gradient(180deg, #71dfde 0%, #6fa5f4 100%)",
			}}
		>
			{/* Animated Orbs */}
			<Box
				sx={{
					position: "absolute",
					top: "-10%",
					left: "-10%",
					width: "50vw",
					height: "50vw",
					borderRadius: "50%",
					background: "radial-gradient(circle, rgba(142,45,226,0.3) 0%, rgba(255,255,255,0) 70%)",
					filter: "blur(40px)",
					animation: `${float} 10s ease-in-out infinite`,
					zIndex: 0,
				}}
			/>
			<Box
				sx={{
					position: "absolute",
					bottom: "-10%",
					right: "-10%",
					width: "40vw",
					height: "40vw",
					borderRadius: "50%",
					background: "radial-gradient(circle, rgba(56,239,125,0.3) 0%, rgba(255,255,255,0) 70%)",
					filter: "blur(40px)",
					animation: `${floatReverse} 12s ease-in-out infinite`,
					zIndex: 0,
				}}
			/>

			<Box
				component="main"
				sx={{
					flex: 1,
					px: { xs: 2, sm: 3 },
					py: { xs: 4, sm: 6, md: 8 },
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					zIndex: 1,
				}}
			>
				<Paper
					elevation={0}
					sx={{
						width: "100%",
						maxWidth: maxWidth,
						borderRadius: 4,
						overflow: "hidden",
						background: "rgba(255, 255, 255, 0.85)",
						backdropFilter: "blur(16px)",
						WebkitBackdropFilter: "blur(16px)",
						border: "1px solid rgba(255, 255, 255, 0.5)",
						boxShadow: "0 24px 64px rgba(0, 0, 0, 0.15)",
					}}
				>
					{children}
				</Paper>
			</Box>

			<Box
				component="footer"
				sx={{
					borderTop: "1px solid rgba(255, 255, 255, 0.2)",
					px: { xs: 2, md: 4 },
					py: 2,
					background: "rgba(255, 255, 255, 0.1)",
					backdropFilter: "blur(8px)",
					position: "relative",
					zIndex: 1,
				}}
			>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					alignItems={{ xs: "flex-start", sm: "center" }}
					justifyContent="space-between"
					spacing={1}
				>
					<Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>
						{authFooterBrandText}
					</Typography>
					<Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
						{authFooterLinks.map((link) => (
							<Typography
								key={link.id}
								component={Link}
								href={link.href}
								variant="caption"
								sx={{
									color: "rgba(255, 255, 255, 0.7)",
									textDecoration: "none",
									transition: "color 0.2s ease",
									"&:hover": { color: "rgba(255, 255, 255, 1)" },
								}}
							>
								{link.label}
							</Typography>
						))}
					</Stack>
				</Stack>
			</Box>
		</Box>
		</ThemeProvider>
	);
}
