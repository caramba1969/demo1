import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted above const declarations — use vi.hoisted() so
// mockEmailSend is available when the Resend constructor mock is built.
const mockEmailSend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.emails = { send: mockEmailSend };
  }),
}));

import { sendOtpEmail, sendVerifyEmail } from "@/lib/email";

describe("sendOtpEmail()", () => {
  beforeEach(() => {
    mockEmailSend.mockReset();
    process.env.RESEND_FROM_EMAIL = "noreply@vanbeek.casa";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  });

  it("calls Resend with the correct recipient and subject", async () => {
    mockEmailSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendOtpEmail("user@example.com", "123456");

    expect(mockEmailSend).toHaveBeenCalledOnce();
    const [payload] = mockEmailSend.mock.calls[0];
    expect(payload.to).toBe("user@example.com");
    expect(payload.subject).toContain("sign-in code");
  });

  it("includes the OTP code in the email body", async () => {
    mockEmailSend.mockResolvedValue({ data: { id: "email-2" }, error: null });

    await sendOtpEmail("user@example.com", "654321");

    const [payload] = mockEmailSend.mock.calls[0];
    expect(payload.html).toContain("654321");
  });

  it("throws an Error when Resend returns an error", async () => {
    mockEmailSend.mockResolvedValue({
      data: null,
      error: { message: "Resend API error" },
    });

    await expect(sendOtpEmail("user@example.com", "000000")).rejects.toThrow(
      "Resend error: Resend API error"
    );
  });
});

describe("sendVerifyEmail()", () => {
  beforeEach(() => {
    mockEmailSend.mockReset();
    process.env.RESEND_FROM_EMAIL = "noreply@vanbeek.casa";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  });

  it("calls Resend with the correct recipient and subject", async () => {
    mockEmailSend.mockResolvedValue({ data: { id: "email-3" }, error: null });

    await sendVerifyEmail("new@example.com", "token-abc");

    expect(mockEmailSend).toHaveBeenCalledOnce();
    const [payload] = mockEmailSend.mock.calls[0];
    expect(payload.to).toBe("new@example.com");
    expect(payload.subject).toContain("Verify");
  });

  it("embeds the verification URL containing the token", async () => {
    mockEmailSend.mockResolvedValue({ data: { id: "email-4" }, error: null });

    await sendVerifyEmail("new@example.com", "my-secret-token");

    const [payload] = mockEmailSend.mock.calls[0];
    expect(payload.html).toContain("my-secret-token");
    expect(payload.html).toContain("/api/auth/verify-email");
  });

  it("throws an Error when Resend returns an error", async () => {
    mockEmailSend.mockResolvedValue({
      data: null,
      error: { message: "Domain not verified" },
    });

    await expect(
      sendVerifyEmail("new@example.com", "token")
    ).rejects.toThrow("Resend error: Domain not verified");
  });
});
