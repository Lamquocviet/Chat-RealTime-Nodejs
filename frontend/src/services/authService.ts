import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, email, firstName, lastName },
      { withCredentials: true }
    );

    return res.data;
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "/auth/signin",
      { username, password },
      { withCredentials: true }
    );
    return res.data; // access token
  },

  signOut: async () => {
    return api.post("/auth/signout", { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data.accessToken;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const res = await api.patch(
      "/auth/change-password",
      { currentPassword, newPassword, confirmPassword },
      { withCredentials: true }
    );
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post(
      "/auth/forgot-password",
      { email },
      { withCredentials: true }
    );
    return res.data;
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    const res = await api.post(
      "/auth/reset-password",
      { token, password, confirmPassword },
      { withCredentials: true }
    );
    return res.data;
  },

  googleLogin: async () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/auth/google`;
  },
};
