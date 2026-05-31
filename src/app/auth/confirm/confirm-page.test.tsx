import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock next/navigation's useSearchParams. Each test sets the current params.
let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => currentParams,
}));

import ConfirmPage from "./page";

afterEach(() => cleanup());
beforeEach(() => {
  currentParams = new URLSearchParams();
});

describe("Auth ConfirmPage", () => {
  it("renders the confirm UI with an enabled button when url is present", () => {
    currentParams = new URLSearchParams({ url: "https://example.com/magic?token=abc" });
    render(<ConfirmPage />);
    expect(screen.getByText("Confirm Sign In")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Sign In Now/i });
    expect(button).not.toBeDisabled();
  });

  it("shows an error and a back-to-signin link when url is missing", () => {
    currentParams = new URLSearchParams();
    render(<ConfirmPage />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("Invalid link. Please request a new magic link.")
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Back to Sign In/i });
    expect(link).toHaveAttribute("href", "/auth/signin");
  });

  it("navigates to the magic link url and shows the loading state on confirm", () => {
    currentParams = new URLSearchParams({ url: "https://example.com/magic?token=xyz" });

    // jsdom does not implement navigation; stub window.location.href setter.
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        set href(v: string) {
          hrefSetter(v);
        },
        get href() {
          return "";
        },
      },
    });

    render(<ConfirmPage />);
    const button = screen.getByRole("button", { name: /Sign In Now/i });
    fireEvent.click(button);

    expect(hrefSetter).toHaveBeenCalledWith("https://example.com/magic?token=xyz");
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });
});
