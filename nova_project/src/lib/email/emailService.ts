import { Resend } from "resend";

export async function sendVerificationEmail(
  toEmail: string,
  displayName: string,
  code: string,
): Promise<void> {
  // In development (or when no API key is set), print the code to the terminal
  // so the flow can be tested without a real email provider.
  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log(`\n[DEV] Verification code for ${toEmail}: ${code}\n`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  const result = await resend.emails.send({
    from,
    to: toEmail,
    subject: "Verify your Niles Biological account",
    text: [
      `Hello ${displayName},`,
      "",
      "Thank you for creating an account with Niles Biological.",
      "Your email verification code is:",
      "",
      `  ${code}`,
      "",
      "This code expires in 15 minutes.",
      "",
      "If you did not create an account, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#047857;margin-bottom:8px;">Verify your email address</h2>
        <p>Hello <strong>${displayName}</strong>,</p>
        <p>Thank you for creating an account with Niles Biological. Enter the code below to activate your account.</p>
        <div style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <p style="margin:0 0 8px;color:#475569;font-size:0.85rem;">Your verification code</p>
          <p style="font-size:2.5rem;font-weight:bold;letter-spacing:0.3em;color:#047857;margin:0;">${code}</p>
        </div>
        <p style="color:#475569;font-size:0.9rem;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="color:#94a3b8;font-size:0.8rem;">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (result.error) {
    console.error("[emailService] Resend error:", result.error);
    throw new Error(
      `Failed to send verification email: ${result.error.message}`,
    );
  }
}
