import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserSettings {
  schoolName: string;
  schoolLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customTheme: boolean;
}

export interface CategorySettings {
  name: string;
  color: string;
  position: number;
}

interface SettingsContextType {
  settings: UserSettings;
  categories: CategorySettings[];
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateCategories: (newCategories: CategorySettings[]) => void;
  resetToDefaults: () => void;
  resetCategoriesToDefaults: () => void;
  getThemeForClass: (className: string) => {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  getCategoryColor: (categoryName: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

// Default class-based themes - Consistent with Rhythmstix branding
const CLASS_THEMES = {
  'LKG': {
    primary: '#10B981', // Emerald
    secondary: '#059669',
    accent: '#34D399',
    gradient: 'from-emerald-500 to-green-600'
  },
  'UKG': {
    primary: '#3B82F6', // Blue - matches Rhythmstix brand
    secondary: '#2563EB',
    accent: '#60A5FA',
    gradient: 'from-blue-500 to-indigo-600'
  },
  'Reception': {
    primary: '#8B5CF6', // Purple
    secondary: '#7C3AED',
    accent: '#A78BFA',
    gradient: 'from-purple-500 to-violet-600'
  }
};

const DEFAULT_SETTINGS: UserSettings = {
  schoolName: 'Rhythmstix',
  schoolLogo: '/RLOGO.png',
  primaryColor: '#3B82F6',
  secondaryColor: '#2563EB',
  accentColor: '#60A5FA',
  customTheme: false
};

// Default categories with colors
const DEFAULT_CATEGORIES: CategorySettings[] = [
  { name: 'Welcome', color: '#F59E0B', position: 0 },
  { name: 'Kodaly Songs', color: '#8B5CF6', position: 1 },
  { name: 'Kodaly Action Songs', color: '#F97316', position: 2 },
  { name: 'Action/Games Songs', color: '#F97316', position: 3 },
  { name: 'Rhythm Sticks', color: '#D97706', position: 4 },
  { name: 'Scarf Songs', color: '#10B981', position: 5 },
  { name: 'General Game', color: '#3B82F6', position: 6 },
  { name: 'Core Songs', color: '#84CC16', position: 7 },
  { name: 'Parachute Games', color: '#EF4444', position: 8 },
  { name: 'Percussion Games', color: '#06B6D4', position: 9 },
  { name: 'Teaching Units', color: '#6366F1', position: 10 },
  { name: 'Goodbye', color: '#14B8A6', position: 11 },
  { name: 'Kodaly Rhythms', color: '#9333EA', position: 12 },
  { name: 'Kodaly Games', color: '#F59E0B', position: 13 },
  { name: 'IWB Games', color: '#FBBF24', position: 14 }
];

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<CategorySettings[]>(DEFAULT_CATEGORIES);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('lesson-viewer-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      
      const savedCategories = localStorage.getItem('lesson-viewer-categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lesson-viewer-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);
  
  // Save categories to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lesson-viewer-categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  }, [categories]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const updateCategories = (newCategories: CategorySettings[]) => {
    setCategories(newCategories);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('lesson-viewer-settings');
  };
  
  const resetCategoriesToDefaults = () => {
    setCategories(DEFAULT_CATEGORIES);
    localStorage.removeItem('lesson-viewer-categories');
  };

  const getThemeForClass = (className: string) => {
    // If custom theme is enabled, use user's custom colors
    if (settings.customTheme) {
      return {
        primary: settings.primaryColor,
        secondary: settings.secondaryColor,
        accent: settings.accentColor,
        gradient: `from-[${settings.primaryColor}] to-[${settings.secondaryColor}]`
      };
    }

    // Otherwise, use class-based theme
    return CLASS_THEMES[className as keyof typeof CLASS_THEMES] || CLASS_THEMES.LKG;
  };
  
  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280'; // Default gray if not found
  };

  const value = {
    settings,
    categories,
    updateSettings,
    updateCategories,
    resetToDefaults,
    resetCategoriesToDefaults,
    getThemeForClass,
    getCategoryColor
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}