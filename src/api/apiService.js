// src/api/apiService.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Token'ı header'a ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// -------- Auth
export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  me: () => api.get("/api/auth/me"), // varsa
};

// -------- Profile
export const profileApi = {
  get: () => api.get("/api/profiles/me"),
  update: (payload) => api.put("/api/profiles/me", payload),
};

// -------- Clubs
export const clubApi = {
  // not used currently for listing; clubs are fetched from Supabase
  list: () => api.get("/api/clubs"),
  // UserClubController endpoints (use backend JWT to infer current user)
  join: (clubId) => api.post(`/api/userclub/join`, { clubId }),
  leave: (clubId) => api.delete(`/api/userclub/leave/${clubId}`),
  myClubs: () => api.get("/api/userclub/mine"),
};

// -------- UserEvents (Event Participation)
export const userEventApi = {
  join: (eventId) => api.post("/api/userevent/join", { eventId }),
  leave: (eventId) => api.delete(`/api/userevent/leave/${eventId}`),
  mine: () => api.get("/api/userevent/mine"),
};

export default api;
