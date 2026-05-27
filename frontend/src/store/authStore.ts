import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const { data } = await axios.post("/api/v1/auth/token/", {
          username,
          password,
        });
        const meRes = await axios.get("/api/v1/auth/me/", {
          headers: { Authorization: `Bearer ${data.access}` },
        });
        set({
          accessToken: data.access,
          refreshTokenValue: data.refresh,
          user: meRes.data,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshTokenValue: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        const { data } = await axios.post("/api/v1/auth/token/refresh/", {
          refresh: get().refreshTokenValue,
        });
        set({ accessToken: data.access });
      },
    }),
    { name: "neurosync-auth" }
  )
);
