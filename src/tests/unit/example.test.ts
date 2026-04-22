import { describe, it, expect } from "vitest";

/**
 * Example unit tests for pure utility / helper functions.
 * Replace with real tests for functions in src/lib/*.
 */
describe("Example utility tests", () => {
  it("adds numbers correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("formats an email to lowercase", () => {
    const normalize = (email: string) => email.toLowerCase().trim();
    expect(normalize("  User@Example.COM  ")).toBe("user@example.com");
  });
});
