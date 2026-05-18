"use client";

import Link from "next/link";
import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";

export default function TermsPage() {
  return (
    <Box sx={{ minHeight: "100dvh", height: { xs: "auto", md: "100dvh" }, display: "flex", bgcolor: "background.default", overflow: { xs: "visible", md: "hidden" } }}>
      <Sidebar isAdmin />

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
          <Container maxWidth="md" sx={{ py: { xs: 2, md: 3 } }}>
            <Stack spacing={2.2}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Terms and Conditions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effective Date: May 18, 2026
          </Typography>

          <Typography variant="body2" color="text.secondary">
            By creating an account or using Wash Wise services, you agree to these Terms and Conditions.
          </Typography>

          <Divider />

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Service Terms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Users must provide accurate contact and delivery details, follow order requirements, and settle payment obligations based on selected services and applicable fees.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Payment Status Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders may reflect one of the following payment states: unpaid, partially paid, paid, or refunded, depending on transaction activity and verified payment events.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Design Implementation Guide
          </Typography>
          <Stack spacing={0.8}>
            <Typography variant="body2" color="text.secondary">
              A. Onboarding and Sign-up: Registration includes dedicated links to these Terms and the Privacy Policy for clear consent before account creation.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              B. Point of Collection (Just-in-Time Notices): Sensitive-data input points include concise contextual notices with direct access to the Privacy Policy.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              C. Persistent Access: Terms and Privacy links are continuously available through footer navigation.
            </Typography>
          </Stack>

          <Divider />

          <Typography variant="caption" color="text.secondary">
            Review our <Link href="/admin/privacy" style={{ textDecoration: "none", fontWeight: 700 }}>Privacy Policy</Link> for data handling details and DPO contact information.
          </Typography>
            </Stack>
          </Container>
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}
