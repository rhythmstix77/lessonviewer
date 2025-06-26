import axios from 'axios';

// API base URL - change this to your production server URL when deploying
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add error handling for network errors
api.interceptors.request.use(
  config => config,
  error => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.message === 'Network Error') {
      console.warn('Network error detected, falling back to local storage');
    }
    return Promise.reject(error);
  }
);

// API endpoints for activities
export const activitiesApi = {
  getAll: async () => {
    try {
      const response = await api.get('/activities');
      return response.data;
    } catch (error) {
      console.warn('Failed to get activities from server, using local storage');
      throw error;
    }
  },
  
  create: async (activity) => {
    try {
      const response = await api.post('/activities', activity);
      return response.data;
    } catch (error) {
      console.warn('Failed to create activity on server');
      throw error;
    }
  },
  
  update: async (id, activity) => {
    try {
      const response = await api.put(`/activities/${id}`, activity);
      return response.data;
    } catch (error) {
      console.warn('Failed to update activity on server');
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/activities/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to delete activity on server');
      throw error;
    }
  },
  
  import: async (activities) => {
    try {
      const response = await api.post('/import', { activities });
      return response.data;
    } catch (error) {
      console.warn('Failed to import activities to server');
      throw error;
    }
  }
};

// API endpoints for lessons
export const lessonsApi = {
  getBySheet: async (sheet) => {
    try {
      const response = await api.get(`/lessons/${sheet}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to get lessons for ${sheet} from server`);
      throw error;
    }
  },
  
  updateSheet: async (sheet, data) => {
    try {
      const response = await api.post(`/lessons/${sheet}`, data);
      return response.data;
    } catch (error) {
      console.warn(`Failed to update lessons for ${sheet} on server`);
      throw error;
    }
  }
};

// API endpoints for lesson plans
export const lessonPlansApi = {
  getAll: async () => {
    try {
      const response = await api.get('/lessonPlans');
      return response.data;
    } catch (error) {
      console.warn('Failed to get lesson plans from server');
      throw error;
    }
  },
  
  create: async (plan) => {
    try {
      const response = await api.post('/lessonPlans', plan);
      return response.data;
    } catch (error) {
      console.warn('Failed to create lesson plan on server');
      throw error;
    }
  },
  
  update: async (id, plan) => {
    try {
      const response = await api.put(`/lessonPlans/${id}`, plan);
      return response.data;
    } catch (error) {
      console.warn('Failed to update lesson plan on server');
      throw error;
    }
  }
};

// API endpoints for EYFS standards
export const eyfsApi = {
  getBySheet: async (sheet) => {
    try {
      const response = await api.get(`/eyfs/${sheet}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to get EYFS standards for ${sheet} from server`);
      throw error;
    }
  },
  
  updateSheet: async (sheet, data) => {
    try {
      const response = await api.post(`/eyfs/${sheet}`, data);
      return response.data;
    } catch (error) {
      console.warn(`Failed to update EYFS standards for ${sheet} on server`);
      throw error;
    }
  }
};

// Export/Import all data
export const dataApi = {
  exportAll: async () => {
    try {
      const response = await api.get('/export');
      return response.data;
    } catch (error) {
      console.warn('Failed to export data from server');
      throw error;
    }
  },
  
  importAll: async (data) => {
    try {
      const response = await api.post('/import', data);
      return response.data;
    } catch (error) {
      console.warn('Failed to import data to server');
      throw error;
    }
  }
};

// WordPress API Configuration
export const WORDPRESS_CONFIG = {
  BASE_URL: import.meta.env.VITE_WORDPRESS_URL || 'https://your-wordpress-site.com',
  API_ENDPOINT: '/wp-json/wp/v2',
  AUTH_ENDPOINT: '/wp-json/jwt-auth/v1/token',
  VALIDATE_ENDPOINT: '/wp-json/jwt-auth/v1/token/validate',
};

// WordPress API helper
export const wordpressAPI = {
  async authenticate(username: string, password: string) {
    const baseUrl = WORDPRESS_CONFIG.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.AUTH_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    return response.json();
  },
  
  async validateToken(token: string) {
    try {
      const baseUrl = WORDPRESS_CONFIG.BASE_URL;
      
      if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
        return false;
      }
      
      const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.VALIDATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
  
  async getUserInfo(token: string) {
    const baseUrl = WORDPRESS_CONFIG.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.API_ENDPOINT}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  }
};