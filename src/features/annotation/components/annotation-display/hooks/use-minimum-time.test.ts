import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMinimumTime } from "./use-minimum-time";

describe("useMinimumTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at the provided number of seconds and is not completed", () => {
    const { result } = renderHook(() => useMinimumTime(10));
    expect(result.current.timeLeft).toBe(10);
    expect(result.current.isCompleted).toBe(false);
    expect(result.current.formattedTime).toBe("0:10");
  });

  it("counts down one second per interval tick", () => {
    const { result } = renderHook(() => useMinimumTime(5));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(4);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.timeLeft).toBe(2);
  });

  it("reaches zero, marks completed, and never goes negative", () => {
    const { result } = renderHook(() => useMinimumTime(2));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.formattedTime).toBe("0:00");
  });

  it("formats minutes and seconds with zero padding", () => {
    const { result } = renderHook(() => useMinimumTime(125));
    expect(result.current.formattedTime).toBe("2:05");
  });

  it("resets the timer when the seconds prop changes (new article loaded)", () => {
    const { result, rerender } = renderHook(
      ({ seconds }) => useMinimumTime(seconds),
      { initialProps: { seconds: 10 } }
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeLeft).toBe(7);

    rerender({ seconds: 20 });
    expect(result.current.timeLeft).toBe(20);
    expect(result.current.isCompleted).toBe(false);
  });

  it("resetTimer() restores the full duration", () => {
    const { result } = renderHook(() => useMinimumTime(8));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.timeLeft).toBe(4);
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.timeLeft).toBe(8);
    expect(result.current.isCompleted).toBe(false);
  });

  it("stops ticking once it reaches zero (gate stays open)", () => {
    const { result } = renderHook(() => useMinimumTime(1));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(0);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeLeft).toBe(0);
  });

  it("treats a zero-second gate as immediately completed", () => {
    const { result } = renderHook(() => useMinimumTime(0));
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isCompleted).toBe(true);
  });
});
