import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pv_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  changeEmail: (payload) => apiClient.put('/auth/change-email', payload).then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
};

export const profileApi = {
  get: () => apiClient.get('/profile').then((r) => r.data),
  update: (payload) => apiClient.put('/profile', payload).then((r) => r.data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiClient.post('/profile/photo', formData).then((r) => r.data);
  },
  deletePhoto: () => apiClient.delete('/profile/photo').then((r) => r.data),
};

export const projectsApi = {
  list: (params = {}) => apiClient.get('/projects', { params }).then((r) => r.data),
  getBySlug: (slug) => apiClient.get(`/projects/${slug}`).then((r) => r.data),
  adminOverview: () => apiClient.get('/projects/admin/overview').then((r) => r.data),
  adminGetById: (id) => apiClient.get(`/projects/admin/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/projects', payload).then((r) => r.data),
  seedSample: () => apiClient.post('/projects/seed-sample').then((r) => r.data),
  update: (id, payload) => apiClient.put(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/projects/${id}`).then((r) => r.data),
  uploadThumbnail: (id, file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return apiClient.post(`/projects/${id}/thumbnail`, formData).then((r) => r.data);
  },
  removeThumbnail: (id) => apiClient.delete(`/projects/${id}/thumbnail`).then((r) => r.data),
  uploadScreenshots: (id, files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('screenshots', f));
    return apiClient.post(`/projects/${id}/screenshots`, formData).then((r) => r.data);
  },
  deleteScreenshot: (id, screenshotId) =>
    apiClient.delete(`/projects/${id}/screenshots/${screenshotId}`).then((r) => r.data),
  uploadDocuments: (id, items) => {
    const formData = new FormData();
    const titles = [];
    items.forEach((item) => {
      formData.append('documents', item.file);
      titles.push(item.title || '');
    });
    formData.append('titles', JSON.stringify(titles));
    return apiClient.post(`/projects/${id}/documents`, formData).then((r) => r.data);
  },
  updateDocument: (id, docId, { title, file }) => {
    const formData = new FormData();
    if (title !== undefined) {
      formData.append('title', title);
    }
    if (file) {
      formData.append('document', file);
    }
    return apiClient.put(`/projects/${id}/documents/${docId}`, formData).then((r) => r.data);
  },
  deleteDocument: (id, docId) =>
    apiClient.delete(`/projects/${id}/documents/${docId}`).then((r) => r.data),
  getDocumentFileUrl: (slug, docId, { download = false } = {}) =>
    `${API_BASE_URL}/projects/${slug}/documents/${docId}/file${download ? '?download=1' : ''}`,
};
