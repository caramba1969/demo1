import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/mongodb", () => ({ dbConnect: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/models/User", () => ({
  User: { findById: vi.fn(), findByIdAndDelete: vi.fn() },
}));
vi.mock("@/lib/models/Factory", () => ({
  Factory: { find: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("@/lib/models/Location", () => ({
  Location: { deleteMany: vi.fn() },
}));
vi.mock("@/lib/models/FactoryImport", () => ({
  FactoryImport: { deleteMany: vi.fn() },
}));
vi.mock("@/lib/models/Otp", () => ({
  Otp: { deleteMany: vi.fn() },
}));
vi.mock("@/lib/models/ProductionLine", () => ({
  default: { deleteMany: vi.fn() },
}));

import { User } from "@/lib/models/User";
import { Factory } from "@/lib/models/Factory";
import { Location } from "@/lib/models/Location";
import { FactoryImport } from "@/lib/models/FactoryImport";
import { Otp } from "@/lib/models/Otp";
import ProductionLine from "@/lib/models/ProductionLine";
import { deleteUserData } from "@/lib/delete-user-data";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeDeleteResult = (count: number) =>
  Promise.resolve({ deletedCount: count });

function setupDefaultMocks() {
  vi.mocked(User.findById).mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({ email: "user@example.com" }),
    }),
  } as any);

  vi.mocked(Factory.find).mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ _id: "fac1" }, { _id: "fac2" }]),
    }),
  } as any);

  vi.mocked(ProductionLine.deleteMany).mockResolvedValue(
    makeDeleteResult(5) as any
  );
  vi.mocked(Factory.deleteMany).mockResolvedValue(makeDeleteResult(2) as any);
  vi.mocked(Location.deleteMany).mockResolvedValue(makeDeleteResult(3) as any);
  vi.mocked(FactoryImport.deleteMany).mockResolvedValue(
    makeDeleteResult(1) as any
  );
  vi.mocked(Otp.deleteMany).mockResolvedValue(makeDeleteResult(1) as any);
  vi.mocked(User.findByIdAndDelete).mockResolvedValue(null as any);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("deleteUserData()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it("returns the user email and deletion counts", async () => {
    const result = await deleteUserData("uid-1");

    expect(result.email).toBe("user@example.com");
    expect(result.deleted).toEqual({
      factories: 2,
      productionLines: 5,
      locations: 3,
      imports: 1,
      otps: 1,
    });
  });

  it("throws 'User not found' when user does not exist", async () => {
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as any);

    await expect(deleteUserData("nonexistent")).rejects.toThrow("User not found");
  });

  it("skips ProductionLine.deleteMany when user has no factories", async () => {
    vi.mocked(Factory.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await deleteUserData("uid-no-factories");

    expect(ProductionLine.deleteMany).not.toHaveBeenCalled();
    expect(result.deleted.productionLines).toBe(0);
    // Other deletes still ran
    expect(Factory.deleteMany).toHaveBeenCalledWith({ userId: "uid-no-factories" });
    expect(Location.deleteMany).toHaveBeenCalledWith({ userId: "uid-no-factories" });
  });

  it("deletes production lines BEFORE factories (order check)", async () => {
    const callOrder: string[] = [];
    vi.mocked(ProductionLine.deleteMany).mockImplementation(async () => {
      callOrder.push("productionLines");
      return makeDeleteResult(0) as any;
    });
    vi.mocked(Factory.deleteMany).mockImplementation(async () => {
      callOrder.push("factories");
      return makeDeleteResult(0) as any;
    });

    await deleteUserData("uid-order");

    const plIndex = callOrder.indexOf("productionLines");
    const facIndex = callOrder.indexOf("factories");
    expect(plIndex).toBeLessThan(facIndex);
  });

  it("deletes the user document as the last step", async () => {
    const callOrder: string[] = [];
    vi.mocked(User.findByIdAndDelete).mockImplementation(async () => {
      callOrder.push("deleteUser");
      return null as any;
    });
    vi.mocked(Factory.deleteMany).mockImplementation(async () => {
      callOrder.push("factories");
      return makeDeleteResult(0) as any;
    });

    await deleteUserData("uid-last");

    const deleteUserIndex = callOrder.indexOf("deleteUser");
    const factoriesIndex = callOrder.indexOf("factories");
    expect(deleteUserIndex).toBeGreaterThan(factoriesIndex);
  });

  it("uses the user's email (not ID) to delete OTPs", async () => {
    await deleteUserData("uid-1");

    expect(Otp.deleteMany).toHaveBeenCalledWith({ email: "user@example.com" });
  });
});
