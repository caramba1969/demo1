import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "@/components/LandingPage";

// Mock next-auth and next/navigation — not available in jsdom
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * Example component test for the LandingPage.
 * Demonstrates how to render and assert on UI output.
 */
describe("LandingPage", () => {
  it("renders the hero headline", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Plan your/i)).toBeDefined();
  });

  it("renders the Create free account button", () => {
    render(<LandingPage />);
    // LandingPage has two CTAs (hero + bottom section) — both should be present
    const buttons = screen.getAllByRole("button", { name: /Create free account/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Sign in button", () => {
    render(<LandingPage />);
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeDefined();
  });
});
