import React, { useState } from 'react';
import { Settings, Upload, Link, RefreshCw, CheckCircle, AlertCircle, ExternalLink, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';

export function DataSourceSettings() {
  const { user } = useAuth();
  const { refreshData, uploadExcelFile, loading } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Check if user is admin - specifically Rob's email
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || 
                  user?.role === 'administrator';

  // Don't render the settings button if user is not admin
  if (!isAdmin) {
    return null;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('uploading');
      await uploadExcelFile(file);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleRefreshData = async () => {
    try {
      setUploadStatus('uploading');
      await refreshData();
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 hover:scale-105"
        title="Admin Settings - Data Source Management"
      >
        <Settings className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Admin Settings</h2>
              <p className="text-blue-100 text-sm">Data Source Management - {user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Admin Welcome */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Welcome, {user?.name}!</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You have full administrative access to manage the Rhythmstix Lesson Viewer system. 
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

          {/* Current Google Sheets Connection */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Connected Google Sheets</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your application is connected to the Google Sheets spreadsheet with different tabs for each class.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Rhythmstix Music Lesson Plans</p>
                    <p className="text-sm text-gray-600 break-all">ID: 1okYlUMh247SKXtdkot1swOs2BCYlZMEN-3E08-zit2U</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">• LKG Tab: GID 1944781789</p>
                      <p className="text-xs text-gray-500">• UKG Tab: GID 0</p>
                      <p className="text-xs text-gray-500">• Reception Tab: GID (to be configured)</p>
                    </div>
                  </div>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1okYlUMh247SKXtdkot1swOs2BCYlZMEN-3E08-zit2U/edit?gid=1944781789#gid=1944781789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Open in Google Sheets"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              <button
                onClick={handleRefreshData}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    <span>Refresh Data from Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Excel File Upload Alternative */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Alternative: Excel File Upload</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file (.xlsx, .xls, .csv) to override the current data source.
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
                  <span className="text-sm font-medium">Uploading and processing...</span>
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Data updated successfully!</span>
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Update failed. Please try again.</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Configuration */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium">Data Source:</span>
                <span className="font-semibold text-green-600">Google Sheets (Multi-Tab)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium">Authentication:</span>
                <span className="font-semibold text-blue-600">Rhythmstix Admin</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 md:col-span-2">
                <span className="text-gray-600 font-medium">Last Updated:</span>
                <span className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-700 font-medium mb-1">Data Fetching Method:</p>
                <p className="text-gray-600">CSV export from Google Sheets with class-specific tabs</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Class Data Sources:</p>
                <p className="text-gray-600">LKG, UKG, and Reception each have separate sheet tabs</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Update Frequency:</p>
                <p className="text-gray-600">Manual refresh or automatic on page load</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Supported File Formats:</p>
                <p className="text-gray-600">Excel (.xlsx, .xls), CSV (.csv)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}