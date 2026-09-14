import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "./use-polling";

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the callback on every interval while enabled", async () => {
    const callback = vi.fn(() => Promise.resolve());
    renderHook(() => usePolling(callback, 3000, true));

    await act(() => vi.advanceTimersByTimeAsync(3000));
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("stops when disabled", async () => {
    const callback = vi.fn(() => Promise.resolve());
    const { rerender } = renderHook(({ enabled }) => usePolling(callback, 3000, enabled), {
      initialProps: { enabled: true },
    });

    await act(() => vi.advanceTimersByTimeAsync(3000));
    rerender({ enabled: false });
    await act(() => vi.advanceTimersByTimeAsync(9000));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("keeps polling after a failed call", async () => {
    const callback = vi.fn(() => Promise.reject(new Error("offline")));
    renderHook(() => usePolling(callback, 1000, true));

    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
