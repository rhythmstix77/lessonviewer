import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Save, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';

interface EyfsStandardsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EyfsStandardsManager({ isOpen, onClose }: EyfsStandardsManagerProps) {
  const { user } = useAuth();
  const { allEyfsStatements, eyfsStatements, currentSheetInfo, updateAllEyfsStatements } = useData();
  const [standards, setStandards] = useState<Record<string, string[]>>({});
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [editingStandard, setEditingStandard] = useState<{area: string, index: number, value: string} | null>(null);
  const [newStandard, setNewStandard] = useState({area: '', value: ''});
  const [newArea, setNewArea] = useState('');
  const [showAddArea, setShowAddArea] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Check if user is admin
  const isAdmin = user?.email === 'admin@rhythmstix.co.uk' || 
                  user?.email === 'admin@example.com' || 
                  user?.role === 'administrator' ||
                  user?.role === 'admin' ||
                  user?.email === 'rob.reichstorer@gmail.com';

  // Don't render if user is not admin
  if (!isAdmin || !isOpen) {
    return null;
  }

  // Load standards from localStorage on mount
  useEffect(() => {
    const savedStandards = localStorage.getItem(`eyfs-standards-${currentSheetInfo.sheet}`);
    if (savedStandards) {
      setStandards(JSON.parse(savedStandards));
    } else {
      // Initialize with default standards
      const defaultStandards: Record<string, string[]> = {};
      
      // Group default standards by area
      allEyfsStatements.forEach(statement => {
        const parts = statement.split(':');
        const area = parts[0].trim();
        const detail = parts.length > 1 ? parts[1].trim() : statement;
        
        if (!defaultStandards[area]) {
          defaultStandards[area] = [];
        }
        
        defaultStandards[area].push(detail);
      });
      
      setStandards(defaultStandards);
      localStorage.setItem(`eyfs-standards-${currentSheetInfo.sheet}`, JSON.stringify(defaultStandards));
    }
  }, [allEyfsStatements, currentSheetInfo.sheet]);

  // Toggle expanded area
  const toggleArea = (area: string) => {
    setExpandedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  // Add new standard to an area
  const addStandard = () => {
    if (!newStandard.area || !newStandard.value.trim()) return;
    
    setStandards(prev => {
      const updated = { ...prev };
      if (!updated[newStandard.area]) {
        updated[newStandard.area] = [];
      }
      updated[newStandard.area].push(newStandard.value.trim());
      return updated;
    });
    
    setNewStandard({area: '', value: ''});
  };

  // Add new area
  const addArea = () => {
    if (!newArea.trim()) return;
    
    setStandards(prev => {
      const updated = { ...prev };
      if (!updated[newArea.trim()]) {
        updated[newArea.trim()] = [];
      }
      return updated;
    });
    
    setExpandedAreas(prev => [...prev, newArea.trim()]);
    setNewArea('');
    setShowAddArea(false);
  };

  // Update standard
  const updateStandard = () => {
    if (!editingStandard || !editingStandard.value.trim()) return;
    
    setStandards(prev => {
      const updated = { ...prev };
      if (updated[editingStandard.area] && updated[editingStandard.area][editingStandard.index]) {
        updated[editingStandard.area][editingStandard.index] = editingStandard.value.trim();
      }
      return updated;
    });
    
    setEditingStandard(null);
  };

  // Delete standard
  const deleteStandard = (area: string, index: number) => {
    setStandards(prev => {
      const updated = { ...prev };
      if (updated[area]) {
        updated[area] = updated[area].filter((_, i) => i !== index);
        
        // Remove area if empty
        if (updated[area].length === 0) {
          delete updated[area];
          setExpandedAreas(prev => prev.filter(a => a !== area));
        }
      }
      return updated;
    });
  };

  // Delete area
  const deleteArea = (area: string) => {
    if (confirm(`Are you sure you want to delete the "${area}" area and all its standards?`)) {
      setStandards(prev => {
        const updated = { ...prev };
        delete updated[area];
        return updated;
      });
      
      setExpandedAreas(prev => prev.filter(a => a !== area));
    }
  };

  // Save all standards
  const saveStandards = () => {
    try {
      setSaveStatus('saving');
      
      // Save to localStorage
      localStorage.setItem(`eyfs-standards-${currentSheetInfo.sheet}`, JSON.stringify(standards));
      
      // Create flat list of standards for the data context
      const flatStandards: string[] = [];
      Object.entries(standards).forEach(([area, details]) => {
        details.forEach(detail => {
          flatStandards.push(`${area}: ${detail}`);
        });
      });
      
      // Update the data context
      updateAllEyfsStatements(flatStandards);
      
      // Show success message
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (error) {
      console.error('Failed to save EYFS standards:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Export standards
  const exportStandards = () => {
    const data = {
      sheet: currentSheetInfo.sheet,
      standards: standards
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `eyfs-standards-${currentSheetInfo.sheet}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import standards
  const importStandards = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.standards) {
          setStandards(data.standards);
          alert('EYFS standards imported successfully.');
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Failed to import EYFS standards:', error);
        alert('Failed to import EYFS standards. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  };

  // Get usage count for a standard
  const getStandardUsage = (area: string, detail: string) => {
    const fullStandard = `${area}: ${detail}`;
    let count = 0;
    
    Object.values(eyfsStatements).forEach(statements => {
      if (statements.includes(fullStandard)) {
        count++;
      }
    });
    
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <Tag className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">EYFS Standards Manager</h2>
              <p className="text-blue-100 text-sm">
                {currentSheetInfo.display} • Manage EYFS standards for lesson plans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddArea(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Area</span>
              </button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importStandards}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </button>
              </div>
              
              <button
                onClick={exportStandards}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
            
            <div>
              <button
                onClick={saveStandards}
                disabled={saveStatus === 'saving'}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
              
              {saveStatus === 'success' && (
                <div className="mt-2 text-sm text-green-600 flex items-center justify-end space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Changes saved successfully</span>
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="mt-2 text-sm text-red-600 flex items-center justify-end space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to save changes</span>
                </div>
              )}
            </div>
          </div>

          {/* Add New Area Form */}
          {showAddArea && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Area</h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Enter new EYFS area name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addArea}
                  disabled={!newArea.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Add Area
                </button>
                <button
                  onClick={() => setShowAddArea(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add New Standard Form */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Standard</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                <select
                  value={newStandard.area}
                  onChange={(e) => setNewStandard(prev => ({ ...prev, area: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an area</option>
                  {Object.keys(standards).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newStandard.value}
                    onChange={(e) => setNewStandard(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter new EYFS standard"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={addStandard}
                    disabled={!newStandard.area || !newStandard.value.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EYFS Standards List */}
          <div className="space-y-6">
            {Object.keys(standards).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No EYFS Standards</h3>
                <p className="text-gray-600">
                  Add your first EYFS area and standards using the forms above.
                </p>
              </div>
            ) : (
              Object.entries(standards).map(([area, details]) => (
                <div key={area} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Area Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleArea(area)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors duration-200"
                      >
                        {expandedAreas.includes(area) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <h3 className="font-semibold text-gray-900">{area}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {details.length} standards
                      </span>
                    </div>
                    <button
                      onClick={() => deleteArea(area)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                      title="Delete Area"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Area Details */}
                  {expandedAreas.includes(area) && (
                    <div className="p-4 space-y-3">
                      {details.map((detail, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          {editingStandard && editingStandard.area === area && editingStandard.index === index ? (
                            <div className="flex-1 flex space-x-2">
                              <input
                                type="text"
                                value={editingStandard.value}
                                onChange={(e) => setEditingStandard(prev => prev ? { ...prev, value: e.target.value } : null)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                              <button
                                onClick={updateStandard}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingStandard(null)}
                                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors duration-200"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{detail}</p>
                                <div className="mt-1 flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    Used in {getStandardUsage(area, detail)} lessons
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-4">
                                <button
                                  onClick={() => setEditingStandard({area, index, value: detail})}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteStandard(area, index)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Usage Statistics */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>EYFS Standards Usage</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Total Standards</h4>
                <p className="text-2xl font-bold text-indigo-600">
                  {Object.values(standards).reduce((sum, details) => sum + details.length, 0)}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Areas</h4>
                <p className="text-2xl font-bold text-indigo-600">
                  {Object.keys(standards).length}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Lessons with EYFS</h4>
                <p className="text-2xl font-bold text-indigo-600">
                  {Object.values(eyfsStatements).filter(statements => statements.length > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={saveStandards}
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}