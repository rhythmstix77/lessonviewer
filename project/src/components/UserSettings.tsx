import React, { useState } from 'react';
import { Settings, Upload, Palette, School, RotateCcw, X, Check, Image } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { settings, updateSettings, resetToDefaults } = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [logoUploadStatus, setLogoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Update temp settings when settings change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(tempSettings);
    onClose();
  };

  const handleCancel = () => {
    setTempSettings(settings);
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
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