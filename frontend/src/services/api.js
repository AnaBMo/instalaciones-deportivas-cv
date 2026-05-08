import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado - limpiar y redirigir a login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== AUTENTICACIÓN ==========
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getMe: () => api.get('/auth/me/'),
};

// ========== INSTALACIONES (PÚBLICO) ==========
export const instalacionesAPI = {
  getAll: (params) => api.get('/instalaciones/', { params }),
  getById: (id) => api.get(`/instalaciones/${id}/`),
  getStats: () => api.get('/instalaciones/stats/'),
  getByBounds: (params) => api.get('/instalaciones/by_bounds/', { params }),
};

// ========== INSTALACIONES (ADMIN - REQUIERE AUTH) ==========
export const adminAPI = {
  create: (data) => api.post('/instalaciones/', data),
  update: (id, data) => api.put(`/instalaciones/${id}/`, data),
  delete: (id, razon) => api.delete(`/instalaciones/${id}/`, { data: { razon } }),
  getEliminadas: (params) => api.get('/instalaciones/eliminadas/', { params }),
  restaurar: (id) => api.post(`/instalaciones/eliminadas/${id}/restaurar/`),
};

export default api;