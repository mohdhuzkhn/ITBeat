import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("itbeat_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

export const postService = {
  list: (params) => api.get("/posts", { params }),
  get: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post("/posts", data),
};


export const adminService = {
  getQueue:       ()         => api.get('/admin/queue'),
  approvePost:    (id)       => api.patch(`/admin/posts/${id}/approve`),
  rejectPost:     (id)       => api.patch(`/admin/posts/${id}/reject`),
  trustUser:      (id)       => api.patch(`/admin/users/${id}/trust`),
  deletePost:     (id)       => api.delete(`/admin/posts/${id}`),
  getCategories:  ()         => api.get('/admin/categories'),
  addCategory:    (data)     => api.post('/admin/categories', data),
  deleteCategory: (id)       => api.delete(`/admin/categories/${id}`),
};


export default api;
