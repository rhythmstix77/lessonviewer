import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Upload, 
  Palette, 
  School, 
  RotateCcw, 
  X, 
  Check, 
  Image, 
  Download, 
  Upload as UploadIcon, 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Save, 
  Database,
  Server,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Users,
  Key,
  FileText
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../contexts/DataContext';
import { dataApi } from '../config/api';
import { isSupabaseConfigured } from '../config/supabase';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user } = useAuth();
  const { refreshData, uploadExcelFile, loading } = useData();
  const { settings, updateSettings, resetToDefaults, categories, updateCategories, resetCategoriesToDefaults } = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [tempCategories, setTempCategories] = useState(categories);
  const [logoUploadStatus, setLogoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'appearance' | 'data' | 'categories' | 'admin'>('appearance');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || 
                  user?.email === 'admin@rhythmstix.co.uk' || 
                  user?.email === 'admin@example.com' || 
                  user?.role === 'administrator' ||
                  user?.role === 'admin';

  // Update temp settings when settings change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Update temp categories when categories change
  React.useEffect(() => {
    setTempCategories(categories);
  }, [categories]);

  // Check server status when opening the panel
  React.useEffect(() => {
    if (isOpen && activeTab === 'admin') {
      checkServerStatus();
    }
  }, [isOpen, activeTab]);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      
      // Check if Supabase is configured
      if (isSupabaseConfigured()) {
        try {
          // Try to fetch from Supabase
          await dataApi.exportAll();
          setServerStatus('online');
        } catch (error) {
          console.warn('Supabase connection failed:', error);
          setServerStatus('offline');
        }
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus('offline');
    }
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    updateCategories(tempCategories);
    onClose();
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setTempCategories(categories);
    onClose();
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoUploadStatus('error');
      setTimeout(() => setLogoUploadStatus('idle'), 3000);
      return;
    }

    try {
      setLogoUploadStatus('uploading');
      
      // Convert to base64 for demo purposes
      // In production, you'd upload to a proper image hosting service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempSettings(prev => ({ ...prev, schoolLogo: result }));
        setLogoUploadStatus('success');
        setTimeout(() => setLogoUploadStatus('idle'), 3000);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Logo upload failed:', error);
      setLogoUploadStatus('error');
      setTimeout(() => setLogoUploadStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetToDefaults();
      setTempSettings(settings);
    }
  };

  const handleExportDatabase = () => {
    // Export all data from localStorage
    const data = {
      lessonData: {
        LKG: localStorage.getItem('lesson-data-LKG'),
        UKG: localStorage.getItem('lesson-data-UKG'),
        Reception: localStorage.getItem('lesson-data-Reception')
      },
      lessonPlans: localStorage.getItem('lesson-plans'),
      libraryActivities: localStorage.getItem('library-activities'),
      settings: localStorage.getItem('lesson-viewer-settings')
    };
    
    // Convert to JSON and create download
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `eyfs-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Import data into localStorage
        if (jsonData.lessonData) {
          if (jsonData.lessonData.LKG) localStorage.setItem('lesson-data-LKG', jsonData.lessonData.LKG);
          if (jsonData.lessonData.UKG) localStorage.setItem('lesson-data-UKG', jsonData.lessonData.UKG);
          if (jsonData.lessonData.Reception) localStorage.setItem('lesson-data-Reception', jsonData.lessonData.Reception);
        }
        
        if (jsonData.lessonPlans) localStorage.setItem('lesson-plans', jsonData.lessonPlans);
        if (jsonData.libraryActivities) localStorage.setItem('library-activities', jsonData.libraryActivities);
        if (jsonData.settings) localStorage.setItem('lesson-viewer-settings', jsonData.settings);
        
        alert('Database imported successfully. Please refresh the page to see the changes.');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import database. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    // Check if category already exists
    if (tempCategories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    
    // Add new category
    setTempCategories([
      ...tempCategories,
      {
        name: newCategoryName,
        color: newCategoryColor,
        position: tempCategories.length
      }
    ]);
    
    // Reset form
    setNewCategoryName('');
    setNewCategoryColor('#6B7280');
  };

  const handleUpdateCategory = (index: number, name: string, color: string) => {
    const updatedCategories = [...tempCategories];
    updatedCategories[index] = { ...updatedCategories[index], name, color };
    setTempCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (index: number) => {
    if (confirm('Are you sure you want to delete this category? This may affect existing activities.')) {
      const updatedCategories = tempCategories.filter((_, i) => i !== index);
      // Update positions
      updatedCategories.forEach((cat, i) => {
        cat.position = i;
      });
      setTempCategories(updatedCategories);
    }
  };

  const handleDragStart = (category: string) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;
    
    const draggedIndex = tempCategories.findIndex(cat => cat.name === draggedCategory);
    const targetIndex = tempCategories.findIndex(cat => cat.name === targetCategory);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder categories
    const newCategories = [...tempCategories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);
    
    // Update positions
    newCategories.forEach((cat, i) => {
      cat.position = i;
    });
    
    setTempCategories(newCategories);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleResetCategories = () => {
    if (confirm('Are you sure you want to reset categories to defaults? This cannot be undone.')) {
      resetCategoriesToDefaults();
      setTempCategories(categories);
    }
  };

  // Admin functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('uploading');
      await uploadExcelFile(file);
      setUploadStatus('success');
      setStatusMessage('Data updated successfully!');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage('Update failed. Please try again.');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleRefreshData = async () => {
    try {
      setUploadStatus('uploading');
      await refreshData();
      setUploadStatus('success');
      setStatusMessage('Data refreshed successfully!');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage('Refresh failed. Please try again.');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleMigrateToServer = async () => {
    try {
      setUploadStatus('uploading');
      setStatusMessage('Migrating data to Supabase...');
      
      // Get all data from localStorage
      const data = {
        activities: [],
        lessons: {},
        lessonPlans: [],
        eyfs: {}
      };
      
      // Extract activities from localStorage
      const libraryActivities = localStorage.getItem('library-activities');
      if (libraryActivities) {
        data.activities = JSON.parse(libraryActivities);
      }
      
      // Extract lessons from localStorage
      ['LKG', 'UKG', 'Reception'].forEach(sheet => {
        const lessonData = localStorage.getItem(`lesson-data-${sheet}`);
        if (lessonData) {
          data.lessons[sheet] = JSON.parse(lessonData);
        }
      });
      
      // Extract lesson plans from localStorage
      const lessonPlans = localStorage.getItem('lesson-plans');
      if (lessonPlans) {
        data.lessonPlans = JSON.parse(lessonPlans);
      }
      
      // Extract EYFS standards from localStorage
      ['LKG', 'UKG', 'Reception'].forEach(sheet => {
        const eyfsData = localStorage.getItem(`eyfs-standards-${sheet}`);
        if (eyfsData) {
          data.eyfs[sheet] = JSON.parse(eyfsData);
        }
      });
      
      // Send all data to server
      await dataApi.importAll(data);
      
      setUploadStatus('success');
      setStatusMessage('Data successfully migrated to Supabase.');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('Migration failed:', error);
      setUploadStatus('error');
      setStatusMessage('Failed to migrate data to Supabase.');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleClearAllLocalData = () => {
    if (confirm('Are you sure you want to clear ALL local data? This will remove all lessons, activities, units, and settings. This action cannot be undone.')) {
      // Clear all localStorage items
      localStorage.removeItem('lesson-data-LKG');
      localStorage.removeItem('lesson-data-UKG');
      localStorage.removeItem('lesson-data-Reception');
      localStorage.removeItem('lesson-plans');
      localStorage.removeItem('library-activities');
      localStorage.removeItem('units');
      localStorage.removeItem('eyfs-standards-LKG');
      localStorage.removeItem('eyfs-standards-UKG');
      localStorage.removeItem('eyfs-standards-Reception');
      localStorage.removeItem('eyfs-statements-flat-LKG');
      localStorage.removeItem('eyfs-statements-flat-UKG');
      localStorage.removeItem('eyfs-statements-flat-Reception');
      localStorage.removeItem('lesson-viewer-settings');
      localStorage.removeItem('lesson-viewer-categories');
      localStorage.removeItem('user-created-lesson-plans');
      localStorage.removeItem('admin-editable-content');
      localStorage.removeItem('admin-google-sheets-config');
      localStorage.removeItem('has-visited-before');
      localStorage.removeItem('half-terms');
      
      // Keep the auth token so the user stays logged in
      // localStorage.removeItem('rhythmstix_auth_token');
      
      // Show success message
      setUploadStatus('success');
      setStatusMessage('All local data has been cleared. The page will reload.');
      
      // Reload the page after a short delay with a parameter to indicate data was cleared
      setTimeout(() => {
        window.location.href = window.location.pathname + '?cleared=true' + window.location.hash;
      }, 1500);
    }
  };

  const presetLogos = [
    'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">User Settings</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'appearance' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'categories' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Activity Categories
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'data' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Data Management
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'admin' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'appearance' && (
            <>
              {/* School Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <School className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">School Information</h3>
                </div>

                <div className="space-y-6">
                  {/* School Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={tempSettings.schoolName}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Enter your school name"
                      dir="ltr"
                    />
                  </div>

                  {/* School Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      School Logo
                    </label>
                    
                    {/* Current Logo Preview */}
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="flex-shrink-0">
                        <img
                          src={tempSettings.schoolLogo}
                          alt="School Logo"
                          className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-3">
                          Upload a custom logo or choose from presets below
                        </p>
                        
                        {/* Upload Button */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={logoUploadStatus === 'uploading'}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button
                            disabled={logoUploadStatus === 'uploading'}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200"
                          >
                            <Upload className="h-4 w-4" />
                            <span>
                              {logoUploadStatus === 'uploading' ? 'Uploading...' : 'Upload Logo'}
                            </span>
                          </button>
                        </div>

                        {/* Upload Status */}
                        {logoUploadStatus === 'success' && (
                          <div className="flex items-center space-x-2 text-green-600 mt-2">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Logo uploaded successfully!</span>
                          </div>
                        )}
                        
                        {logoUploadStatus === 'error' && (
                          <div className="flex items-center space-x-2 text-red-600 mt-2">
                            <X className="h-4 w-4" />
                            <span className="text-sm">Upload failed. Please try again.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preset Logos */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Or choose a preset:</p>
                      <div className="grid grid-cols-4 gap-3">
                        {presetLogos.map((logoUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setTempSettings(prev => ({ ...prev, schoolLogo: logoUrl }))}
                            className={`relative group rounded-xl overflow-hidden border transition-all duration-200 ${
                              tempSettings.schoolLogo === logoUrl
                                ? 'border-blue-500 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            <img
                              src={logoUrl}
                              alt={`Preset ${index + 1}`}
                              className="w-full h-16 object-cover"
                            />
                            {tempSettings.schoolLogo === logoUrl && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                <div className="bg-blue-500 rounded-full p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Customization */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Palette className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Theme Customization</h3>
                </div>

                <div className="space-y-6">
                  {/* Custom Theme Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Custom Theme</h4>
                      <p className="text-sm text-gray-600">
                        Enable to use custom colors instead of automatic class-based themes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSettings.customTheme}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, customTheme: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Color Customization (only when custom theme is enabled) */}
                  {tempSettings.customTheme && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Primary Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={tempSettings.primaryColor}
                              onChange={(e) => setTempSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={tempSettings.primaryColor}
                              onChange={(e) => setTempSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              placeholder="#3B82F6"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        {/* Secondary Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secondary Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={tempSettings.secondaryColor}
                              onChange={(e) => setTempSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={tempSettings.secondaryColor}
                              onChange={(e) => setTempSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              placeholder="#2563EB"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        {/* Accent Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accent Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={tempSettings.accentColor}
                              onChange={(e) => setTempSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={tempSettings.accentColor}
                              onChange={(e) => setTempSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              placeholder="#60A5FA"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Color Preview */}
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                        <div className="flex space-x-3">
                          <div 
                            className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                            style={{ backgroundColor: tempSettings.primaryColor }}
                            title="Primary Color"
                          ></div>
                          <div 
                            className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                            style={{ backgroundColor: tempSettings.secondaryColor }}
                            title="Secondary Color"
                          ></div>
                          <div 
                            className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                            style={{ backgroundColor: tempSettings.accentColor }}
                            title="Accent Color"
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Class Theme Preview (when custom theme is disabled) */}
                  {!tempSettings.customTheme && (
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Automatic Class-Based Themes:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Lower Kindergarten (LKG)</span>
                          <div className="flex space-x-2">
                            <div className="w-6 h-6 rounded bg-emerald-500" title="Primary"></div>
                            <div className="w-6 h-6 rounded bg-green-600" title="Secondary"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Upper Kindergarten (UKG)</span>
                          <div className="flex space-x-2">
                            <div className="w-6 h-6 rounded bg-blue-500" title="Primary"></div>
                            <div className="w-6 h-6 rounded bg-indigo-600" title="Secondary"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Reception</span>
                          <div className="flex space-x-2">
                            <div className="w-6 h-6 rounded bg-purple-500" title="Primary"></div>
                            <div className="w-6 h-6 rounded bg-violet-600" title="Secondary"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Section */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Settings</h3>
                    <p className="text-sm text-gray-600">
                      Reset all settings to their default values. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset All</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <>
              {/* Category Management */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Palette className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Activity Categories</h3>
                  </div>
                  <button
                    onClick={handleResetCategories}
                    className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Add New Category */}
                <div className="bg-white rounded-lg border border-indigo-200 p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Category</h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        dir="ltr"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Category List */}
                <div className="bg-white rounded-lg border border-indigo-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Manage Categories</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop to reorder categories. Changes will affect how categories are displayed throughout the application.
                  </p>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {tempCategories.map((category, index) => (
                      <div 
                        key={category.name}
                        draggable
                        onDragStart={() => handleDragStart(category.name)}
                        onDragOver={(e) => handleDragOver(e, category.name)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-white border rounded-lg transition-all duration-200 ${
                          draggedCategory === category.name 
                            ? 'opacity-50 border-indigo-400 bg-indigo-50' 
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {editingCategory === category.name ? (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1 flex items-center space-x-2">
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index].name = e.target.value;
                                  setTempCategories(updatedCategories);
                                }}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                dir="ltr"
                              />
                              <input
                                type="color"
                                value={category.color}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index].color = e.target.value;
                                  setTempCategories(updatedCategories);
                                }}
                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              />
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="flex-1 font-medium text-gray-900" dir="ltr">{category.name}</div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setEditingCategory(category.name)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(index)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <>
              {/* Export Database */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Download className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Export Database</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Export all application data to a JSON file for backup or transfer to another device.
                </p>
                <button
                  onClick={handleExportDatabase}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Export All Data</span>
                </button>
              </div>

              {/* Import Database */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <UploadIcon className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Import Database</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Import application data from a previously exported JSON file.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    dir="ltr"
                  />
                  <button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <UploadIcon className="h-5 w-5" />
                    <span>Import Data</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Note: Importing data will overwrite your current data. Make sure to export your current data first if needed.
                </p>
              </div>

              {/* Clear Data */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <X className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Clear Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Clear all application data from your browser's local storage. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all application data? This cannot be undone.')) {
                      // Clear all application data
                      localStorage.removeItem('lesson-data-LKG');
                      localStorage.removeItem('lesson-data-UKG');
                      localStorage.removeItem('lesson-data-Reception');
                      localStorage.removeItem('lesson-plans');
                      localStorage.removeItem('library-activities');
                      
                      alert('All data has been cleared. The page will now reload.');
                      window.location.reload();
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'admin' && isAdmin && (
            <>
              {/* Admin Welcome */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Welcome, {user?.name}!</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You have full administrative access to manage the EYFS Lesson Builder system. 
                  Use the options below to configure data sources and manage content.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Admin Email:</span>
                      <span className="font-semibold text-blue-600">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Access Level:</span>
                      <span className="font-semibold text-green-600">Full Administrator</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Status */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Server className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Supabase Status</h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Supabase Connection:</span>
                    {serverStatus === 'checking' ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                        <span className="text-blue-600 font-medium">Checking...</span>
                      </div>
                    ) : serverStatus === 'online' ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-600 font-medium">Disconnected</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {serverStatus === 'offline' && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-700 font-medium mb-1">Supabase is disconnected</p>
                        <p className="text-sm text-yellow-600">
                          The application is currently using local storage for data. Connect to Supabase to enable cloud storage and synchronization.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {serverStatus === 'online' && (
                  <button
                    onClick={handleMigrateToServer}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Database className="h-5 w-5" />
                    <span>Migrate Local Data to Supabase</span>
                  </button>
                )}
              </div>

              {/* Excel File Upload */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Excel File Upload</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload an Excel file (.xlsx, .xls, .csv) to update your lesson data.
                </p>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploadStatus === 'uploading'}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-200"
                  />
                  
                  {uploadStatus === 'uploading' && (
                    <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">
                        {statusMessage || "Uploading and processing..."}
                      </span>
                    </div>
                  )}
                  
                  {uploadStatus === 'success' && (
                    <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 rounded-lg">
                      <Check className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {statusMessage || "Data updated successfully!"}
                      </span>
                    </div>
                  )}
                  
                  {uploadStatus === 'error' && (
                    <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {statusMessage || "Update failed. Please try again."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Refresh Data */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Refresh Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Refresh the application data to ensure you're viewing the latest content.
                </p>
                
                <button
                  onClick={handleRefreshData}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      <span>Refresh Data</span>
                    </>
                  )}
                </button>
              </div>

              {/* User Management */}
              <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Manage user access and permissions for the application.
                </p>
                
                <div className="bg-white rounded-lg p-4 border border-indigo-200 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current Users</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Administrator</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-medium text-gray-900 mb-2">Access Control</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configure who can access different parts of the application.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 hover:bg-indigo-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-gray-700">Admin Access</span>
                      </div>
                      <div className="text-sm text-green-600 font-medium">Enabled</div>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-indigo-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-gray-700">Content Editing</span>
                      </div>
                      <div className="text-sm text-green-600 font-medium">Enabled</div>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-indigo-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-gray-700">Data Management</span>
                      </div>
                      <div className="text-sm text-green-600 font-medium">Enabled</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear All Data */}
              <div className="border border-red-200 bg-red-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Clear All Local Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Clear all locally stored data including lessons, activities, units, and settings. This action cannot be undone.
                </p>
                
                <button
                  onClick={handleClearAllLocalData}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Clear All Local Data</span>
                </button>
                <p className="text-xs text-red-600 mt-2 text-center">
                  Warning: This will remove all your lessons, activities, units, and settings.
                </p>
              </div>

              {/* Current Configuration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-600 font-medium">Primary Data Source:</span>
                    <span className="font-semibold text-green-600">
                      {serverStatus === 'online' ? 'Supabase' : 'Local Storage (Fallback)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-600 font-medium">Authentication:</span>
                    <span className="font-semibold text-blue-600">EYFS Admin</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 md:col-span-2">
                    <span className="text-gray-600 font-medium">Last Updated:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}