import React, { useState, useEffect } from 'react';
import { Download, FileText, File, Loader2, ChevronDown, Check, X, List } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function ExportButtons() {
  const { currentSheetInfo, lessonNumbers } = useData();
  const [exportLoading, setExportLoading] = useState<string>('');
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);

  // Auto-close lesson selector when export is used
  useEffect(() => {
    if (exportLoading) {
      const timer = setTimeout(() => {
        setShowLessonSelector(false);
      }, 2500); // Close after export completes
      
      return () => clearTimeout(timer);
    }
  }, [exportLoading]);

  const handleExport = async (type: 'pdf' | 'doc', lessonNums?: string[]) => {
    const exportKey = lessonNums ? `${type}-selected` : `${type}-all`;
    setExportLoading(exportKey);

    try {
      // TODO: Implement actual export functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export time
      
      if (lessonNums && lessonNums.length > 0) {
        console.log(`Exporting lessons ${lessonNums.join(', ')} to ${type.toUpperCase()}`);
      } else {
        console.log(`Exporting all lessons to ${type.toUpperCase()}`);
      }
      
      alert(`Export to ${type.toUpperCase()} ${lessonNums ? `for lessons ${lessonNums.join(', ')}` : 'for all lessons'} would start here.`);
      
      // Clear selection after successful export
      if (lessonNums) {
        setSelectedLessons([]);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading('');
    }
  };

  const toggleLessonSelection = (lessonNum: string) => {
    setSelectedLessons(prev => 
      prev.includes(lessonNum) 
        ? prev.filter(l => l !== lessonNum)
        : [...prev, lessonNum]
    );
  };

  const selectAllLessons = () => {
    setSelectedLessons(lessonNumbers);
  };

  const clearSelection = () => {
    setSelectedLessons([]);
  };

  const ExportButton = ({ 
    type, 
    label, 
    icon: Icon, 
    onClick,
    variant = 'default',
    disabled = false
  }: { 
    type: 'pdf' | 'doc'; 
    label: string; 
    icon: any; 
    onClick: () => void;
    variant?: 'default' | 'compact';
    disabled?: boolean;
  }) => {
    const exportKey = `${type}-${label.includes('All') ? 'all' : 'selected'}`;
    const isLoading = exportLoading === exportKey;
    
    // All export buttons now use dark blue - same as Select Lessons button
    const colorClasses = 'bg-blue-900 hover:bg-blue-800 text-white disabled:bg-blue-400';
    
    if (variant === 'compact') {
      return (
        <button
          onClick={onClick}
          disabled={isLoading || !!exportLoading || disabled}
          className={`inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${colorClasses}`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          <span>{label}</span>
        </button>
      );
    }
    
    return (
      <button
        onClick={onClick}
        disabled={isLoading || !!exportLoading || disabled}
        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${colorClasses}`}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-visible">
      {/* Compact Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-500 to-teal-600 p-2 rounded-lg">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
              <p className="text-sm text-gray-600">
                {currentSheetInfo.display} lesson plans
              </p>
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="flex items-center space-x-3">
            {/* All Lessons Export - Now Dark Blue */}
            <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-2">
              <span className="text-sm font-medium text-blue-900">All Lessons:</span>
              <ExportButton 
                type="pdf" 
                label="PDF" 
                icon={FileText} 
                onClick={() => handleExport('pdf')}
                variant="compact"
              />
              <ExportButton 
                type="doc" 
                label="Doc" 
                icon={File} 
                onClick={() => handleExport('doc')}
                variant="compact"
              />
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* Selected Lessons Export */}
            <div className="flex items-center space-x-2 relative">
              <div className="relative">
                <button
                  onClick={() => setShowLessonSelector(!showLessonSelector)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <List className="h-4 w-4" />
                  <span>
                    {selectedLessons.length === 0 
                      ? 'Select Lessons' 
                      : `${selectedLessons.length} Selected`
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showLessonSelector ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Lesson Selector - Fixed z-index */}
                {showLessonSelector && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-blue-300 rounded-lg shadow-xl p-3 min-w-[280px] z-[60]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                      <span className="text-sm font-semibold text-blue-900">Choose Lessons</span>
                      <button
                        onClick={() => setShowLessonSelector(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Select All/Clear Controls */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={selectAllLessons}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors duration-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 hover:bg-gray-50 rounded transition-colors duration-200"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Lesson Checkboxes */}
                    <div className="grid grid-cols-3 gap-2 mb-4 max-h-32 overflow-y-auto">
                      {lessonNumbers.map((lessonNum) => (
                        <label
                          key={lessonNum}
                          className="flex items-center space-x-2 p-1 rounded hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedLessons.includes(lessonNum)}
                              onChange={() => toggleLessonSelection(lessonNum)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                              selectedLessons.includes(lessonNum)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}>
                              {selectedLessons.includes(lessonNum) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            L{lessonNum}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Export Buttons - Now Dark Blue */}
                    <div className="flex space-x-2 pt-2 border-t border-gray-200">
                      <ExportButton 
                        type="pdf" 
                        label="Export PDF" 
                        icon={FileText} 
                        onClick={() => handleExport('pdf', selectedLessons)}
                        variant="compact"
                        disabled={selectedLessons.length === 0}
                      />
                      <ExportButton 
                        type="doc" 
                        label="Export Doc" 
                        icon={File} 
                        onClick={() => handleExport('doc', selectedLessons)}
                        variant="compact"
                        disabled={selectedLessons.length === 0}
                      />
                    </div>

                    {selectedLessons.length === 0 && (
                      <p className="text-xs text-blue-600 mt-2 italic text-center">
                        Select lessons above to enable export
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Lessons Preview */}
        {selectedLessons.length > 0 && !showLessonSelector && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Selected for export:
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-2 py-1 hover:bg-blue-100 rounded transition-colors duration-200"
              >
                <X className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedLessons.sort((a, b) => parseInt(a) - parseInt(b)).map((lessonNum) => (
                <span
                  key={lessonNum}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full"
                >
                  <span>L{lessonNum}</span>
                  <button
                    onClick={() => toggleLessonSelection(lessonNum)}
                    className="hover:text-blue-900 p-0.5 hover:bg-blue-300 rounded-full transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}