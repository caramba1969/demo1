import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/mongodb", () => ({ dbConnect: vi.fn().mockResolvedValue(undefined) }));
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn(),
  },
}));
vi.mock("@/lib/email", () => ({
  sendVerifyEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/models/User", () => ({
  User: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock("@/lib/models/Otp", () => ({
  Otp: { create: vi.fn() },
}));

import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendVerifyEmail } from "@/lib/email";
import { POST } from "@/app/api/auth/register/route";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (body: object) =>
  new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(User.findOne).mockResolvedValue(null); // no existing user by default
    vi.mocked(User.create).mockResolvedValue({
      _id: { toString: () => "new-user-id" },
      email: "new@example.com",
      name: "new",
    } as any);
    vi.mocked(Otp.create).mockResolvedValue(null as any);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ password: "password123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Email and password");
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeReq({ email: "user@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email format", async () => {
    const res = await POST(makeReq({ email: "not-an-email", password: "password123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid email");
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const res = await POST(makeReq({ email: "user@example.com", password: "short" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("8 characters");
  });

  it("returns 201 without revealing whether the email already exists (anti-enumeration)", async () => {
    vi.mocked(User.findOne).mockResolvedValue({ email: "existing@example.com" } as any);

    const res = await POST(makeReq({ email: "existing@example.com", password: "password123" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toContain("verification");
    // User.create must NOT have been called
    expect(User.create).not.toHaveBeenCalled();
  });

  it("creates a user and OTP record for a new email, returns 201", async () => {
    const res = await POST(
      makeReq({ email: "New@Example.COM", password: "securePass1", name: "Alice" })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toContain("verify");
    expect(User.create).toHaveBeenCalledOnce();
    expect(Otp.create).toHaveBeenCalledOnce();
  });

  it("normalises the email to lowercase before storing", async () => {
    await POST(makeReq({ email: "UPPER@Example.COM", password: "password123" }));

    const [createArgs] = vi.mocked(User.create).mock.calls[0];
    expect((createArgs as any).email).toBe("upper@example.com");
  });

  it("still returns 201 even when the verification email send fails", async () => {
    vi.mocked(sendVerifyEmail).mockRejectedValue(new Error("SMTP down"));

    const res = await POST(makeReq({ email: "new2@example.com", password: "password123" }));
    expect(res.status).toBe(201);
  });

  it("sends a verification email after creating the user", async () => {
    await POST(makeReq({ email: "new3@example.com", password: "password123" }));
    expect(sendVerifyEmail).toHaveBeenCalledOnce();
  });
});
