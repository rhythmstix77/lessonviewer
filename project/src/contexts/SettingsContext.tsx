import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserSettings {
  schoolName: string;
  schoolLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customTheme: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetToDefaults: () => void;
  getThemeForClass: (className: string) => {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
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

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('lesson-viewer-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
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

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('lesson-viewer-settings');
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

  const value = {
    settings,
    updateSettings,
    resetToDefaults,
    getThemeForClass
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}