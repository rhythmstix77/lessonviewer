import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreVertical, 
  ChevronLeft, 
  Clock, 
  BookOpen, 
  Calendar, 
  Tag, 
  X,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Star,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react';
import { UnitCard } from './UnitCard';
import { LessonLibraryCard } from './LessonLibraryCard';
import { ActivityDetails } from './ActivityDetails';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonExporter } from './LessonExporter';
import { LessonDetailsModal } from './LessonDetailsModal';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Activity } from '../contexts/DataContext';

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HalfTerm {
  id: string;
  name: string;
  months: string;
  color: string;
  lessons: string[];
}

// Map term IDs to readable names
const TERM_NAMES: Record<string, string> = {
  'A1': 'Autumn 1 (Sep-Oct)',
  'A2': 'Autumn 2 (Nov-Dec)',
  'SP1': 'Spring 1 (Jan-Feb)',
  'SP2': 'Spring 2 (Mar-Apr)',
  'SM1': 'Summer 1 (Apr-May)',
  'SM2': 'Summer 2 (Jun-Jul)',
};

// Define half-term periods with colors
const HALF_TERMS: HalfTerm[] = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', color: '#F59E0B', lessons: [] },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', color: '#EA580C', lessons: [] },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', color: '#10B981', lessons: [] },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr', color: '#16A34A', lessons: [] },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May', color: '#6366F1', lessons: [] },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', color: '#8B5CF6', lessons: [] },
];

export function UnitViewer() {
  const { currentSheetInfo, allLessonsData, lessonNumbers } = useData();
  const { getThemeForClass } = useSettings();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLessonForExport, setSelectedLessonForExport] = useState<string | null>(null);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  const [focusedHalfTermId, setFocusedHalfTermId] = useState<string | null>(null);
  const [halfTerms, setHalfTerms] = useState<HalfTerm[]>(HALF_TERMS);
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<HalfTerm | null>(null);
  const [showLessonSelectionModal, setShowLessonSelectionModal] = useState(false);
  const [showHalfTermView, setShowHalfTermView] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [orderedLessons, setOrderedLessons] = useState<string[]>([]);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Load units and half-term data from localStorage
  useEffect(() => {
    // Load units
    const savedUnits = localStorage.getItem('units');
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits).map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt),
        }));
        setUnits(parsedUnits);
      } catch (error) {
        console.error('Error parsing saved units:', error);
        setUnits([]);
      }
    } else {
      // Initialize with an empty array
      setUnits([]);
      localStorage.setItem('units', JSON.stringify([]));
    }

    // Load half-term data
    const savedHalfTerms = localStorage.getItem('half-terms');
    if (savedHalfTerms) {
      try {
        const parsedHalfTerms = JSON.parse(savedHalfTerms);
        // Merge with default half-terms to ensure all properties exist
        const mergedHalfTerms = HALF_TERMS.map(defaultTerm => {
          const savedTerm = parsedHalfTerms.find((t: HalfTerm) => t.id === defaultTerm.id);
          return savedTerm ? { ...defaultTerm, ...savedTerm } : defaultTerm;
        });
        setHalfTerms(mergedHalfTerms);
      } catch (error) {
        console.error('Error parsing saved half-terms:', error);
        setHalfTerms(HALF_TERMS);
      }
    } else {
      // Initialize with default half-terms
      setHalfTerms(HALF_TERMS);
      localStorage.setItem('half-terms', JSON.stringify(HALF_TERMS));
    }
  }, []);

  // Filter units based on search, term, and focused half-term
  const filteredUnits = React.useMemo(() => {
    let filtered = units.filter(unit => {
      const matchesSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           unit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If we have a focused half-term, only show units from that term
      if (focusedHalfTermId) {
        return matchesSearch && unit.term === focusedHalfTermId;
      }
      
      // Otherwise use the selected term filter
      const matchesTerm = selectedTerm === 'all' || unit.term === selectedTerm;
      return matchesSearch && matchesTerm;
    });
    
    return filtered;
  }, [units, searchQuery, selectedTerm, focusedHalfTermId]);

  // Group units by half-term
  const unitsByHalfTerm = React.useMemo(() => {
    const grouped: Record<string, Unit[]> = {};
    
    // Initialize all half-terms with empty arrays
    Object.keys(TERM_NAMES).forEach(termId => {
      grouped[termId] = [];
    });
    
    // Group units by term
    units.forEach(unit => {
      if (unit.term) {
        if (!grouped[unit.term]) {
          grouped[unit.term] = [];
        }
        grouped[unit.term].push(unit);
      } else {
        // If no term is specified, put in Autumn 1 by default
        if (!grouped['A1']) {
          grouped['A1'] = [];
        }
        grouped['A1'].push(unit);
      }
    });
    
    return grouped;
  }, [units]);

  // Handle unit selection
  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
  };

  // Handle back button click
  const handleBackToUnits = () => {
    setSelectedUnit(null);
  };

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Handle lesson export
  const handleLessonExport = (lessonNumber: string) => {
    setSelectedLessonForExport(lessonNumber);
  };

  // Handle lesson details
  const handleLessonDetails = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
  };

  // Handle focusing on a specific half-term
  const handleFocusHalfTerm = (termId: string) => {
    setFocusedHalfTermId(termId === focusedHalfTermId ? null : termId);
    // Reset the term filter when focusing on a specific half-term
    setSelectedTerm('all');
  };

  // Create a new unit
  const handleCreateUnit = () => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: 'New Unit',
      description: 'Add a description for this unit',
      lessonNumbers: [],
      color: getRandomColor(),
      term: 'A1', // Default to Autumn 1
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
    localStorage.setItem('units', JSON.stringify(updatedUnits));
    
    // Select the new unit
    setSelectedUnit(newUnit);
  };

  // Handle half-term card click
  const handleHalfTermClick = (halfTerm: HalfTerm) => {
    setSelectedHalfTerm(halfTerm);
    setSelectedLessons(halfTerm.lessons || []);
    setOrderedLessons(halfTerm.lessons || []);
    setShowLessonSelectionModal(true);
    setShowHalfTermView(false);
  };

  // Handle lesson selection in modal
  const handleLessonSelection = (lessonNumber: string) => {
    setSelectedLessons(prev => {
      if (prev.includes(lessonNumber)) {
        // Remove lesson if already selected
        return prev.filter(num => num !== lessonNumber);
      } else {
        // Add lesson if not selected
        return [...prev, lessonNumber];
      }
    });
  };

  // Save selected lessons to half-term
  const handleSaveLessonsToHalfTerm = () => {
    if (!selectedHalfTerm) return;

    // Update the half-term with selected lessons
    const updatedHalfTerms = halfTerms.map(term => {
      if (term.id === selectedHalfTerm.id) {
        return {
          ...term,
          lessons: showHalfTermView ? orderedLessons : selectedLessons
        };
      }
      return term;
    });

    setHalfTerms(updatedHalfTerms);
    localStorage.setItem('half-terms', JSON.stringify(updatedHalfTerms));
    setShowLessonSelectionModal(false);
  };

  // Handle lesson reordering in half-term view
  const handleReorderLessons = (dragIndex: number, hoverIndex: number) => {
    const draggedLesson = orderedLessons[dragIndex];
    const newOrderedLessons = [...orderedLessons];
    newOrderedLessons.splice(dragIndex, 1);
    newOrderedLessons.splice(hoverIndex, 0, draggedLesson);
    setOrderedLessons(newOrderedLessons);
  };

  // Generate a random color for new units
  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // Blue
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#EF4444', // Red
      '#F97316', // Orange
      '#14B8A6', // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle lesson click in the modal
  const handleLessonClick = (lessonNumber: string) => {
    // Show the lesson details modal
    setSelectedLessonForDetails(lessonNumber);
  };

  // If a unit is selected, show its details
  if (selectedUnit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unit Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div 
              className="p-6 text-white relative"
              style={{ 
                background: `linear-gradient(135deg, ${selectedUnit.color || theme.primary} 0%, ${theme.secondary} 100%)` 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={handleBackToUnits}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
                      title="Back to all units"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold">{selectedUnit.name}</h1>
                  </div>
                  <div className="flex items-center space-x-4 text-white text-opacity-90">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-medium">{selectedUnit.lessonNumbers.length} lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">{TERM_NAMES[selectedUnit.term || 'A1'] || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Edit Unit"
                  >
                    <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Edit Unit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Description */}
          {selectedUnit.description && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Unit Description</h2>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedUnit.description }}
              />
            </div>
          )}

          {/* Lessons in this Unit */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lessons in this Unit</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedUnit.lessonNumbers.map(lessonNumber => {
                const lessonData = allLessonsData[lessonNumber];
                if (!lessonData) return null;
                
                return (
                  <div key={lessonNumber} className="relative group">
                    <LessonLibraryCard
                      lessonNumber={lessonNumber}
                      lessonData={lessonData}
                      viewMode="grid"
                      onClick={() => handleLessonDetails(lessonNumber)}
                      theme={theme}
                    />
                    
                    {/* Overlay buttons that appear on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLessonExport(lessonNumber);
                        }}
                        className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-sm text-gray-700 hover:text-gray-900"
                        title="Export Lesson"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back to Units Button */}
          <div className="text-center">
            <button
              onClick={handleBackToUnits}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to All Units</span>
            </button>
          </div>
        </div>

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}

        {/* Lesson Exporter */}
        {selectedLessonForExport && (
          <LessonExporter
            lessonNumber={selectedLessonForExport}
            onClose={() => setSelectedLessonForExport(null)}
          />
        )}

        {/* Lesson Details Modal */}
        {selectedLessonForDetails && (
          <LessonDetailsModal
            lessonNumber={selectedLessonForDetails}
            onClose={() => setSelectedLessonForDetails(null)}
            theme={theme}
            onExport={() => {
              setSelectedLessonForExport(selectedLessonForDetails);
              setSelectedLessonForDetails(null);
            }}
          />
        )}
      </div>
    );
  }

  // Default view - half-term cards
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-bold">Academic Year Planner</h2>
                    <p className="text-indigo-100 text-sm">
                      Organize lessons by half-term periods
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCreateUnit}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Unit</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-300" />
                  <input
                    type="text"
                    placeholder="Search units or lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-indigo-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                    dir="ltr"
                  />
                </div>
                
                <select
                  value={selectedTerm}
                  onChange={(e) => {
                    setSelectedTerm(e.target.value);
                    // Clear focused half-term when changing the term filter
                    setFocusedHalfTermId(null);
                  }}
                  className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                  dir="ltr"
                  disabled={!!focusedHalfTermId}
                >
                  <option value="all" className="text-gray-900">All Terms</option>
                  {Object.entries(TERM_NAMES).map(([id, name]) => (
                    <option key={id} value={id} className="text-gray-900">
                      {name}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center justify-end">
                  {focusedHalfTermId ? (
                    <button
                      onClick={() => setFocusedHalfTermId(null)}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <EyeOff className="h-4 w-4" />
                      <span>Show All Half-Terms</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {}}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Filter className="h-4 w-4" />
                      <span>More Filters</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Half-Term Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {halfTerms.map((halfTerm) => {
              const hasLessons = halfTerm.lessons && halfTerm.lessons.length > 0;
              
              return (
                <div 
                  key={halfTerm.id}
                  className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer ${
                    hasLessons ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleHalfTermClick(halfTerm)}
                >
                  {/* Colorful Header */}
                  <div 
                    className="p-6 text-white relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${halfTerm.color} 0%, ${halfTerm.color}99 100%)` 
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold">
                          {halfTerm.name}
                        </h3>
                        <ChevronRight className="h-6 w-6 transition-transform duration-300" />
                      </div>
                      
                      <p className="text-white text-opacity-90 text-sm font-medium">
                        {halfTerm.months}
                      </p>

                      <div className="flex items-center space-x-6 text-white text-opacity-90 mt-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5" />
                          <span className="font-medium">
                            {hasLessons ? `${halfTerm.lessons.length} lessons` : 'No lessons assigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview of Lessons */}
                  {hasLessons && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {halfTerm.lessons.slice(0, 5).map(lessonNum => (
                          <span 
                            key={lessonNum}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                          >
                            L{lessonNum}
                          </span>
                        ))}
                        {halfTerm.lessons.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            +{halfTerm.lessons.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Units Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Units</h2>
            
            {filteredUnits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
                <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedTerm !== 'all' || focusedHalfTermId
                    ? 'Try adjusting your search or filters'
                    : 'No units available in the library. Create a new unit to get started.'
                  }
                </p>
                {(searchQuery || selectedTerm !== 'all' || focusedHalfTermId) && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTerm('all');
                      setFocusedHalfTermId(null);
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                  >
                    Clear Filters
                  </button>
                )}
                {!searchQuery && selectedTerm === 'all' && !focusedHalfTermId && (
                  <button 
                    onClick={handleCreateUnit}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create First Unit</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUnits.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    viewMode="grid"
                    onClick={() => handleUnitSelect(unit)}
                    theme={theme}
                    onFocusHalfTerm={handleFocusHalfTerm}
                    isFocused={focusedHalfTermId === unit.term}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lesson Selection Modal */}
        {showLessonSelectionModal && selectedHalfTerm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div 
                className="p-6 text-white relative"
                style={{ 
                  background: `linear-gradient(135deg, ${selectedHalfTerm.color} 0%, ${selectedHalfTerm.color}99 100%)` 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedHalfTerm.name} - {selectedHalfTerm.months}</h2>
                    <p className="text-white text-opacity-90">
                      {showHalfTermView 
                        ? `${orderedLessons.length} lessons in this half-term` 
                        : 'Select lessons for this half-term'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        if (showHalfTermView) {
                          setShowHalfTermView(false);
                        } else {
                          setShowHalfTermView(true);
                          setOrderedLessons([...selectedLessons]);
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
                      onClick={() => setShowLessonSelectionModal(false)}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {showHalfTermView ? (
                  /* Half-term view - ordered lessons */
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-green-600" />
                          <h3 className="font-medium text-gray-900">Half-Term Complete</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                          >
                            <Printer className="h-4 w-4" />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Drag and drop lessons to reorder them for this half-term
                      </p>
                    </div>

                    {orderedLessons.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons selected</h3>
                        <p className="text-gray-600">
                          Select lessons from the library to add to this half-term
                        </p>
                      </div>
                    ) : (
                      <div className="flex overflow-x-auto pb-4 space-x-4">
                        {orderedLessons.map((lessonNum, index) => {
                          const lessonData = allLessonsData[lessonNum];
                          if (!lessonData) return null;
                          
                          return (
                            <div 
                              key={lessonNum} 
                              className="flex-shrink-0 w-64"
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
                              <div 
                                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 h-full flex flex-col cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                                onClick={() => handleLessonClick(lessonNum)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900">Lesson {lessonNum}</h4>
                                  <div className="flex items-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        const newOrderedLessons = [...orderedLessons];
                                        newOrderedLessons.splice(index, 1);
                                        setOrderedLessons(newOrderedLessons);
                                        setSelectedLessons(prev => prev.filter(num => num !== lessonNum));
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
                                <div className="flex flex-wrap gap-1 mt-auto">
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
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      handleLessonClick(lessonNum);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <div className="flex items-center space-x-1">
                                    {index > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent card click
                                          handleReorderLessons(index, index - 1);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                      >
                                        <ArrowLeft className="h-3 w-3" />
                                      </button>
                                    )}
                                    {index < orderedLessons.length - 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent card click
                                          handleReorderLessons(index, index + 1);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                      >
                                        <ArrowRight className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Lesson selection view */
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">Select Lessons for {selectedHalfTerm.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Click on lessons to select them for this half-term. Selected lessons will be marked with a star.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Filter lessons to only show those assigned to this half-term */}
                      {lessonNumbers
                        .filter(lessonNum => {
                          // Check if this lesson has been assigned to any half-term
                          const isAssignedToAnyHalfTerm = halfTerms.some(term => 
                            term.id !== selectedHalfTerm.id && // Not the current half-term
                            term.lessons && 
                            term.lessons.includes(lessonNum)
                          );
                          
                          // If it's already assigned to this half-term or not assigned to any other half-term, show it
                          return selectedLessons.includes(lessonNum) || !isAssignedToAnyHalfTerm;
                        })
                        .map(lessonNum => {
                          const lessonData = allLessonsData[lessonNum];
                          if (!lessonData) return null;
                          
                          const isSelected = selectedLessons.includes(lessonNum);
                          
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
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                </div>
                              )}
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
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent toggling selection
                                      handleLessonClick(lessonNum);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>View Details</span>
                                  </button>
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
                      : `${selectedLessons.length} lessons selected`}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLessonSelectionModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLessonsToHalfTerm}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save {showHalfTermView ? 'Order' : 'Selection'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}

        {/* Lesson Exporter */}
        {selectedLessonForExport && (
          <LessonExporter
            lessonNumber={selectedLessonForExport}
            onClose={() => setSelectedLessonForExport(null)}
          />
        )}

        {/* Lesson Details Modal */}
        {selectedLessonForDetails && (
          <LessonDetailsModal
            lessonNumber={selectedLessonForDetails}
            onClose={() => setSelectedLessonForDetails(null)}
            theme={theme}
            onExport={() => {
              setSelectedLessonForExport(selectedLessonForDetails);
              setSelectedLessonForDetails(null);
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}