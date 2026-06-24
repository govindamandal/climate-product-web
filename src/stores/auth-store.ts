import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { User } from "@/lib/api";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (session: { access_token: string; refresh_token: string; user: User }) => void;
  logout: () => void;
};

const memoryStorage = (): StateStorage => {
  const store = new Map<string, string>();
  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
};

const isStorage = (storage: Storage | undefined): storage is Storage =>
  Boolean(
    storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function",
  );

const authStorage = createJSONStorage<AuthState>(() => {
  if (typeof window !== "undefined" && isStorage(window.localStorage)) {
    return window.localStorage;
  }
  return memoryStorage();
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          user: session.user,
        }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "climate-platform-auth", storage: authStorage },
  ),
);
