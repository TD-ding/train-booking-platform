import { create } from "zustand";
import type { User } from "@/types";
import api from "@/services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; real_name: string; phone: string; email: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  initialized: false,

  login: async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user, initialized: true });
  },

  register: async (data) => {
    const res = await api.post("/auth/register", data);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user, initialized: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ user: null, token: null, initialized: true });
      return;
    }
    try {
      const res = await api.get("/auth/me");
      const user = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, token, initialized: true });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ user: null, token: null, initialized: true });
    }
  },
}));
