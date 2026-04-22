import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodb", () => ({ dbConnect: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/models/User", () => ({
  User: { findByIdAndUpdate: vi.fn() },
}));
vi.mock("@/lib/delete-user-data", () => ({
  deleteUserData: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import { User } from "@/lib/models/User";
import { deleteUserData } from "@/lib/delete-user-data";
import { PATCH, DELETE } from "@/app/api/admin/users/[id]/route";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (method: string, body?: object) =>
  new NextRequest("http://localhost/api/admin/users/target-user-id", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const makeParams = (id: string) =>
  ({ params: Promise.resolve({ id }) } as { params: Promise<{ id: string }> });

const adminSession = {
  user: { id: "admin-id", email: "admin@example.com", role: "admin" as const },
  expires: "2099-01-01",
};

// ── PATCH tests ───────────────────────────────────────────────────────────────
describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(adminSession);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await PATCH(makeReq("PATCH", { role: "user" }), makeParams("target-user-id"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not an admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-id", email: "user@example.com", role: "user" as const },
      expires: "2099-01-01",
    });

    const res = await PATCH(makeReq("PATCH", { role: "user" }), makeParams("target-user-id"));
    expect(res.status).toBe(403);
  });

  it("returns 400 for an invalid role value", async () => {
    const res = await PATCH(makeReq("PATCH", { role: "superuser" }), makeParams("target-user-id"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid role");
  });

  it("returns 400 when an admin tries to demote themselves", async () => {
    const res = await PATCH(makeReq("PATCH", { role: "user" }), makeParams("admin-id"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("own admin role");
  });

  it("returns 404 when the target user is not found", async () => {
    vi.mocked(User.findByIdAndUpdate).mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as any);

    const res = await PATCH(makeReq("PATCH", { role: "user" }), makeParams("nonexistent-id"));
    expect(res.status).toBe(404);
  });

  it("updates the role and returns the updated user on success", async () => {
    const updatedUser = { _id: "target-id", name: "Alice", email: "alice@example.com", role: "admin" };
    vi.mocked(User.findByIdAndUpdate).mockReturnValue({
      select: vi.fn().mockResolvedValue(updatedUser),
    } as any);

    const res = await PATCH(makeReq("PATCH", { role: "admin" }), makeParams("target-user-id"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("admin");
  });

  it("an admin can promote another user to admin without error", async () => {
    const updatedUser = { _id: "other-id", name: "Bob", email: "bob@example.com", role: "admin" };
    vi.mocked(User.findByIdAndUpdate).mockReturnValue({
      select: vi.fn().mockResolvedValue(updatedUser),
    } as any);

    const res = await PATCH(makeReq("PATCH", { role: "admin" }), makeParams("other-id"));
    expect(res.status).toBe(200);
  });
});

// ── DELETE tests ──────────────────────────────────────────────────────────────
describe("DELETE /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(adminSession);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await DELETE(makeReq("DELETE"), makeParams("target-user-id"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not an admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-id", email: "user@example.com", role: "user" as const },
      expires: "2099-01-01",
    });

    const res = await DELETE(makeReq("DELETE"), makeParams("target-user-id"));
    expect(res.status).toBe(403);
  });

  it("returns 400 when an admin tries to delete their own account", async () => {
    const res = await DELETE(makeReq("DELETE"), makeParams("admin-id"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("own account");
  });

  it("returns 404 when deleteUserData throws 'User not found'", async () => {
    vi.mocked(deleteUserData).mockRejectedValue(new Error("User not found"));

    const res = await DELETE(makeReq("DELETE"), makeParams("nonexistent-id"));
    expect(res.status).toBe(404);
  });

  it("returns 500 for unexpected errors from deleteUserData", async () => {
    vi.mocked(deleteUserData).mockRejectedValue(new Error("DB connection lost"));

    const res = await DELETE(makeReq("DELETE"), makeParams("target-user-id"));
    expect(res.status).toBe(500);
  });

  it("calls deleteUserData with the target user ID and returns success + counts", async () => {
    vi.mocked(deleteUserData).mockResolvedValue({
      email: "alice@example.com",
      deleted: { factories: 3, productionLines: 12, locations: 2, imports: 5, otps: 1 },
    });

    const res = await DELETE(makeReq("DELETE"), makeParams("target-user-id"));
    expect(res.status).toBe(200);
    expect(deleteUserData).toHaveBeenCalledWith("target-user-id");

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted.factories).toBe(3);
    expect(body.email).toBe("alice@example.com");
  });
});
