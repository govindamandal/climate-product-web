import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

describe("api auth handling", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/login");
    useAuthStore.getState().setSession({
      access_token: "expired-token",
      refresh_token: "expired-refresh",
      user: {
        id: "user-1",
        organization_id: "org-1",
        email: "admin@example.com",
        full_name: "Admin User",
        role: "org_admin",
        is_active: true,
      },
    });
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().logout();
    useToastStore.setState({ toasts: [] });
  });

  it("refreshes the access token and retries an authenticated request once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "fresh-token",
          refresh_token: "fresh-refresh",
          user: {
            id: "user-1",
            organization_id: "org-1",
            email: "admin@example.com",
            full_name: "Admin User",
            role: "org_admin",
            is_active: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [], total: 0, page: 1, page_size: 20, categories: [] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.products()).resolves.toMatchObject({ total: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({
      Authorization: "Bearer fresh-token",
    });
    expect(useAuthStore.getState().accessToken).toBe("fresh-token");
  });

  it("clears auth and shows a toast when refresh fails after a 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ detail: "Invalid token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ detail: "Invalid refresh token" }),
        }),
    );

    await expect(api.products()).rejects.toMatchObject(new ApiError("Invalid token", 401));

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      title: "Session expired",
      description: "Please sign in again to continue.",
      variant: "error",
    });
  });
});
