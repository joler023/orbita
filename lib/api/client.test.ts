import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, resetRefreshLock } from "./client";
import { ApiError } from "./errors";

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("sends credentials and JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ userId: "u1", email: "a@b.com", fullName: "Ana" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ email: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "secretsecret" }),
    });

    expect(result.email).toBe("a@b.com");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5091/api/auth/login",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("refreshes once and retries on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ userId: "u1", email: "a@b.com", fullName: "Ana" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ userId: "u1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const me = await apiRequest<{ userId: string }>("/api/auth/me");

    expect(me.userId).toBe("u1");
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost:5091/api/auth/me",
      "http://localhost:5091/api/auth/refresh",
      "http://localhost:5091/api/auth/me",
    ]);
  });

  it("does not refresh a failed login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: "Invalid credentials", detail: "no" }), {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "bad" }),
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
