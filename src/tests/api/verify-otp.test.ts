import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/mongodb", () => ({ dbConnect: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/models/Otp", () => ({
  Otp: { findOne: vi.fn(), deleteOne: vi.fn().mockResolvedValue(undefined), create: vi.fn().mockResolvedValue(undefined) },
}));

import { Otp } from "@/lib/models/Otp";
import { POST } from "@/app/api/auth/verify-otp/route";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (body: object) =>
  new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const validOtp = {
  _id: "otp-id",
  email: "user@example.com",
  code: "123456",
  type: "login",
  expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min from now
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/auth/verify-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Otp.deleteOne).mockResolvedValue(undefined as any);
    vi.mocked(Otp.create).mockResolvedValue(undefined as any);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ code: "123456" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("required");
  });

  it("returns 400 when code is missing", async () => {
    const res = await POST(makeReq({ email: "user@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when no matching OTP is found", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(null);

    const res = await POST(makeReq({ email: "user@example.com", code: "999999" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired");
  });

  it("returns 401 when the OTP code does not match", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    const res = await POST(makeReq({ email: "user@example.com", code: "000000" }));
    expect(res.status).toBe(401);
  });

  it("deletes the OTP after successful verification (single-use)", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    await POST(makeReq({ email: "user@example.com", code: "123456" }));

    expect(Otp.deleteOne).toHaveBeenCalledWith({ _id: "otp-id" });
  });

  it("creates a short-lived verified token and returns it on success", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    const res = await POST(makeReq({ email: "user@example.com", code: "123456" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.verifiedToken).toBe("string");
    expect(body.verifiedToken.length).toBeGreaterThan(0);
  });

  it("stores the verified token in the OTP collection with a 2-minute expiry", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    const before = Date.now();
    await POST(makeReq({ email: "user@example.com", code: "123456" }));
    const after = Date.now();

    expect(Otp.create).toHaveBeenCalledOnce();
    const [tokenData] = vi.mocked(Otp.create).mock.calls[0];
    const expiresAt = (tokenData as any).expiresAt as Date;
    const expectedExpiry = before + 2 * 60 * 1000;

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 100);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 2 * 60 * 1000 + 100);
  });

  it("trims whitespace from the submitted code before comparing", async () => {
    vi.mocked(Otp.findOne).mockResolvedValue(validOtp as any);

    const res = await POST(makeReq({ email: "user@example.com", code: "  123456  " }));
    expect(res.status).toBe(200);
  });
});
