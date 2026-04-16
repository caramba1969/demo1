import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/mongodb", () => ({ dbConnect: vi.fn().mockResolvedValue(undefined) }));
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));
vi.mock("@/lib/email", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/models/User", () => ({
  User: { findOne: vi.fn() },
}));
vi.mock("@/lib/models/Otp", () => ({
  Otp: { deleteMany: vi.fn().mockResolvedValue(undefined), create: vi.fn().mockResolvedValue(undefined) },
}));

import bcrypt from "bcryptjs";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendOtpEmail } from "@/lib/email";
import { POST } from "@/app/api/auth/send-otp/route";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (body: object) =>
  new NextRequest("http://localhost/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const verifiedUser = {
  _id: "user-id",
  email: "user@example.com",
  passwordHash: "hashed",
  emailVerified: new Date("2024-01-01"),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/auth/send-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Otp.deleteMany).mockResolvedValue(undefined as any);
    vi.mocked(Otp.create).mockResolvedValue(undefined as any);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ password: "password123" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeReq({ email: "user@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when user does not exist", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await POST(makeReq({ email: "ghost@example.com", password: "password123" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid email or password");
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(verifiedUser),
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await POST(makeReq({ email: "user@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user email is not verified", async () => {
    const unverifiedUser = { ...verifiedUser, emailVerified: null };
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(unverifiedUser),
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await POST(makeReq({ email: "user@example.com", password: "password123" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("verify your email");
  });

  it("clears existing login OTPs and creates a new one on success", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(verifiedUser),
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await POST(makeReq({ email: "user@example.com", password: "password123" }));

    expect(res.status).toBe(200);
    expect(Otp.deleteMany).toHaveBeenCalledWith({
      email: "user@example.com",
      type: "login",
    });
    expect(Otp.create).toHaveBeenCalledOnce();
    const [otpData] = vi.mocked(Otp.create).mock.calls[0];
    expect((otpData as any).type).toBe("login");
    expect((otpData as any).email).toBe("user@example.com");
  });

  it("sends the OTP email and returns { sent: true }", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(verifiedUser),
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await POST(makeReq({ email: "user@example.com", password: "password123" }));
    const body = await res.json();

    expect(sendOtpEmail).toHaveBeenCalledOnce();
    expect(body.sent).toBe(true);
  });

  it("returns 500 when the OTP email fails to send", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(verifiedUser),
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(sendOtpEmail).mockRejectedValue(new Error("SMTP error"));

    const res = await POST(makeReq({ email: "user@example.com", password: "password123" }));
    expect(res.status).toBe(500);
  });
});
