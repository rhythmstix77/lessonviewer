import React, { useState } from 'react';
import { Settings, Upload, Palette, School, RotateCcw, X, Check, Image, Download, Upload as UploadIcon, Plus, Trash2, GripVertical, Edit3, Save, Users, Pencil } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { DataSourceSettings } from './DataSourceSettings';
import { useAuth } from '../hooks/useAuth';
import type { YearGroup } from '../contexts/SettingsContext';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user } = useAuth();
  const { 
    settings, 
    categories, 
    customYearGroups,
    updateSettings, 
    updateCategories, 
    updateYearGroups,
    resetToDefaults, 
    resetCategoriesToDefaults,
    resetYearGroupsToDefaults
  } = useSettings();
  
  const [tempSettings, setTempSettings] = useState(settings);
  const [tempCategories, setTempCategories] = useState(categories);
  const [tempYearGroups, setTempYearGroups] = useState(customYearGroups);
  const [logoUploadStatus, setLogoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'appearance' | 'data' | 'categories' | 'admin' | 'year-groups'>('appearance');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [editingYearGroup, setEditingYearGroup] = useState<string | null>(null);
  const [newYearGroupId, setNewYearGroupId] = useState('');
  const [newYearGroupName, setNewYearGroupName] = useState('');
  const [newYearGroupColor, setNewYearGroupColor] = useState('#3B82F6');
  const [draggedYearGroup, setDraggedYearGroup] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || 
                  user?.role === 'administrator' ||
                  user?.email === 'admin@example.com';

  // Update temp settings when settings change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Update temp categories when categories change
  React.useEffect(() => {
    setTempCategories(categories);
  }, [categories]);
  
  // Update temp year groups when year groups change
  React.useEffect(() => {
    setTempYearGroups(customYearGroups);
  }, [customYearGroups]);

  const handleSave = () => {
    updateSettings(tempSettings);
    updateCategories(tempCategories);
    updateYearGroups(tempYearGroups);
    onClose();
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setTempCategories(categories);
    setTempYearGroups(customYearGroups);
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
    a.download = `curriculum-designer-data-export-${new Date().toISOString().split('T')[0]}.json`;
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
  
  // Year Group Management Functions
  const handleAddYearGroup = () => {
    if (!newYearGroupId.trim() || !newYearGroupName.trim()) return;
    
    // Check if year group already exists
    if (tempYearGroups.some(group => group.id.toLowerCase() === newYearGroupId.toLowerCase())) {
      alert('A year group with this ID already exists.');
      return;
    }
    
    // Add new year group
    setTempYearGroups([
      ...tempYearGroups,
      {
        id: newYearGroupId,
        name: newYearGroupName,
        color: newYearGroupColor
      }
    ]);
    
    // Reset form
    setNewYearGroupId('');
    setNewYearGroupName('');
    setNewYearGroupColor('#3B82F6');
  };
  
  const handleUpdateYearGroup = (index: number, id: string, name: string, color: string) => {
    const updatedYearGroups = [...tempYearGroups];
    updatedYearGroups[index] = { ...updatedYearGroups[index], id, name, color };
    setTempYearGroups(updatedYearGroups);
    setEditingYearGroup(null);
  };
  
  const handleDeleteYearGroup = (index: number) => {
    if (tempYearGroups.length <= 1) {
      alert('You must have at least one year group.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this year group? This may affect existing lessons.')) {
      const updatedYearGroups = tempYearGroups.filter((_, i) => i !== index);
      setTempYearGroups(updatedYearGroups);
    }
  };
  
  const handleYearGroupDragStart = (yearGroupId: string) => {
    setDraggedYearGroup(yearGroupId);
  };
  
  const handleYearGroupDragOver = (e: React.DragEvent, targetYearGroupId: string) => {
    e.preventDefault();
    if (!draggedYearGroup || draggedYearGroup === targetYearGroupId) return;
    
    const draggedIndex = tempYearGroups.findIndex(group => group.id === draggedYearGroup);
    const targetIndex = tempYearGroups.findIndex(group => group.id === targetYearGroupId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder year groups
    const newYearGroups = [...tempYearGroups];
    const [removed] = newYearGroups.splice(draggedIndex, 1);
    newYearGroups.splice(targetIndex, 0, removed);
    
    setTempYearGroups(newYearGroups);
  };
  
  const handleYearGroupDragEnd = () => {
    setDraggedYearGroup(null);
  };
  
  const handleResetYearGroups = () => {
    if (confirm('Are you sure you want to reset year groups to defaults? This cannot be undone.')) {
      resetYearGroupsToDefaults();
      setTempYearGroups(customYearGroups);
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
            onClick={() => setActiveTab('year-groups')}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'year-groups' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Year Groups
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
              Admin Settings
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
                        Automatic Year Group Themes:
                      </p>
                      <div className="space-y-3">
                        {tempYearGroups.map((yearGroup) => (
                          <div key={yearGroup.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{yearGroup.name}</span>
                            <div className="flex space-x-2">
                              <div 
                                className="w-6 h-6 rounded" 
                                style={{ backgroundColor: yearGroup.color || '#3B82F6' }} 
                                title="Primary"
                              ></div>
                            </div>
                          </div>
                        ))}
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

          {activeTab === 'year-groups' && (
            <>
              {/* Year Group Management */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Year Group Management</h3>
                  </div>
                  <button
                    onClick={handleResetYearGroups}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Add New Year Group */}
                <div className="bg-white rounded-lg border border-blue-200 p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Year Group</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID
                      </label>
                      <input
                        type="text"
                        value={newYearGroupId}
                        onChange={(e) => setNewYearGroupId(e.target.value)}
                        placeholder="e.g., Year1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Short identifier, no spaces
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={newYearGroupName}
                        onChange={(e) => setNewYearGroupName(e.target.value)}
                        placeholder="e.g., Year 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Full name shown in the interface
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={newYearGroupColor}
                          onChange={(e) => setNewYearGroupColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <button
                          onClick={handleAddYearGroup}
                          disabled={!newYearGroupId.trim() || !newYearGroupName.trim()}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Year Group List */}
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Manage Year Groups</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop to reorder year groups. Changes will affect how year groups are displayed throughout the application.
                  </p>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {tempYearGroups.map((yearGroup, index) => (
                      <div 
                        key={yearGroup.id}
                        draggable
                        onDragStart={() => handleYearGroupDragStart(yearGroup.id)}
                        onDragOver={(e) => handleYearGroupDragOver(e, yearGroup.id)}
                        onDragEnd={handleYearGroupDragEnd}
                        className={`p-3 bg-white border rounded-lg transition-all duration-200 ${
                          draggedYearGroup === yearGroup.id 
                            ? 'opacity-50 border-blue-400 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {editingYearGroup === yearGroup.id ? (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={yearGroup.id}
                                onChange={(e) => {
                                  const updatedYearGroups = [...tempYearGroups];
                                  updatedYearGroups[index].id = e.target.value;
                                  setTempYearGroups(updatedYearGroups);
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                dir="ltr"
                              />
                              <input
                                type="text"
                                value={yearGroup.name}
                                onChange={(e) => {
                                  const updatedYearGroups = [...tempYearGroups];
                                  updatedYearGroups[index].name = e.target.value;
                                  setTempYearGroups(updatedYearGroups);
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                dir="ltr"
                              />
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={yearGroup.color || '#3B82F6'}
                                  onChange={(e) => {
                                    const updatedYearGroups = [...tempYearGroups];
                                    updatedYearGroups[index].color = e.target.value;
                                    setTempYearGroups(updatedYearGroups);
                                  }}
                                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <button
                                  onClick={() => setEditingYearGroup(null)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                >
                                  <Save className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: yearGroup.color || '#3B82F6' }}
                            ></div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-gray-500">ID:</span>
                                <div className="font-medium text-gray-900" dir="ltr">{yearGroup.id}</div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Name:</span>
                                <div className="font-medium text-gray-900" dir="ltr">{yearGroup.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setEditingYearGroup(yearGroup.id)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteYearGroup(index)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                disabled={tempYearGroups.length <= 1}
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
              
              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Note</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Changing year group IDs may affect existing lessons and activities. It's recommended to:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      <li>Export your data before making significant changes</li>
                      <li>Add new year groups rather than modifying existing ones</li>
                      <li>Use consistent naming conventions for your year groups</li>
                    </ul>
                  </div>
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
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Admin Settings</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Access advanced settings for administrators only.
                </p>
                
                {/* Admin Settings Content */}
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <DataSourceSettings embedded={true} />
                </div>
              </div>
            </div>
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