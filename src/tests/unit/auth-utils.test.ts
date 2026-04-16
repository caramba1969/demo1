import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-auth and authOptions before importing requireAuth
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth/next";
import { requireAuth } from "@/lib/auth-utils";

const mockAdminSession = {
  user: { id: "admin-id", email: "admin@example.com", role: "admin" as const },
  expires: "2099-01-01",
};

const mockUserSession = {
  user: { id: "user-id", email: "user@example.com", role: "user" as const },
  expires: "2099-01-01",
};

describe("requireAuth()", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  it("returns 401 when no session exists", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { session, error } = await requireAuth();

    expect(session).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.status).toBe(401);
    const body = await error!.json();
    expect(body.error).toBe("Authentication required");
  });

  it("returns the session when authenticated with no role requirement", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockUserSession);

    const { session, error } = await requireAuth();

    expect(error).toBeNull();
    expect(session?.user.id).toBe("user-id");
  });

  it("returns 403 when a user role tries to access an admin-only route", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockUserSession);

    const { session, error } = await requireAuth("admin");

    expect(session).toBeNull();
    expect(error?.status).toBe(403);
    const body = await error!.json();
    expect(body.error).toContain("admin");
  });

  it("returns the session when an admin accesses an admin-only route", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);

    const { session, error } = await requireAuth("admin");

    expect(error).toBeNull();
    expect(session?.user.role).toBe("admin");
  });

  it("allows any authenticated user when role is 'user'", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockUserSession);

    const { session, error } = await requireAuth("user");

    expect(error).toBeNull();
    expect(session?.user.id).toBe("user-id");
  });

  it("returns 401 (not 403) when unauthenticated and role is required", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { session, error } = await requireAuth("admin");

    expect(session).toBeNull();
    expect(error?.status).toBe(401);
  });
});
