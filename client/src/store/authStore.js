// /client/src/store/authStore.js
import { create } from "zustand";

const stored = {
  user:  JSON.parse(localStorage.getItem("crm_user") ?? "null"),
  token: localStorage.getItem("crm_token") ?? null,
};

export const useAuthStore = create((set) => ({
  user:  stored.user,
  token: stored.token,
  setAuth: (user, token) => {
    localStorage.setItem("crm_user",  JSON.stringify(user));
    localStorage.setItem("crm_token", token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_token");
    set({ user: null, token: null });
    window.location.href = "/login";
  },
}));
