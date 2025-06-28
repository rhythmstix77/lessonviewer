import React, { useState, useRef } from 'react';
import { X, Calendar, Eye, Save, Star, Clock, Search, Filter, Printer, Tag, Download, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface LessonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  halfTermId: string;
  halfTermName: string;
  halfTermMonths: string;
  halfTermColor: string;
  selectedLessons: string[];
  onSave: (lessons: string[], isComplete?: boolean) => void;
}

export function LessonSelectionModal({
  isOpen,
  onClose,
  halfTermId,
  halfTermName,
  halfTermMonths,
  halfTermColor,
  selectedLessons,
  onSave
}: LessonSelectionModalProps) {
  const { lessonNumbers, allLessonsData, currentSheetInfo } = useData();
  const [localSelectedLessons, setLocalSelectedLessons] = useState<string[]>(selectedLessons);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHalfTermView, setShowHalfTermView] = useState(false);
  const [orderedLessons, setOrderedLessons] = useState<string[]>(selectedLessons);
  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // Load completion status from localStorage
  React.useEffect(() => {
    const savedHalfTerms = localStorage.getItem('half-terms');
    if (savedHalfTerms) {
      try {
        const parsedHalfTerms = JSON.parse(savedHalfTerms);
        const halfTerm = parsedHalfTerms.find((term: any) => term.id === halfTermId);
        if (halfTerm) {
          setIsComplete(halfTerm.isComplete || false);
        }
      } catch (error) {
        console.error('Error parsing saved half-terms:', error);
      }
    }
  }, [halfTermId]);

  if (!isOpen) return null;

  // Filter lessons based on search
  const filteredLessons = lessonNumbers.filter(lessonNum => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) return false;
    
    if (searchQuery) {
      const matchesSearch = 
        lessonNum.includes(searchQuery) || 
        (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Object.values(lessonData.grouped).some(activities => 
          activities.some(activity => 
            activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Handle lesson selection
  const handleLessonSelection = (lessonNumber: string) => {
    setLocalSelectedLessons(prev => {
      if (prev.includes(lessonNumber)) {
        // Remove lesson if already selected
        return prev.filter(num => num !== lessonNumber);
      } else {
        // Add lesson if not selected
        return [...prev, lessonNumber];
      }
    });
  };

  // Handle save
  const handleSave = () => {
    onSave(showHalfTermView ? orderedLessons : localSelectedLessons, isComplete);
    onClose();
  };

  // Toggle completion status
  const toggleComplete = () => {
    setIsComplete(!isComplete);
  };

  // Handle lesson reordering
  const handleReorderLessons = (dragIndex: number, hoverIndex: number) => {
    const draggedLesson = orderedLessons[dragIndex];
    const newOrderedLessons = [...orderedLessons];
    newOrderedLessons.splice(dragIndex, 1);
    newOrderedLessons.splice(hoverIndex, 0, draggedLesson);
    setOrderedLessons(newOrderedLessons);
  };

  // Handle save and print
  const handleSaveAndPrint = () => {
    // Save first
    onSave(showHalfTermView ? orderedLessons : localSelectedLessons, isComplete);
    
    // Then print
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{ 
            background: `linear-gradient(135deg, ${halfTermColor} 0%, ${halfTermColor}99 100%)` 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{halfTermName} - {halfTermMonths}</h2>
              <p className="text-white text-opacity-90">
                {showHalfTermView 
                  ? `${orderedLessons.length} lessons in this half-term` 
                  : 'Select lessons for this half-term'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Mark Complete Checkbox */}
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium">Mark Complete</span>
                <button
                  onClick={toggleComplete}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isComplete 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white bg-opacity-50 text-transparent'
                  }`}
                >
                  {isComplete && <CheckCircle className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Save/Print Button */}
              {showHalfTermView && orderedLessons.length > 0 && (
                <button
                  onClick={handleSaveAndPrint}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  title="Save & Print Half-Term Plan"
                >
                  <Printer className="h-4 w-4" />
                  <span>Save / Print</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  if (showHalfTermView) {
                    setShowHalfTermView(false);
                  } else {
                    setShowHalfTermView(true);
                    setOrderedLessons([...localSelectedLessons]);
                  }
                }}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {showHalfTermView ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>View All Lessons</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Half-Term View</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showHalfTermView && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {showHalfTermView ? (
            /* Half-term view - ordered lessons */
            <div className="space-y-6">
              <div className={`border rounded-lg p-4 mb-6 ${
                isComplete 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className={`h-5 w-5 ${isComplete ? 'text-green-600' : 'text-blue-600'}`} />
                    <h3 className="font-medium text-gray-900">
                      {isComplete ? 'Half-Term Complete' : 'Half-Term In Progress'}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Drag and drop lessons to reorder them for this half-term
                </p>
              </div>

              {/* Printable content */}
              <div ref={previewRef} className="print-content">
                {orderedLessons.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons selected</h3>
                    <p className="text-gray-600">
                      Select lessons from the library to add to this half-term
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Print-only header */}
                    <div className="hidden print:block text-center border-b border-gray-200 pb-4 mb-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {currentSheetInfo.display} Half-Term Plan
                      </h1>
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        {halfTermName} - {halfTermMonths}
                      </h2>
                      <div className="text-gray-600 font-medium">
                        {orderedLessons.length} lessons
                      </div>
                      
                      {/* Page number */}
                      <div className="absolute top-0 right-0 text-xs text-gray-500">
                        Page <span className="pageNumber"></span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-2">
                      {orderedLessons.map((lessonNum, index) => {
                        const lessonData = allLessonsData[lessonNum];
                        if (!lessonData) return null;
                        
                        return (
                          <div 
                            key={lessonNum} 
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4 print-activity"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', index.toString());
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                              handleReorderLessons(dragIndex, index);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">Lesson {lessonNum}</h4>
                              <div className="flex items-center print:hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newOrderedLessons = [...orderedLessons];
                                    newOrderedLessons.splice(index, 1);
                                    setOrderedLessons(newOrderedLessons);
                                    setLocalSelectedLessons(prev => prev.filter(num => num !== lessonNum));
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${lessonNum}`}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                              <Clock className="h-3 w-3" />
                              <span>{lessonData.totalTime} mins</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {lessonData.categoryOrder.slice(0, 2).map(category => (
                                <span 
                                  key={category}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                  {category}
                                </span>
                              ))}
                              {lessonData.categoryOrder.length > 2 && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{lessonData.categoryOrder.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Print-only footer */}
                    <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                      <p>Curriculum Designer - {currentSheetInfo.display} - {halfTermName}</p>
                      <p className="pageNumber">Page 1</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Lesson selection view */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Select Lessons for {halfTermName}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Click on lessons to select them for this half-term. Selected lessons will be marked with a star.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLessons.map(lessonNum => {
                  const lessonData = allLessonsData[lessonNum];
                  if (!lessonData) return null;
                  
                  const isSelected = localSelectedLessons.includes(lessonNum);
                  
                  return (
                    <div 
                      key={lessonNum}
                      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200 relative ${
                        isSelected 
                          ? 'border-yellow-500 bg-yellow-50 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => handleLessonSelection(lessonNum)}
                    >
                      {/* Star icon for selection */}
                      <div className="absolute top-2 right-2">
                        <Star className={`h-5 w-5 ${isSelected ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                      </div>
                      <div className="pr-6">
                        <h4 className="font-semibold text-gray-900 mb-1">Lesson {lessonNum}</h4>
                        <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${lessonNum}`}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{lessonData.totalTime} mins</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {lessonData.categoryOrder.slice(0, 3).map(category => (
                            <span 
                              key={category}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                          {lessonData.categoryOrder.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{lessonData.categoryOrder.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              {showHalfTermView 
                ? `${orderedLessons.length} lessons in order` 
                : `${localSelectedLessons.length} lessons selected`}
            </span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save {showHalfTermView ? 'Order' : 'Selection'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}