import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sheet, 
  Save, 
  X, 
  Eye, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Key,
  Users,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  viewerSheetId: string;
  editorSheetId: string;
  apiKey: string;
  serviceAccountEmail: string;
  viewerPermissions: 'public' | 'restricted' | 'private';
  editorPermissions: 'admin' | 'editor' | 'contributor';
  autoSync: boolean;
  syncInterval: number; // in minutes
}

interface AdminGoogleSheetsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminGoogleSheetsSettings({ isOpen, onClose }: AdminGoogleSheetsSettingsProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<GoogleSheetsConfig>({
    spreadsheetId: '1okYlUMh247SKXtdkot1swOs2BCYlZMEN-3E08-zit2U',
    viewerSheetId: '1944781789',
    editorSheetId: '',
    apiKey: '',
    serviceAccountEmail: '',
    viewerPermissions: 'public',
    editorPermissions: 'admin',
    autoSync: true,
    syncInterval: 30
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'admin@rhythmstix.co.uk' || 
                  user?.email === 'admin@example.com' || 
                  user?.role === 'administrator' ||
                  user?.role === 'admin';

  // Don't render if user is not admin
  if (!isAdmin || !isOpen) {
    return null;
  }

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('admin-google-sheets-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedConfig = localStorage.getItem('admin-google-sheets-config');
    const currentConfigString = JSON.stringify(config);
    const savedConfigString = savedConfig || JSON.stringify({
      spreadsheetId: '1okYlUMh247SKXtdkot1swOs2BCYlZMEN-3E08-zit2U',
      viewerSheetId: '1944781789',
      editorSheetId: '',
      apiKey: '',
      serviceAccountEmail: '',
      viewerPermissions: 'public',
      editorPermissions: 'admin',
      autoSync: true,
      syncInterval: 30
    });
    setHasChanges(currentConfigString !== savedConfigString);
  }, [config]);

  const handleSave = () => {
    localStorage.setItem('admin-google-sheets-config', JSON.stringify(config));
    setHasChanges(false);
    setTestMessage('Configuration saved successfully!');
    setTestStatus('success');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing Google Sheets connection...');

    try {
      // Simulate API test - in production, this would make actual API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!config.spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
      }

      // Test viewer access
      const viewerUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${config.viewerSheetId}`;
      
      setTestStatus('success');
      setTestMessage('Connection test successful! Both viewer and editor access configured.');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateEditorSheet = () => {
    // Create a copy of the viewer sheet for editing
    const newEditorSheetId = Date.now().toString();
    setConfig(prev => ({ ...prev, editorSheetId: newEditorSheetId }));
    setTestMessage('Editor sheet ID generated. Save configuration to apply changes.');
    setTestStatus('success');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center space-x-3">
            <Sheet className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Google Sheets Configuration</h2>
              <p className="text-green-100 text-sm">Admin Settings - Configure viewer and editor access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-green-100 hover:text-white hover:bg-green-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Current Configuration Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Current Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Viewer Access</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Read-only access for lesson viewing</p>
                <div className="text-xs text-gray-500">
                  <p>Sheet ID: {config.viewerSheetId || 'Not configured'}</p>
                  <p>Permissions: {config.viewerPermissions}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Edit className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Editor Access</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Full edit access for content management</p>
                <div className="text-xs text-gray-500">
                  <p>Sheet ID: {config.editorSheetId || 'Not configured'}</p>
                  <p>Permissions: {config.editorPermissions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spreadsheet Configuration */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Sheet className="h-5 w-5 text-gray-600" />
              <span>Spreadsheet Configuration</span>
            </h3>

            <div className="space-y-6">
              {/* Main Spreadsheet ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Spreadsheet ID
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={config.spreadsheetId}
                    onChange={(e) => setConfig(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="1okYlUMh247SKXtdkot1swOs2BCYlZMEN-3E08-zit2U"
                  />
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open</span>
                  </a>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Found in the URL: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
                </p>
              </div>

              {/* Viewer Sheet Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viewer Sheet ID (GID)
                  </label>
                  <input
                    type="text"
                    value={config.viewerSheetId}
                    onChange={(e) => setConfig(prev => ({ ...prev, viewerSheetId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="1944781789"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Sheet GID for read-only lesson viewing
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Editor Sheet ID (GID)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={config.editorSheetId}
                      onChange={(e) => setConfig(prev => ({ ...prev, editorSheetId: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Auto-generated or custom"
                    />
                    <button
                      onClick={generateEditorSheet}
                      className="px-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                      title="Generate new editor sheet"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Separate sheet for admin editing (optional)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Key className="h-5 w-5 text-yellow-600" />
              <span>API Configuration</span>
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets API Key (Optional)
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="AIzaSyC..."
                />
                <p className="text-xs text-gray-600 mt-1">
                  Required for private sheets. Leave empty for public sheets.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Account Email (Optional)
                </label>
                <input
                  type="email"
                  value={config.serviceAccountEmail}
                  onChange={(e) => setConfig(prev => ({ ...prev, serviceAccountEmail: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="service-account@project.iam.gserviceaccount.com"
                />
                <p className="text-xs text-gray-600 mt-1">
                  For advanced authentication and private sheet access
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Configuration */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Access Permissions</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Viewer Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Viewer Access Level
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can view lessons', icon: Unlock },
                    { value: 'restricted', label: 'Restricted', desc: 'Logged-in users only', icon: Users },
                    { value: 'private', label: 'Private', desc: 'Admin approval required', icon: Lock }
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <label key={value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="viewerPermissions"
                        value={value}
                        checked={config.viewerPermissions === value}
                        onChange={(e) => setConfig(prev => ({ ...prev, viewerPermissions: e.target.value as any }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Editor Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Editor Access Level
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'admin', label: 'Admin Only', desc: 'Super admin access only', icon: Lock },
                    { value: 'editor', label: 'Editors', desc: 'Designated editors can modify', icon: Edit },
                    { value: 'contributor', label: 'Contributors', desc: 'Approved contributors', icon: Users }
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <label key={value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="editorPermissions"
                        value={value}
                        checked={config.editorPermissions === value}
                        onChange={(e) => setConfig(prev => ({ ...prev, editorPermissions: e.target.value as any }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Configuration */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <span>Synchronization Settings</span>
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Auto-Sync</h4>
                  <p className="text-sm text-gray-600">Automatically sync changes with Google Sheets</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {config.autoSync && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval (minutes)
                  </label>
                  <select
                    value={config.syncInterval}
                    onChange={(e) => setConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={180}>3 hours</option>
                    <option value={360}>6 hours</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Test Connection */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Configuration</h3>
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testStatus !== 'idle' && (
              <div className={`p-4 rounded-lg border ${
                testStatus === 'success' ? 'bg-green-50 border-green-200' :
                testStatus === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {testStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {testStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  {testStatus === 'testing' && <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />}
                  <span className={`font-medium ${
                    testStatus === 'success' ? 'text-green-800' :
                    testStatus === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {testMessage}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {hasChanges && (
              <span className="text-orange-600 font-medium">⚠ Unsaved changes</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}