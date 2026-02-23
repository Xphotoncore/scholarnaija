import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

// Search APIs
export const searchAPI = {
  searchPapers: (params) => apiClient.get('/search/papers', { params }),
  getTrendingNigeria: () => apiClient.get('/search/trending-nigeria'),
  getSuggestions: (query) => apiClient.get('/search/suggestions', { params: { q: query } }),
};

// Papers APIs
export const papersAPI = {
  getPaper: (openalexId) => apiClient.get(`/papers/${openalexId}`),
  savePaper: (openalexId, projectId) => apiClient.post(`/papers/${openalexId}/save`, { projectId }),
  removeSavedPaper: (paperId) => apiClient.delete(`/papers/${paperId}/save`),
  getSavedPapers: (projectId) => apiClient.get(`/papers/project/${projectId}/papers`),
};

// Projects APIs
export const projectsAPI = {
  createProject: (data) => apiClient.post('/projects', data),
  getProjects: () => apiClient.get('/projects'),
  getProject: (projectId) => apiClient.get(`/projects/${projectId}`),
  updateProject: (projectId, data) => apiClient.put(`/projects/${projectId}`, data),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),
  exportProject: (projectId, format) => apiClient.get(`/projects/${projectId}/export`, { params: { format } }),
};

// Citations APIs
export const citationsAPI = {
  getCitation: (doi, format = 'apa') => apiClient.get(`/citations/${encodeURIComponent(doi)}`, { params: { format } }),
  getBatchCitations: (dois, format = 'apa') => apiClient.post('/citations/batch', { dois, format }),
};

export default apiClient;