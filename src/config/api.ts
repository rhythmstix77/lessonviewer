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

// API endpoints for activities
export const activitiesApi = {
  getAll: async () => {
    const response = await api.get('/activities');
    return response.data;
  },
  
  create: async (activity) => {
    const response = await api.post('/activities', activity);
    return response.data;
  },
  
  update: async (id, activity) => {
    const response = await api.put(`/activities/${id}`, activity);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },
  
  import: async (activities) => {
    const response = await api.post('/import', { activities });
    return response.data;
  }
};

// API endpoints for lessons
export const lessonsApi = {
  getBySheet: async (sheet) => {
    const response = await api.get(`/lessons/${sheet}`);
    return response.data;
  },
  
  updateSheet: async (sheet, data) => {
    const response = await api.post(`/lessons/${sheet}`, data);
    return response.data;
  }
};

// API endpoints for lesson plans
export const lessonPlansApi = {
  getAll: async () => {
    const response = await api.get('/lessonPlans');
    return response.data;
  },
  
  create: async (plan) => {
    const response = await api.post('/lessonPlans', plan);
    return response.data;
  },
  
  update: async (id, plan) => {
    const response = await api.put(`/lessonPlans/${id}`, plan);
    return response.data;
  }
};

// API endpoints for EYFS standards
export const eyfsApi = {
  getBySheet: async (sheet) => {
    const response = await api.get(`/eyfs/${sheet}`);
    return response.data;
  },
  
  updateSheet: async (sheet, data) => {
    const response = await api.post(`/eyfs/${sheet}`, data);
    return response.data;
  }
};

// Export/Import all data
export const dataApi = {
  exportAll: async () => {
    const response = await api.get('/export');
    return response.data;
  },
  
  importAll: async (data) => {
    const response = await api.post('/import', data);
    return response.data;
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