import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email: string, password: string, role: string = 'user') =>
    api.post('/auth/register', { email, password, role }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const resumeAPI = {
  upload: (files: FileList, idempotencyKey: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    
    return api.post('/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Idempotency-Key': idempotencyKey,
      },
    });
  },
  
  list: (limit: number = 20, offset: number = 0, q?: string) => {
    const params: any = { limit, offset };
    if (q) params.q = q;
    return api.get('/resumes', { params });
  },
  
  get: (id: string) =>
    api.get(`/resumes/${id}`),
};

export const searchAPI = {
  ask: (query: string, k: number = 5) =>
    api.post('/ask', { query, k }),
};

export const jobAPI = {
  create: (data: any, idempotencyKey: string) =>
    api.post('/jobs', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  
  list: (limit: number = 20, offset: number = 0) =>
    api.get('/jobs', { params: { limit, offset } }),
  
  get: (id: string) =>
    api.get(`/jobs/${id}`),
  
  match: (id: string, top_n: number = 10) =>
    api.post(`/jobs/${id}/match`, { top_n }),
};

export default api;
