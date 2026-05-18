"use client";

import Link from "next/link";
import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";

export default function PrivacyPolicyPage() {
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
          <Container maxWidth="md" sx={{ py: { xs: 2, md: 3 } }}>
            <Stack spacing={2.2}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effective Date: May 18, 2026
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Wash Wise processes personal data in accordance with applicable privacy laws in the Philippines, including the Data Privacy Act of 2012.
            This policy explains what data we collect, why we collect it, how we use it, and where you can review your choices.
          </Typography>

          <Divider />

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Data We Collect
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We collect account details, contact number, address and delivery information, order activity, and payment records necessary to deliver laundry services.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Why We Collect Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We use your data to create your account, schedule pickup and delivery, process transactions, provide service updates, and maintain operations and security.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Design Implementation Guide
          </Typography>
          <Stack spacing={0.8}>
            <Typography variant="body2" color="text.secondary">
              A. Onboarding and Sign-up: We provide clear, individual links near account registration so users can review Terms and Conditions and this Privacy Policy before submission.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              B. Point of Collection (Just-in-Time Notices): When requesting sensitive or high-impact personal data such as location/address details, we display a short notice with a direct link to this policy.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              C. Persistent Access: Privacy Policy and Terms and Conditions remain available at all times through footer links across the web experience.
            </Typography>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Data Protection Officer (DPO) Contact
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Data Protection Officer, Wash Wise
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: dpo@washwise.ph
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +63 917 000 0000
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Address: Olongapo City, Zambales, Philippines
            </Typography>
          </Stack>

          <Divider />

          <Typography variant="caption" color="text.secondary">
            See also our <Link href="/member/terms" style={{ textDecoration: "none", fontWeight: 700 }}>Terms and Conditions</Link>.
          </Typography>
            </Stack>
          </Container>
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}
