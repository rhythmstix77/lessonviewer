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
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';

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
  const { getThemeForClass, getCategoryColor } = useSettings();
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);

  // Handle saving the current unit
  const handleSaveUnit = () => {
    if (!currentUnit || !currentUnit.name.trim()) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    const updatedUnits = units.map(unit => 
      unit.id === currentUnit.id 
        ? { ...currentUnit, updatedAt: new Date() } 
        : unit
    );

    // If this is a new unit (not in the units array yet), add it
    if (!units.find(unit => unit.id === currentUnit.id)) {
      updatedUnits.push({
        ...currentUnit,
        id: currentUnit.id || `unit-${Date.now()}`,
        createdAt: currentUnit.createdAt || new Date(),
        updatedAt: new Date()
      });
    }

    saveUnits(updatedUnits);
    
    // Show success message
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
    setHasUnsavedChanges(false);
  };

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
    if (!newUnit.name || selectedLessons.length === 0) {
      alert('Please provide a name and select at least one lesson');
      return;
    }

    const unit: Unit = {
      id: `unit-${Date.now()}`,
      name: newUnit.name || 'Unnamed Unit',
      description: newUnit.description || '',
      lessonNumbers: selectedLessons,
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
    setSelectedLessons([]);
    
    // Show success message
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
    setHasUnsavedChanges(false);
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
    setHasUnsavedChanges(false);
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
    } else if (currentUnit) {
      // When modifying the current unit
      const updatedLessons = currentUnit.lessonNumbers.includes(lessonNum)
        ? currentUnit.lessonNumbers.filter(num => num !== lessonNum)
        : [...currentUnit.lessonNumbers, lessonNum];
        
      setCurrentUnit({
        ...currentUnit,
        lessonNumbers: updatedLessons
      });
      setHasUnsavedChanges(true);
    } else {
      // When creating a new unit
      setSelectedLessons(prev => 
        prev.includes(lessonNum)
          ? prev.filter(num => num !== lessonNum)
          : [...prev, lessonNum]
      );
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
    const unit = units.find(u => u.id === unitId) || currentUnit;
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
    if (unit.id === currentUnit?.id) {
      setCurrentUnit({
        ...unit,
        lessonNumbers: newLessonNumbers
      });
      setHasUnsavedChanges(true);
    } else {
      const updatedUnits = units.map(u => 
        u.id === unitId 
          ? { ...u, lessonNumbers: newLessonNumbers, updatedAt: new Date() } 
          : u
      );
      
      saveUnits(updatedUnits);
    }
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

  // Add selected lessons to the current unit or create a new unit
  const addSelectedLessonsToUnit = () => {
    if (selectedLessons.length === 0) {
      alert("Please select at least one lesson to add");
      return;
    }
    
    if (currentUnit) {
      // Add selected lessons to the current unit
      const updatedLessons = [...currentUnit.lessonNumbers];
      
      selectedLessons.forEach(lessonNum => {
        if (!updatedLessons.includes(lessonNum)) {
          updatedLessons.push(lessonNum);
        }
      });
      
      // Sort lessons by number
      updatedLessons.sort((a, b) => parseInt(a) - parseInt(b));
      
      // Update the current unit
      setCurrentUnit({
        ...currentUnit,
        lessonNumbers: updatedLessons
      });
      
      setHasUnsavedChanges(true);
    } else {
      // Create a new unit with the selected lessons
      if (!newUnit.name || !newUnit.name.trim()) {
        alert("Please provide a unit name before adding lessons");
        return;
      }
      
      const unit: Unit = {
        id: `unit-${Date.now()}`,
        name: newUnit.name,
        description: newUnit.description || '',
        lessonNumbers: [...selectedLessons].sort((a, b) => parseInt(a) - parseInt(b)),
        color: newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary,
        term: newUnit.term || 'A1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add the new unit to the units array
      const updatedUnits = [...units, unit];
      saveUnits(updatedUnits);
      
      // Set the new unit as the current unit
      setCurrentUnit(unit);
      setHasUnsavedChanges(false);
      
      // Reset the new unit form
      setNewUnit({
        name: '',
        description: '',
        lessonNumbers: [],
        color: getThemeForClass(currentSheetInfo.sheet).primary,
        term: 'A1'
      });
    }
    
    // Clear selected lessons after adding
    setSelectedLessons([]);
  };

  // Select all filtered lessons
  const selectAllLessons = () => {
    setSelectedLessons(filteredLessons);
  };

  // Clear all selected lessons
  const clearSelectedLessons = () => {
    setSelectedLessons([]);
  };

  if (!embedded && !isOpen) return null;

  const containerClasses = embedded 
    ? "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";

  const contentClasses = embedded
    ? ""
    : "bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden";

  // Main Unit Builder View
  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-md">
                    <FolderOpen className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentUnit?.name || ''}
                      onChange={(e) => {
                        if (currentUnit) {
                          setCurrentUnit({
                            ...currentUnit,
                            name: e.target.value
                          });
                          setHasUnsavedChanges(true);
                        }
                      }}
                      placeholder="Enter unit name..."
                      className="w-full text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                      dir="ltr"
                    />
                    <div className="flex items-center flex-wrap gap-3 mt-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span>{currentSheetInfo.display}</span>
                        <span>•</span>
                        <select
                          value={currentUnit?.term || 'A1'}
                          onChange={(e) => {
                            if (currentUnit) {
                              setCurrentUnit({
                                ...currentUnit,
                                term: e.target.value
                              });
                              setHasUnsavedChanges(true);
                            }
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          dir="ltr"
                        >
                          {HALF_TERMS.map(term => (
                            <option key={term.id} value={term.id}>
                              {term.name} ({term.months})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {currentUnit && (
                        <>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{getUnitStats(currentUnit.lessonNumbers).totalDuration} minutes</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{currentUnit.lessonNumbers.length} lessons</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSaveUnit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    disabled={!currentUnit || !hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Unit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (confirm('You have unsaved changes. Do you want to continue without saving?')) {
                          setIsCreating(true);
                          setCurrentUnit(null);
                        }
                      } else {
                        setIsCreating(true);
                        setCurrentUnit(null);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New</span>
                  </button>
                </div>
              </div>
              
              {/* Save Status Message */}
              {saveStatus !== 'idle' && (
                <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
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
                      <span>Failed to save unit. Please ensure you've provided a name.</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Unit Contents */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 h-[600px] flex flex-col transition-all duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Contents</h3>
                  
                  <div className="flex-1 overflow-y-auto">
                    {(!currentUnit || currentUnit.lessonNumbers.length === 0) && selectedLessons.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                        <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-center">
                          No lessons added yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentUnit?.lessonNumbers.sort((a, b) => parseInt(a) - parseInt(b)).map(lessonNum => {
                          const lessonData = allLessonsData[lessonNum];
                          if (!lessonData) return null;
                          
                          return (
                            <div 
                              key={lessonNum}
                              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                                    style={{ backgroundColor: getThemeForClass(currentSheetInfo.sheet).primary }}
                                  >
                                    {lessonNum}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {lessonData.title || `Lesson ${lessonNum}`}
                                    </h4>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <span>{lessonData.totalTime} mins</span>
                                      <span>•</span>
                                      <span>
                                        {Object.values(lessonData.grouped).reduce((sum, activities) => sum + activities.length, 0)} activities
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => moveLessonInUnit(currentUnit.id, lessonNum, 'up')}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => moveLessonInUnit(currentUnit.id, lessonNum, 'down')}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleLessonSelection(lessonNum)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Categories */}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {lessonData.categoryOrder.slice(0, 3).map(category => (
                                  <span 
                                    key={category}
                                    className="px-1.5 py-0.5 text-xs rounded-full"
                                    style={{
                                      backgroundColor: `${getCategoryColor(category)}20`,
                                      color: getCategoryColor(category)
                                    }}
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Panel - Available Lessons */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-[600px] flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h3 className="text-lg font-semibold mb-2">Available Lessons</h3>
                    <p className="text-blue-100 text-sm">Select lessons to add to your unit</p>
                    
                    {/* Search and Filter */}
                    <div className="mt-3 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                        <input
                          type="text"
                          placeholder="Search lessons..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                          dir="ltr"
                        />
                      </div>
                      
                      <select
                        value={termFilter}
                        onChange={(e) => setTermFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                        dir="ltr"
                      >
                        <option value="all" className="text-gray-900">All Terms</option>
                        {HALF_TERMS.map(term => (
                          <option key={term.id} value={term.id} className="text-gray-900">
                            {term.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Selection Controls */}
                      <div className="flex justify-between">
                        <button
                          onClick={selectAllLessons}
                          className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm text-white"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearSelectedLessons}
                          className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm text-white"
                          disabled={selectedLessons.length === 0}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {filteredLessons.map(lessonNum => {
                        const lessonData = allLessonsData[lessonNum];
                        if (!lessonData) return null;
                        
                        const isSelected = selectedLessons.includes(lessonNum);
                        const isInCurrentUnit = currentUnit?.lessonNumbers.includes(lessonNum);
                        const lessonTerm = LESSON_TO_HALF_TERM[lessonNum] || 'A1';
                        const termInfo = HALF_TERMS.find(t => t.id === lessonTerm);
                        
                        return (
                          <div
                            key={lessonNum}
                            className={`p-3 border rounded-lg transition-all duration-200 ${
                              isSelected ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 
                              isInCurrentUnit ? 'bg-gray-100 border-gray-300 text-gray-500' : 
                              'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleLessonSelection(lessonNum)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-indigo-600' : 'border-2 border-gray-300'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {lessonData.title || `Lesson ${lessonNum}`}
                                  </h4>
                                  <div className="text-xs text-gray-500 mt-1">{termInfo?.name}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{lessonData.totalTime} mins</span>
                                <span>•</span>
                                <span>
                                  {Object.values(lessonData.grouped).reduce((sum, activities) => sum + activities.length, 0)} activities
                                </span>
                              </div>
                            </div>
                            
                            {/* Categories */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {lessonData.categoryOrder.slice(0, 3).map(category => (
                                <span 
                                  key={category}
                                  className="px-1.5 py-0.5 text-xs rounded-full"
                                  style={{
                                    backgroundColor: `${getCategoryColor(category)}20`,
                                    color: getCategoryColor(category)
                                  }}
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
                        );
                      })}
                    </div>
                    
                    {filteredLessons.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No lessons match your search criteria
                      </div>
                    )}
                  </div>
                  
                  {/* Add to Unit Button - Now shown whenever there are selected lessons */}
                  {selectedLessons.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={addSelectedLessonsToUnit}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add {selectedLessons.length} Selected {selectedLessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Units List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-[600px] flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <h3 className="text-lg font-semibold mb-2">Your Units</h3>
                    <p className="text-indigo-100 text-sm">Select a unit to edit</p>
                    
                    {/* Search */}
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-300" />
                      <input
                        type="text"
                        placeholder="Search units..."
                        value={unitSearchQuery}
                        onChange={(e) => setUnitSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-indigo-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {units.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No units created yet</h3>
                        <p className="text-gray-600 mb-4">
                          Create your first unit by adding lessons
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUnits.map((unit) => (
                          <div 
                            key={unit.id} 
                            className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                              currentUnit?.id === unit.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                            }`}
                            onClick={() => {
                              if (hasUnsavedChanges) {
                                if (confirm('You have unsaved changes. Do you want to continue without saving?')) {
                                  setCurrentUnit(unit);
                                  setHasUnsavedChanges(false);
                                }
                              } else {
                                setCurrentUnit(unit);
                              }
                            }}
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

            {/* Unit Description */}
            {currentUnit && (
              <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Unit Description</h3>
                <textarea
                  value={currentUnit.description}
                  onChange={(e) => {
                    setCurrentUnit({
                      ...currentUnit,
                      description: e.target.value
                    });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Enter a description for this unit..."
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </div>

        {/* Add to Calendar Modal */}
        {selectedUnitForCalendar && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Unit to Calendar</h3>
                <button
                  onClick={() => setSelectedUnitForCalendar(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: selectedUnitForCalendar.color }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedUnitForCalendar.name}</h4>
                        <p className="text-sm text-gray-600">{selectedUnitForCalendar.lessonNumbers.length} lessons</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lessons will be scheduled starting from this date
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedUnitForCalendar(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToCalendar}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Add to Calendar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}