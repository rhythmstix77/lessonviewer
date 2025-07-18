import React, { useState } from 'react';
import { Menu, X, User, LogOut, BookOpen, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserSettings } from './UserSettings';

export function Header() {
  const { user, logout } = useAuth();
  const { currentSheetInfo, setCurrentSheetInfo, refreshData, loading } = useData();
  const { settings, getThemeForClass } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sheetOptions = [
    { sheet: 'LKG', display: 'Lower Kindergarten', eyfs: 'LKG Statements' },
    { sheet: 'UKG', display: 'Upper Kindergarten', eyfs: 'UKG Statements' },
    { sheet: 'Reception', display: 'Reception', eyfs: 'Reception Statements' }
  ];

  const handleSheetChange = (sheetInfo: typeof currentSheetInfo) => {
    setCurrentSheetInfo(sheetInfo);
    setMobileMenuOpen(false);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Rhythmstix Logo and Title */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="flex-shrink-0">
                <img
                  src="/RLOGO copy copy.png"
                  alt="Rhythmstix"
                  className="h-10 w-10 object-cover rounded-lg border border-blue-200 shadow-sm"
                  onError={(e) => {
                    // Fallback to BookOpen icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="h-10 w-10 p-2 rounded-lg shadow-md border border-blue-200 hidden bg-gradient-to-br from-blue-500 to-blue-600">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-black leading-tight">
                  Rhythmstix Lesson Viewer
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
              {/* Sheet Selector */}
              <div className="relative min-w-0">
                <select
                  value={currentSheetInfo.sheet}
                  onChange={(e) => {
                    const selected = sheetOptions.find(opt => opt.sheet === e.target.value);
                    if (selected) handleSheetChange(selected);
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:border-2 block w-full p-2.5 pr-8 appearance-none cursor-pointer transition-colors duration-200 hover:bg-gray-100 min-w-[180px]"
                  style={{ 
                    focusRingColor: theme.primary,
                    focusBorderColor: theme.primary 
                  }}
                >
                  {sheetOptions.map((option) => (
                    <option key={option.sheet} value={option.sheet}>
                      {option.display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="User Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-4">
                {/* Sheet Selector Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Age Group
                  </label>
                  <select
                    value={currentSheetInfo.sheet}
                    onChange={(e) => {
                      const selected = sheetOptions.find(opt => opt.sheet === e.target.value);
                      if (selected) handleSheetChange(selected);
                    }}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:border-2 block p-2.5"
                    style={{ 
                      focusRingColor: theme.primary,
                      focusBorderColor: theme.primary 
                    }}
                  >
                    {sheetOptions.map((option) => (
                      <option key={option.sheet} value={option.sheet}>
                        {option.display}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Info Mobile */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {user?.name}
                    </span>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSettingsOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={logout}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* User Settings Modal */}
      <UserSettings 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>
  );
}