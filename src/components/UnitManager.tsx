import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Save, 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Check,
  Clock,
  Users,
  Tag,
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
  FolderOpen
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonDropZone } from './LessonDropZone';

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

// Map lesson numbers to half-terms
const LESSON_TO_HALF_TERM: Record<string, string> = {
  '1': 'A1', '2': 'A1', '3': 'A1', '4': 'A1', '5': 'A1', '6': 'A1',
  '7': 'A2', '8': 'A2', '9': 'A2', '10': 'A2', '11': 'A2', '12': 'A2',
  '13': 'SP1', '14': 'SP1', '15': 'SP1', '16': 'SP1', '17': 'SP1', '18': 'SP1',
  '19': 'SP2', '20': 'SP2', '21': 'SP2', '22': 'SP2', '23': 'SP2', '24': 'SP2',
  '25': 'SM1', '26': 'SM1', '27': 'SM1', '28': 'SM1', '29': 'SM1', '30': 'SM1',
  '31': 'SM2', '32': 'SM2', '33': 'SM2', '34': 'SM2', '35': 'SM2', '36': 'SM2',
};

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

interface UnitManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCalendar?: (unit: Unit, startDate: Date) => void;
  embedded?: boolean;
}

export function UnitManager({ isOpen, onClose, onAddToCalendar, embedded = false }: UnitManagerProps) {
  const { lessonNumbers, allLessonsData, currentSheetInfo } = useData();
  const { getThemeForClass } = useSettings();
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    name: '',
    description: '',
    lessonNumbers: [],
    color: getThemeForClass(currentSheetInfo.sheet).primary,
    term: 'A1' // Default to Autumn 1
  });
  const [isCreating, setIsCreating] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedUnitForCalendar, setSelectedUnitForCalendar] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load units from localStorage
  useEffect(() => {
    if (!embedded && !isOpen) return;
    
    const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits);
        // Convert date strings back to Date objects
        const unitsWithDates = parsedUnits.map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt)
        }));
        setUnits(unitsWithDates);
        
        // If there are units, set the first one as current
        if (unitsWithDates.length > 0 && !currentUnit) {
          setCurrentUnit(unitsWithDates[0]);
        }
      } catch (error) {
        console.error('Failed to parse saved units:', error);
        setUnits([]);
      }
    }
  }, [isOpen, currentSheetInfo.sheet, embedded, currentUnit]);

  // Save units to localStorage
  const saveUnits = (updatedUnits: Unit[]) => {
    localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
    setUnits(updatedUnits);
  };

  const handleCreateUnit = () => {
    if (!newUnit.name || !newUnit.lessonNumbers?.length) {
      alert('Please provide a name and select at least one lesson');
      return;
    }

    const unit: Unit = {
      id: `unit-${Date.now()}`,
      name: newUnit.name || 'Unnamed Unit',
      description: newUnit.description || '',
      lessonNumbers: newUnit.lessonNumbers || [],
      color: newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary,
      term: newUnit.term || 'A1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUnits = [...units, unit];
    saveUnits(updatedUnits);
    setCurrentUnit(unit);
    
    // Reset form
    setNewUnit({
      name: '',
      description: '',
      lessonNumbers: [],
      color: getThemeForClass(currentSheetInfo.sheet).primary,
      term: 'A1'
    });
    setIsCreating(false);
    
    // Show success message
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleUpdateUnit = () => {
    if (!editingUnit) return;
    
    const updatedUnits = units.map(unit => 
      unit.id === editingUnit.id 
        ? { ...editingUnit, updatedAt: new Date() } 
        : unit
    );
    
    saveUnits(updatedUnits);
    setEditingUnit(null);
    setCurrentUnit(editingUnit);
    
    // Show success message
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      const updatedUnits = units.filter(unit => unit.id !== unitId);
      saveUnits(updatedUnits);
      
      if (expandedUnit === unitId) {
        setExpandedUnit(null);
      }
      
      if (currentUnit?.id === unitId) {
        setCurrentUnit(updatedUnits.length > 0 ? updatedUnits[0] : null);
      }
    }
  };

  const toggleLessonSelection = (lessonNum: string) => {
    if (editingUnit) {
      // When editing an existing unit
      setEditingUnit(prev => {
        if (!prev) return prev;
        
        const updatedLessons = prev.lessonNumbers.includes(lessonNum)
          ? prev.lessonNumbers.filter(num => num !== lessonNum)
          : [...prev.lessonNumbers, lessonNum];
          
        return { ...prev, lessonNumbers: updatedLessons };
      });
    } else {
      // When creating a new unit
      setNewUnit(prev => {
        const currentLessons = prev.lessonNumbers || [];
        const updatedLessons = currentLessons.includes(lessonNum)
          ? currentLessons.filter(num => num !== lessonNum)
          : [...currentLessons, lessonNum];
          
        return { ...prev, lessonNumbers: updatedLessons };
      });
    }
  };

  const toggleExpandUnit = (unitId: string) => {
    setExpandedUnit(prev => prev === unitId ? null : unitId);
  };

  const handleAddToCalendar = () => {
    if (!selectedUnitForCalendar || !onAddToCalendar) return;
    
    const startDate = new Date(calendarDate);
    onAddToCalendar(selectedUnitForCalendar, startDate);
    setSelectedUnitForCalendar(null);
  };

  // Calculate total duration and activities for a unit
  const getUnitStats = (lessonNums: string[]) => {
    let totalDuration = 0;
    let totalActivities = 0;
    
    lessonNums.forEach(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (lessonData) {
        totalDuration += lessonData.totalTime || 0;
        
        // Count activities
        Object.values(lessonData.grouped).forEach(activities => {
          totalActivities += activities.length;
        });
      }
    });
    
    return { totalDuration, totalActivities };
  };

  // Move a lesson up or down in the order
  const moveLessonInUnit = (unitId: string, lessonNum: string, direction: 'up' | 'down') => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;
    
    const lessonIndex = unit.lessonNumbers.indexOf(lessonNum);
    if (lessonIndex === -1) return;
    
    // Can't move up if already at the top
    if (direction === 'up' && lessonIndex === 0) return;
    
    // Can't move down if already at the bottom
    if (direction === 'down' && lessonIndex === unit.lessonNumbers.length - 1) return;
    
    const newLessonNumbers = [...unit.lessonNumbers];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    
    // Swap the lessons
    [newLessonNumbers[lessonIndex], newLessonNumbers[targetIndex]] = 
    [newLessonNumbers[targetIndex], newLessonNumbers[lessonIndex]];
    
    // Update the unit
    const updatedUnits = units.map(u => 
      u.id === unitId 
        ? { ...u, lessonNumbers: newLessonNumbers, updatedAt: new Date() } 
        : u
    );
    
    saveUnits(updatedUnits);
  };

  // Filter lessons based on search query and term filter
  const filteredLessons = React.useMemo(() => {
    return lessonNumbers.filter(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return false;
      
      // Filter by search query
      if (searchQuery) {
        const matchesSearch = 
          lessonNum.includes(searchQuery) || 
          Object.values(lessonData.grouped).some(activities => 
            activities.some(activity => 
              activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
              activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              activity.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        
        if (!matchesSearch) return false;
      }
      
      // Filter by term
      if (termFilter !== 'all') {
        const lessonTerm = LESSON_TO_HALF_TERM[lessonNum] || 'A1';
        if (lessonTerm !== termFilter) return false;
      }
      
      return true;
    }).sort((a, b) => parseInt(a) - parseInt(b));
  }, [lessonNumbers, allLessonsData, searchQuery, termFilter]);

  // Filter units based on search query
  const filteredUnits = React.useMemo(() => {
    if (!unitSearchQuery) return units;
    
    return units.filter(unit => 
      unit.name.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
      unit.description.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
      unit.lessonNumbers.some(num => num.includes(unitSearchQuery))
    );
  }, [units, unitSearchQuery]);

  // Create a mock lesson plan from the current unit for LessonDropZone
  const createMockLessonPlan = (unit: Unit | null) => {
    if (!unit) {
      return {
        id: `unit-${Date.now()}`,
        date: new Date(),
        week: 1,
        className: currentSheetInfo.sheet,
        activities: [],
        duration: 0,
        notes: '',
        status: 'draft' as const,
        title: '',
        term: 'A1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Collect all activities from the lessons in this unit
    const activities: any[] = [];
    let totalDuration = 0;
    
    unit.lessonNumbers.forEach(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (lessonData) {
        Object.values(lessonData.grouped).forEach(categoryActivities => {
          categoryActivities.forEach(activity => {
            // Add a unique ID to each activity
            activities.push({
              ...activity,
              _uniqueId: `${activity.activity}-${activity.category}-${Date.now()}-${Math.random()}`
            });
            totalDuration += activity.time || 0;
          });
        });
      }
    });
    
    return {
      id: unit.id,
      date: new Date(),
      week: 1,
      className: currentSheetInfo.sheet,
      activities,
      duration: totalDuration,
      notes: unit.description || '',
      status: 'draft' as const,
      title: unit.name,
      term: unit.term || 'A1',
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    };
  };

  // Handle saving the unit from the LessonDropZone
  const handleSaveUnit = () => {
    if (!currentUnit) return;
    
    // Update the current unit with any changes
    const updatedUnit = {
      ...currentUnit,
      updatedAt: new Date()
    };
    
    const updatedUnits = units.map(unit => 
      unit.id === updatedUnit.id ? updatedUnit : unit
    );
    
    saveUnits(updatedUnits);
    
    // Show success message
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // Handle creating a new unit after saving the current one
  const handleCreateNewAfterSave = () => {
    handleSaveUnit();
    
    // Create a new empty unit
    setNewUnit({
      name: '',
      description: '',
      lessonNumbers: [],
      color: getThemeForClass(currentSheetInfo.sheet).primary,
      term: currentUnit?.term || 'A1'
    });
    
    setIsCreating(true);
    setCurrentUnit(null);
  };

  // Handle notes update from LessonDropZone
  const handleNotesUpdate = (notes: string) => {
    if (!currentUnit) return;
    
    setCurrentUnit({
      ...currentUnit,
      description: notes
    });
  };

  if (!embedded && !isOpen) return null;

  const containerClasses = embedded 
    ? "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";

  const contentClasses = embedded
    ? ""
    : "bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden";

  // If we have a current unit, show the LessonDropZone view
  if (currentUnit) {
    const mockLessonPlan = createMockLessonPlan(currentUnit);
    
    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <FolderOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Unit Builder</h1>
                    <p className="text-gray-600 text-lg">
                      {currentSheetInfo.display} • Create and manage your units
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setCurrentUnit(null);
                      setIsCreating(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Unit</span>
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Unit Details */}
                <div className="lg:col-span-2">
                  <LessonDropZone
                    lessonPlan={mockLessonPlan}
                    onActivityAdd={() => {}}
                    onActivityRemove={() => {}}
                    onActivityReorder={() => {}}
                    onNotesUpdate={handleNotesUpdate}
                    isEditing={false}
                    onSave={handleSaveUnit}
                    onSaveAndCreate={handleCreateNewAfterSave}
                  />
                </div>

                {/* Units List */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <h3 className="text-lg font-semibold">Your Units</h3>
                      <p className="text-indigo-100 text-sm">Select a unit to view or edit</p>
                      
                      {/* Search */}
                      <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-300" />
                        <input
                          type="text"
                          placeholder="Search units..."
                          value={unitSearchQuery}
                          onChange={(e) => setUnitSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-indigo-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      {units.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No units created yet</h3>
                          <p className="text-gray-600 mb-4">
                            Create your first unit by grouping lessons together
                          </p>
                          <button
                            onClick={() => {
                              setCurrentUnit(null);
                              setIsCreating(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Create First Unit</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredUnits.map((unit) => (
                            <div 
                              key={unit.id} 
                              className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                                currentUnit?.id === unit.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                              }`}
                              onClick={() => setCurrentUnit(unit)}
                            >
                              <div className="p-3">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: unit.color }}
                                  >
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                                      <span>{unit.lessonNumbers.length} lessons</span>
                                      <span>•</span>
                                      <span>{getUnitStats(unit.lessonNumbers).totalDuration} mins</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Status Message */}
          {saveStatus !== 'idle' && (
            <div className="fixed bottom-4 right-4 max-w-md">
              <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
                saveStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {saveStatus === 'success' ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Unit saved successfully!</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-red-600" />
                    <span>Failed to save unit. Please try again.</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If we're creating a new unit, show the creation form
  if (isCreating) {
    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <FolderOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Unit</h1>
                    <p className="text-gray-600 text-lg">
                      {currentSheetInfo.display} • Group lessons into a unit
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCreating(false);
                    if (units.length > 0) {
                      setCurrentUnit(units[0]);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Unit Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <h2 className="text-xl font-bold">Unit Details</h2>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Name
                        </label>
                        <input
                          type="text"
                          value={newUnit.name || ''}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter unit name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Term
                        </label>
                        <select
                          value={newUnit.term || 'A1'}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, term: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {HALF_TERMS.map(term => (
                            <option key={term.id} value={term.id}>
                              {term.name} ({term.months})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={newUnit.description || ''}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24 resize-none"
                          placeholder="Enter unit description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary}
                            onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary}
                            onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="#6366F1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Lessons
                        </label>
                        
                        {/* Search and Filter */}
                        <div className="flex flex-wrap gap-3 mb-3">
                          <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search lessons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="w-48">
                            <div className="flex items-center space-x-2">
                              <Filter className="h-4 w-4 text-gray-500" />
                              <select
                                value={termFilter}
                                onChange={(e) => setTermFilter(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              >
                                <option value="all">All Terms</option>
                                {HALF_TERMS.map(term => (
                                  <option key={term.id} value={term.id}>
                                    {term.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-6 gap-2">
                            {filteredLessons.map((lessonNum) => {
                              const isSelected = (newUnit.lessonNumbers || []).includes(lessonNum);
                              const lessonTerm = LESSON_TO_HALF_TERM[lessonNum] || 'A1';
                              const termInfo = HALF_TERMS.find(t => t.id === lessonTerm);
                              
                              return (
                                <div
                                  key={lessonNum}
                                  onClick={() => toggleLessonSelection(lessonNum)}
                                  className={`p-2 border rounded-lg cursor-pointer transition-colors duration-200 text-center ${
                                    isSelected 
                                      ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-center mb-1">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                      isSelected ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}>
                                      {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium">Lesson {lessonNum}</span>
                                  <div className="text-xs text-gray-500 mt-1">{termInfo?.name}</div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {filteredLessons.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              No lessons match your search criteria
                            </div>
                          )}
                        </div>
                        
                        {/* Selected Lessons Summary */}
                        {(newUnit.lessonNumbers || []).length > 0 && (
                          <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-indigo-900">
                                {(newUnit.lessonNumbers || []).length} lessons selected
                              </span>
                              <button
                                onClick={() => setNewUnit(prev => ({ ...prev, lessonNumbers: [] }))}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 px-2 py-1 hover:bg-indigo-100 rounded transition-colors duration-200"
                              >
                                <X className="h-3 w-3" />
                                <span>Clear</span>
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(newUnit.lessonNumbers || [])
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map((lessonNum) => (
                                  <span
                                    key={lessonNum}
                                    className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-200 text-indigo-800 text-xs font-medium rounded-full"
                                  >
                                    <span>L{lessonNum}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLessonSelection(lessonNum);
                                      }}
                                      className="hover:text-indigo-900 p-0.5 hover:bg-indigo-300 rounded-full transition-colors duration-200"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            if (units.length > 0) {
                              setCurrentUnit(units[0]);
                            }
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateUnit}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>Create Unit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Units List */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <h3 className="text-lg font-semibold">Your Units</h3>
                      <p className="text-indigo-100 text-sm">Select a unit to view or edit</p>
                      
                      {/* Search */}
                      <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-300" />
                        <input
                          type="text"
                          placeholder="Search units..."
                          value={unitSearchQuery}
                          onChange={(e) => setUnitSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-indigo-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      {units.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No units created yet</h3>
                          <p className="text-gray-600 mb-4">
                            Create your first unit by grouping lessons together
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredUnits.map((unit) => (
                            <div 
                              key={unit.id} 
                              className="bg-white rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md cursor-pointer"
                              onClick={() => setCurrentUnit(unit)}
                            >
                              <div className="p-3">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: unit.color }}
                                  >
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                                      <span>{unit.lessonNumbers.length} lessons</span>
                                      <span>•</span>
                                      <span>{getUnitStats(unit.lessonNumbers).totalDuration} mins</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - unit list
  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <FolderOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Unit Builder</h1>
                  <p className="text-gray-600 text-lg">
                    {currentSheetInfo.display} • Create and manage your units
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Unit</span>
              </button>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                  <BookOpen className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">No units created yet</h2>
                  <p className="text-gray-600 text-lg mb-8">
                    Create your first unit by grouping lessons together
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors duration-200 inline-flex items-center space-x-2 text-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create First Unit</span>
                  </button>
                </div>
              ) : (
                filteredUnits.map(unit => {
                  const { totalDuration, totalActivities } = getUnitStats(unit.lessonNumbers);
                  const termInfo = HALF_TERMS.find(t => t.id === unit.term);
                  
                  return (
                    <div 
                      key={unit.id}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => setCurrentUnit(unit)}
                    >
                      <div 
                        className="p-6 text-white relative overflow-hidden"
                        style={{ 
                          background: `linear-gradient(135deg, ${unit.color} 0%, ${unit.color}CC 100%)` 
                        }}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold">
                              {unit.name}
                            </h3>
                          </div>
                          
                          <p className="text-white text-opacity-90 text-sm font-medium">
                            {termInfo?.name} ({termInfo?.months})
                          </p>

                          <div className="flex items-center space-x-6 text-white text-opacity-90 mt-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-5 w-5" />
                              <span className="font-medium">{totalDuration} mins</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-5 w-5" />
                              <span className="font-medium">{totalActivities} activities</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {unit.lessonNumbers.slice(0, 5).map((lessonNum) => (
                            <span
                              key={lessonNum}
                              className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full border border-gray-200"
                            >
                              Lesson {lessonNum}
                            </span>
                          ))}
                          {unit.lessonNumbers.length > 5 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                              +{unit.lessonNumbers.length - 5} more
                            </span>
                          )}
                        </div>
                        
                        {unit.description && (
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {unit.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Save Status Message */}
        {saveStatus !== 'idle' && (
          <div className="fixed bottom-4 right-4 max-w-md">
            <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
              saveStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveStatus === 'success' ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Unit saved successfully!</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-600" />
                  <span>Failed to save unit. Please try again.</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}