import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/mongodb", () => ({ dbConnect: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/models/Otp", () => ({
  Otp: {
    findOne: vi.fn(),
    deleteOne: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@/lib/models/User", () => ({
  User: { findOneAndUpdate: vi.fn().mockResolvedValue(undefined) },
}));

import { Otp } from "@/lib/models/Otp";
import { User } from "@/lib/models/User";
import { GET } from "@/app/api/auth/verify-email/route";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (token?: string) => {
  const url = token
    ? `http://localhost/api/auth/verify-email?token=${token}`
    : "http://localhost/api/auth/verify-email";
  return new NextRequest(url);
};

const validOtp = {
  _id: "otp-id",
  email: "new@example.com",
  code: "valid-token-abc",
  type: "verify-email",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("GET /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Otp.deleteOne).mockResolvedValue(undefined as any);
    vi.mocked(User.findOneAndUpdate).mockResolvedValue(undefined as any);
  });

  it("redirects to /auth/signin?error=missing-token when no token is provided", async () => {
    const res = await GET(makeReq());

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("error=missing-token");
  });

  it("redirects to /auth/signin?error=invalid-token when the token is not found", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(null);

    const res = await GET(makeReq("bad-token"));

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get("location")).toContain("error=invalid-token");
  });

  it("updates emailVerified on the user when token is valid", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    await GET(makeReq("valid-token-abc"));

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { email: "new@example.com" },
      expect.objectContaining({ emailVerified: expect.any(Date) })
    );
  });

  it("consumes the OTP after successful verification", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    await GET(makeReq("valid-token-abc"));

    expect(Otp.deleteOne).toHaveBeenCalledWith({ _id: "otp-id" });
  });

  it("redirects to /auth/signin?verified=1 on success", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    const res = await GET(makeReq("valid-token-abc"));

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get("location")).toContain("verified=1");
  });
});
