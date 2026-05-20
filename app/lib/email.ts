/**
 * WashWise Transactional Email Client utilizing Brevo API
 */

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    const apiKey = process.env.BREVO_API_KEY;
    // You must verify this email address in your Brevo account
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "your_verified_email@example.com";

    if (!apiKey) {
        console.warn("[Email] BREVO_API_KEY is not defined. Email transmission bypassed.");
        return { success: false, error: "BREVO_API_KEY not configured" };
    }

    try {
        console.log(`[Email] Dispatching email to: ${to} | Subject: ${subject}`);
        
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "api-key": apiKey,
            },
            body: JSON.stringify({
                sender: {
                    name: "WashWise",
                    email: senderEmail,
                },
                to: [
                    { email: to }
                ],
                subject: subject,
                htmlContent: html,
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("[Email] Brevo API responded with error:", data);
            return { success: false, error: data };
        }

        console.log("[Email] Email successfully dispatched via Brevo:", data);
        return { success: true, messageId: data.messageId };
    } catch (error) {
        console.error("[Email] Exception caught during email transmission:", error);
        return { success: false, error };
    }
}
