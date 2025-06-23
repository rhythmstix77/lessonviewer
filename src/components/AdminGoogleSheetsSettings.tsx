import React from 'react';
import { X } from 'lucide-react';

interface AdminGoogleSheetsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminGoogleSheetsSettings({ isOpen, onClose }: AdminGoogleSheetsSettingsProps) {
  // This component is now deprecated as Google Sheets integration has been removed
  // We'll show a message to the user that this feature is no longer available
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Google Sheets Configuration</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Google Sheets integration has been removed from this application. 
              Please use the Excel file upload feature in the Admin Settings panel instead.
            </p>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            The application now uses local storage to manage lesson data. You can:
          </p>
          
          <ul className="list-disc pl-5 text-sm text-gray-600 mb-4 space-y-2">
            <li>Upload Excel (.xlsx, .xls) or CSV files directly</li>
            <li>Manage all lesson data through the admin interface</li>
            <li>Export and import data as needed</li>
          </ul>
        </div>
        
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}