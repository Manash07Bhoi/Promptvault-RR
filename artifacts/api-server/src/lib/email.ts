import { logger } from "../utils/logger.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "PromptVault <noreply@promptvault.app>";
const APP_URL = process.env.APP_URL || "https://promptvault--roshan07jp.replit.app";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logger.warn({ to: payload.to, subject: payload.subject }, "RESEND_API_KEY not set — email logged only (dev mode)");
    logger.info({ to: payload.to, subject: payload.subject, body: payload.text || "(HTML only)" }, "[EMAIL DEV] Would send email");
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ to: payload.to, status: response.status, err }, "Email send failed");
      return false;
    }

    logger.info({ to: payload.to, subject: payload.subject }, "Email sent successfully");
    return true;
  } catch (err) {
    logger.error({ to: payload.to, err }, "Email send threw an exception");
    return false;
  }
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PromptVault</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:520px;background:#13131f;border-radius:16px;border:1px solid #2a2a3e;overflow:hidden;">
  <tr>
    <td style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:28px 36px;">
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
        Prompt<span style="color:#a78bfa;">Vault</span>
      </h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">AI Prompt Marketplace</p>
    </td>
  </tr>
  <tr>
    <td style="padding:36px;">
      ${content}
    </td>
  </tr>
  <tr>
    <td style="padding:20px 36px;border-top:1px solid #2a2a3e;text-align:center;">
      <p style="margin:0;font-size:12px;color:#555577;">
        © ${new Date().getFullYear()} PromptVault. All rights reserved.<br/>
        <a href="${APP_URL}" style="color:#6d28d9;text-decoration:none;">Visit PromptVault</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(to: string, displayName: string, token: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f1f8;">Reset Your Password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#8888aa;line-height:1.6;">
      Hi ${displayName}, we received a request to reset your PromptVault password. Click the button below to choose a new password.
    </p>
    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
      Reset Password
    </a>
    <p style="margin:0 0 8px;font-size:13px;color:#555577;line-height:1.6;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:#6d28d9;word-break:break-all;">${resetUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#555577;padding:12px;background:#0a0a0f;border-radius:8px;">
      ⚠️ This link expires in <strong style="color:#f1f1f8;">1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>
  `);

  return sendEmail({
    to,
    subject: "Reset your PromptVault password",
    html,
    text: `Hi ${displayName},\n\nReset your PromptVault password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

export async function sendEmailVerificationEmail(to: string, displayName: string, token: string): Promise<boolean> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f1f8;">Verify Your Email</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#8888aa;line-height:1.6;">
      Hi ${displayName}, welcome to PromptVault! Please verify your email address to get full access to the marketplace.
    </p>
    <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
      Verify Email Address
    </a>
    <p style="margin:0;font-size:13px;color:#555577;line-height:1.6;">
      Or copy and paste this link:<br/>
      <a href="${verifyUrl}" style="color:#6d28d9;word-break:break-all;">${verifyUrl}</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: "Verify your PromptVault email address",
    html,
    text: `Hi ${displayName},\n\nVerify your email by visiting:\n${verifyUrl}`,
  });
}

export async function sendNewsletterWelcomeEmail(to: string): Promise<boolean> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f1f8;">You're In! 🎉</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#8888aa;line-height:1.6;">
      Thanks for subscribing to the PromptVault newsletter! You'll be the first to know about:
    </p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#8888aa;font-size:15px;line-height:2;">
      <li>New premium prompt packs added to the marketplace</li>
      <li>Exclusive discounts and early-access deals</li>
      <li>Tips & tricks to get the most from AI tools</li>
      <li>Creator spotlights and community highlights</li>
    </ul>
    <a href="${APP_URL}/explore" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">
      Explore Prompt Packs
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#555577;">
      You can unsubscribe at any time by replying "UNSUBSCRIBE" to this email.
    </p>
  `);

  return sendEmail({
    to,
    subject: "Welcome to PromptVault updates! 🚀",
    html,
    text: `Thanks for subscribing to PromptVault!\n\nVisit ${APP_URL}/explore to explore premium prompt packs.`,
  });
}
