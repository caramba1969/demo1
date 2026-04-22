import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@satisfactory-planner.app";

export async function sendOtpEmail(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your sign-in code — Satisfactory Planner",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#f97316">Satisfactory Factory Planner</h2>
        <p>Your sign-in verification code is:</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.25em;color:#f97316;margin:16px 0">${code}</div>
        <p style="color:#6b7280">This code expires in <strong>5 minutes</strong>.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendVerifyEmail(email: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your email — Satisfactory Planner",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#f97316">Satisfactory Factory Planner</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${url}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Verify Email</a>
        <p style="color:#6b7280">This link expires in <strong>24 hours</strong>.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your password — Satisfactory Planner",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#f97316">Satisfactory Factory Planner</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <a href="${url}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Reset Password</a>
        <p style="color:#6b7280">This link expires in <strong>1 hour</strong>.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
