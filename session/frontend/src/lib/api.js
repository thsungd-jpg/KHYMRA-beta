import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============== Projects ==============
export const projectsApi = {
  list: (includeTemplates = false) => 
    api.get('/projects', { params: { include_templates: includeTemplates } }),
  
  get: (id) => api.get(`/projects/${id}`),
  
  create: (data) => api.post('/projects', data),
  
  update: (id, data) => api.patch(`/projects/${id}`, data),
  
  delete: (id) => api.delete(`/projects/${id}`),
  
  fork: (sourceId, name) => 
    api.post('/projects', { name, fork_from_id: sourceId }),
};

// ============== States ==============
export const statesApi = {
  list: (projectId) => api.get(`/projects/${projectId}/states`),
  
  get: (projectId, stateId) => api.get(`/projects/${projectId}/states/${stateId}`),
  
  create: (projectId, data) => api.post(`/projects/${projectId}/states`, data),
  
  update: (projectId, stateId, data) => 
    api.put(`/projects/${projectId}/states/${stateId}`, data),
  
  delete: (projectId, stateId) => 
    api.delete(`/projects/${projectId}/states/${stateId}`),
};

// ============== Variations ==============
export const variationsApi = {
  list: (projectId) => api.get(`/projects/${projectId}/variations`),
  
  create: (projectId, data) => api.post(`/projects/${projectId}/variations`, data),
  
  delete: (projectId, variationId) => 
    api.delete(`/projects/${projectId}/variations/${variationId}`),
};

// ============== Export ==============
export const exportApi = {
  generate: (projectId, config) => 
    api.post(`/projects/${projectId}/export`, config),
  
  getScaffold: (exportId) => api.get(`/exports/${exportId}/scaffold`),
};

// ============== Templates ==============
export const templatesApi = {
  list: () => api.get('/templates'),
  
  seedBase: () => api.post('/templates/seed'),
};

// ============== Health ==============
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
