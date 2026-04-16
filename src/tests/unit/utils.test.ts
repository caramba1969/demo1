import { describe, it, expect } from "vitest";
import { cn, formatRate } from "@/lib/utils";

describe("cn()", () => {
  it("joins plain class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge should keep only the last conflicting class
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ "font-bold": true, italic: false })).toBe("font-bold");
  });

  it("returns empty string when no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatRate()", () => {
  it("formats millions with one decimal place", () => {
    expect(formatRate(1_500_000)).toBe("1.5M");
    expect(formatRate(10_000_000)).toBe("10.0M");
  });

  it("formats thousands with one decimal place", () => {
    expect(formatRate(1_500)).toBe("1.5K");
    expect(formatRate(10_000)).toBe("10.0K");
  });

  it("returns integers as-is (no decimal)", () => {
    expect(formatRate(0)).toBe("0");
    expect(formatRate(42)).toBe("42");
    expect(formatRate(999)).toBe("999");
  });

  it("formats decimals to one decimal place", () => {
    expect(formatRate(3.14)).toBe("3.1");
    expect(formatRate(0.5)).toBe("0.5");
  });

  it("handles the boundary between K and M (exactly 1M)", () => {
    expect(formatRate(1_000_000)).toBe("1.0M");
  });

  it("handles the boundary between raw and K (exactly 1000)", () => {
    expect(formatRate(1_000)).toBe("1.0K");
  });
});
