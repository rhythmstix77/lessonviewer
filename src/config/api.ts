import { supabase, TABLES, isSupabaseConfigured } from './supabase';
import type { Activity } from '../contexts/DataContext';

// API endpoints for activities
export const activitiesApi = {
  getAll: async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*');
      
    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
    
    return data || [];
  },
  
  create: async (activity: Activity) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .insert([activity])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
    
    return data;
  },
  
  update: async (id: string, activity: Activity) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .update(activity)
      .eq('_id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
    
    return data;
  },
  
  delete: async (id: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { error } = await supabase
      .from(TABLES.ACTIVITIES)
      .delete()
      .eq('_id', id);
      
    if (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
    
    return { success: true };
  },
  
  import: async (activities: Activity[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .insert(activities);
      
    if (error) {
      console.error('Error importing activities:', error);
      throw error;
    }
    
    return { success: true };
  }
};

// API endpoints for lessons
export const lessonsApi = {
  getBySheet: async (sheet: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.LESSONS)
      .select('*')
      .eq('sheet', sheet)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching lessons:', error);
      throw error;
    }
    
    return data || {};
  },
  
  updateSheet: async (sheet: string, data: any) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    // Check if record exists
    const { data: existingData, error: checkError } = await supabase
      .from(TABLES.LESSONS)
      .select('id')
      .eq('sheet', sheet)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing lesson data:', checkError);
      throw checkError;
    }
    
    if (existingData) {
      // Update existing record
      const { data: updatedData, error } = await supabase
        .from(TABLES.LESSONS)
        .update({ ...data, updated_at: new Date() })
        .eq('sheet', sheet)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating lesson data:', error);
        throw error;
      }
      
      return updatedData;
    } else {
      // Insert new record
      const { data: newData, error } = await supabase
        .from(TABLES.LESSONS)
        .insert([{ sheet, ...data, created_at: new Date(), updated_at: new Date() }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating lesson data:', error);
        throw error;
      }
      
      return newData;
    }
  }
};

// API endpoints for lesson plans
export const lessonPlansApi = {
  getAll: async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.LESSON_PLANS)
      .select('*');
      
    if (error) {
      console.error('Error fetching lesson plans:', error);
      throw error;
    }
    
    return data || [];
  },
  
  create: async (plan: any) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.LESSON_PLANS)
      .insert([{ ...plan, created_at: new Date(), updated_at: new Date() }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating lesson plan:', error);
      throw error;
    }
    
    return data;
  },
  
  update: async (id: string, plan: any) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.LESSON_PLANS)
      .update({ ...plan, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating lesson plan:', error);
      throw error;
    }
    
    return data;
  }
};

// API endpoints for EYFS standards
export const eyfsApi = {
  getBySheet: async (sheet: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    const { data, error } = await supabase
      .from(TABLES.EYFS_STATEMENTS)
      .select('*')
      .eq('sheet', sheet)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching EYFS standards:', error);
      throw error;
    }
    
    return data || {};
  },
  
  updateSheet: async (sheet: string, data: any) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    // Check if record exists
    const { data: existingData, error: checkError } = await supabase
      .from(TABLES.EYFS_STATEMENTS)
      .select('id')
      .eq('sheet', sheet)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing EYFS data:', checkError);
      throw checkError;
    }
    
    if (existingData) {
      // Update existing record
      const { data: updatedData, error } = await supabase
        .from(TABLES.EYFS_STATEMENTS)
        .update({ ...data, updated_at: new Date() })
        .eq('sheet', sheet)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating EYFS data:', error);
        throw error;
      }
      
      return updatedData;
    } else {
      // Insert new record
      const { data: newData, error } = await supabase
        .from(TABLES.EYFS_STATEMENTS)
        .insert([{ sheet, ...data, created_at: new Date(), updated_at: new Date() }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating EYFS data:', error);
        throw error;
      }
      
      return newData;
    }
  }
};

// Export/Import all data
export const dataApi = {
  exportAll: async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    // Get all data from all tables
    const [activities, lessons, lessonPlans, eyfsStatements] = await Promise.all([
      supabase.from(TABLES.ACTIVITIES).select('*'),
      supabase.from(TABLES.LESSONS).select('*'),
      supabase.from(TABLES.LESSON_PLANS).select('*'),
      supabase.from(TABLES.EYFS_STATEMENTS).select('*')
    ]);
    
    if (activities.error) throw activities.error;
    if (lessons.error) throw lessons.error;
    if (lessonPlans.error) throw lessonPlans.error;
    if (eyfsStatements.error) throw eyfsStatements.error;
    
    return {
      activities: activities.data || [],
      lessons: lessons.data || [],
      lessonPlans: lessonPlans.data || [],
      eyfs: eyfsStatements.data || []
    };
  },
  
  importAll: async (data: any) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
    
    // Import data to all tables
    const promises = [];
    
    if (data.activities && data.activities.length > 0) {
      promises.push(
        supabase.from(TABLES.ACTIVITIES).insert(data.activities)
      );
    }
    
    if (data.lessons) {
      for (const sheet in data.lessons) {
        promises.push(
          lessonsApi.updateSheet(sheet, data.lessons[sheet])
        );
      }
    }
    
    if (data.lessonPlans && data.lessonPlans.length > 0) {
      promises.push(
        supabase.from(TABLES.LESSON_PLANS).insert(data.lessonPlans)
      );
    }
    
    if (data.eyfs) {
      for (const sheet in data.eyfs) {
        promises.push(
          eyfsApi.updateSheet(sheet, data.eyfs[sheet])
        );
      }
    }
    
    await Promise.all(promises);
    
    return { success: true };
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