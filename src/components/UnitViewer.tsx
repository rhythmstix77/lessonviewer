import React, { useState, useEffect } from 'react';
import { FolderOpen, Search, Filter, Grid as Grid3x3, List, MoreVertical, ChevronLeft, Clock, BookOpen, Calendar, Tag, X, Download, Edit3, Eye, EyeOff } from 'lucide-react';
import { UnitCard } from './UnitCard';
import { LessonLibraryCard } from './LessonLibraryCard';
import { ActivityDetails } from './ActivityDetails';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonExporter } from './LessonExporter';
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

// Map term IDs to readable names
const TERM_NAMES: Record<string, string> = {
  'A1': 'Autumn 1 (Sep-Oct)',
  'A2': 'Autumn 2 (Nov-Dec)',
  'SP1': 'Spring 1 (Jan-Feb)',
  'SP2': 'Spring 2 (Mar-Apr)',
  'SM1': 'Summer 1 (Apr-May)',
  'SM2': 'Summer 2 (Jun-Jul)',
};

export function UnitViewer() {
  const { currentSheetInfo, allLessonsData } = useData();
  const { getThemeForClass } = useSettings();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLessonForExport, setSelectedLessonForExport] = useState<string | null>(null);
  const [focusedHalfTermId, setFocusedHalfTermId] = useState<string | null>(null);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Load units from localStorage
  useEffect(() => {
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
      // Create some sample units if none exist
      const sampleUnits: Unit[] = [
        {
          id: 'unit-1',
          name: 'Welcome Songs',
          description: 'A collection of welcome songs and activities to start the lesson.',
          lessonNumbers: ['1', '2', '3'],
          color: '#3B82F6',
          term: 'A1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'unit-2',
          name: 'Rhythm Activities',
          description: 'Activities focused on developing rhythm skills using percussion instruments.',
          lessonNumbers: ['4', '5', '6'],
          color: '#F59E0B',
          term: 'A2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'unit-3',
          name: 'Movement and Dance',
          description: 'Activities that combine music with movement and dance elements.',
          lessonNumbers: ['7', '8', '9'],
          color: '#10B981',
          term: 'SP1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setUnits(sampleUnits);
      localStorage.setItem('units', JSON.stringify(sampleUnits));
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

  // Handle focusing on a specific half-term
  const handleFocusHalfTerm = (termId: string) => {
    setFocusedHalfTermId(termId === focusedHalfTermId ? null : termId);
    // Reset the term filter when focusing on a specific half-term
    setSelectedTerm('all');
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
                      onClick={() => handleLessonExport(lessonNumber)}
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
      </div>
    );
  }

  // Default view - all units
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Unit Library</h2>
                  <p className="text-indigo-100 text-sm">
                    {filteredUnits.length} of {units.length} units
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'compact' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-300" />
                <input
                  type="text"
                  placeholder="Search units..."
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

        {/* Focused Half-Term Indicator */}
        {focusedHalfTermId && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="font-medium text-gray-900">Focused on {TERM_NAMES[focusedHalfTermId]}</h3>
                <p className="text-sm text-gray-600">Showing only units from this half-term</p>
              </div>
            </div>
            <button
              onClick={() => setFocusedHalfTermId(null)}
              className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium"
            >
              Show All Half-Terms
            </button>
          </div>
        )}

        {/* Units Grid */}
        <div className="mb-6">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedTerm !== 'all' || focusedHalfTermId
                  ? 'Try adjusting your search or filters'
                  : 'No units available in the library'
                }
              </p>
            </div>
          ) : (
            <div className={`
              ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
                viewMode === 'list' ? 'space-y-4' :
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
              }
            `}>
              {filteredUnits.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  viewMode={viewMode}
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
    </div>
  );
}