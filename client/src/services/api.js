// /client/src/services/api.js
import axios from "axios";

const http = axios.create({ baseURL: "/api" });

// Attach JWT to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("crm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login:    (body)   => http.post("/auth/login", body),
  register: (body)   => http.post("/auth/register", body),
  getMe:    ()       => http.get("/auth/me"),
};

export const leadsApi = {
  getAll:   (params) => http.get("/leads", { params }),
  getById:  (id)     => http.get(`/leads/${id}`),
  create:   (body)   => http.post("/leads", body),
  update:   (id, b)  => http.put(`/leads/${id}`, b),
  remove:   (id)     => http.delete(`/leads/${id}`),
  ai:       (id, mode) => http.post(`/leads/${id}/ai`, { mode }),
};

export const pipelineApi = {
  getStages:    () => http.get("/pipeline/stages"),
  getStats:     () => http.get("/pipeline/stats"),
  moveToStage:  (leadId, stage) => http.patch(`/pipeline/${leadId}/stage`, { stage }),
};

export const analyticsApi = {
  getDashboardStats:  () => http.get("/analytics/dashboard"),
  getLeadsBySource:   () => http.get("/analytics/leads-by-source"),
  getConversionReport:() => http.get("/analytics/conversion"),
  getRevenueTimeline: () => http.get("/analytics/revenue"),
};

export const messagesApi = {
  getRecent: (params) => http.get("/messages/recent", { params }),
};

export const whatsappApi = {
  sendMessage: ({ to, message }) => http.post("/whatsapp/send", { to, message }),
};

export const instagramApi = {
  replyToComment: ({ commentId, message, leadId }) =>
    http.post("/instagram/reply", { commentId, message, leadId }),
};
