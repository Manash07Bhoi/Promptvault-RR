import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@workspace/api-client-react";

const BROADCAST_CHANNEL_NAME = "promptvault-auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  updateUser: (user: User) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

let authChannel: BroadcastChannel | null = null;
try {
  authChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
} catch {}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
          isAdmin: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
        }),
      updateUser: (user) =>
        set({
          user,
          isAdmin: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
        }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => {
        try { authChannel?.postMessage({ type: "logout" }); } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isAdmin: false });
      },
    }),
    {
      name: "promptvault-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

if (authChannel) {
  authChannel.addEventListener("message", (event) => {
    if (event.data?.type === "logout") {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  });
}
