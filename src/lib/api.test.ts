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

  it("clears auth and shows a toast when an authenticated request returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid token" }),
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
