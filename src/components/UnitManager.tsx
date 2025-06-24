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
import { LessonPlanBuilder } from './LessonPlanBuilder';

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
      } catch (error) {
        console.error('Failed to parse saved units:', error);
        setUnits([]);
      }
    }
  }, [isOpen, currentSheetInfo.sheet, embedded]);

  // Save units to localStorage
  const saveUnits = (updatedUnits: Unit[]) => {
    localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
    setUnits(updatedUnits);
  };

  const handleCreateUnit = () => {
    if (!newUnit.name || !newUnit.lessonNumbers?.length) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
    
    // Reset form
    setNewUnit({
      name: '',
      description: '',
      lessonNumbers: [],
      color: getThemeForClass(currentSheetInfo.sheet).primary,
      term: 'A1'
    });
    setIsCreating(false);
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
      
      if (editingUnit?.id === unitId) {
        setEditingUnit(null);
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

  const containerClasses = embedded 
    ? "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";

  const contentClasses = embedded
    ? ""
    : "bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Unit Builder</h2>
              <p className="text-indigo-100 text-sm">
                {currentSheetInfo.display} • Create units from existing lessons
              </p>
            </div>
          </div>
          {!embedded && (
            <button
              onClick={onClose}
              className="p-2 text-indigo-100 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Unit Builder Section */}
            <div className="space-y-6">
              {/* Create Unit Button */}
              {!isCreating && !editingUnit && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create New Unit</span>
                </button>
              )}

              {/* Create Unit Form */}
              {isCreating && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Unit</h3>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
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
                        onClick={() => setIsCreating(false)}
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
              )}

              {/* Edit Unit Form */}
              {editingUnit && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Unit</h3>
                    <button
                      onClick={() => setEditingUnit(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Name
                      </label>
                      <input
                        type="text"
                        value={editingUnit.name}
                        onChange={(e) => setEditingUnit(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter unit name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Term
                      </label>
                      <select
                        value={editingUnit.term || 'A1'}
                        onChange={(e) => setEditingUnit(prev => prev ? { ...prev, term: e.target.value } : null)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        value={editingUnit.description}
                        onChange={(e) => setEditingUnit(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
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
                          value={editingUnit.color}
                          onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editingUnit.color}
                          onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="w-48">
                          <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                              value={termFilter}
                              onChange={(e) => setTermFilter(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                            const isSelected = editingUnit.lessonNumbers.includes(lessonNum);
                            const lessonTerm = LESSON_TO_HALF_TERM[lessonNum] || 'A1';
                            const termInfo = HALF_TERMS.find(t => t.id === lessonTerm);
                            
                            return (
                              <div
                                key={lessonNum}
                                onClick={() => toggleLessonSelection(lessonNum)}
                                className={`p-2 border rounded-lg cursor-pointer transition-colors duration-200 text-center ${
                                  isSelected 
                                    ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center justify-center mb-1">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    isSelected ? 'bg-blue-600' : 'bg-gray-200'
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
                      {editingUnit.lessonNumbers.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">
                              {editingUnit.lessonNumbers.length} lessons selected
                            </span>
                            <button
                              onClick={() => setEditingUnit(prev => prev ? { ...prev, lessonNumbers: [] } : null)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-2 py-1 hover:bg-blue-100 rounded transition-colors duration-200"
                            >
                              <X className="h-3 w-3" />
                              <span>Clear</span>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {editingUnit.lessonNumbers
                              .sort((a, b) => parseInt(a) - parseInt(b))
                              .map((lessonNum) => (
                                <span
                                  key={lessonNum}
                                  className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full"
                                >
                                  <span>L{lessonNum}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLessonSelection(lessonNum);
                                    }}
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
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setEditingUnit(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateUnit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Update Unit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Units List */}
              <div className="space-y-4">
                {/* Unit Search */}
                {units.length > 0 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search units..."
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-900">Your Units</h3>
                
                {units.length === 0 && !isCreating && !editingUnit ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No units created yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first unit by grouping lessons together
                    </p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create First Unit</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUnits.map((unit) => {
                      const isExpanded = expandedUnit === unit.id;
                      const { totalDuration, totalActivities } = getUnitStats(unit.lessonNumbers);
                      const termInfo = HALF_TERMS.find(t => t.id === unit.term);
                      
                      return (
                        <div 
                          key={unit.id} 
                          className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                        >
                          {/* Unit Header */}
                          <div 
                            className="p-4 border-b border-gray-200 cursor-pointer"
                            onClick={() => toggleExpandUnit(unit.id)}
                            style={{ 
                              background: `linear-gradient(to right, ${unit.color}15, ${unit.color}05)`,
                              borderLeft: `4px solid ${unit.color}`
                            }}
                          >
                            <div className="flex items-center justify-between">
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
                                    <span>{totalDuration} mins</span>
                                    {termInfo && (
                                      <>
                                        <span>•</span>
                                        <span>{termInfo.name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUnitForCalendar(unit);
                                  }}
                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                  title="Add to Calendar"
                                >
                                  <Calendar className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingUnit(unit);
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title="Edit Unit"
                                >
                                  <Edit3 className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUnit(unit.id);
                                  }}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Delete Unit"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Unit Details (when expanded) */}
                          {isExpanded && (
                            <div className="p-4">
                              {/* Description */}
                              {unit.description && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                                  <p className="text-sm text-gray-600">{unit.description}</p>
                                </div>
                              )}
                              
                              {/* Lessons in this unit */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-3">Lessons in this Unit</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {unit.lessonNumbers.sort((a, b) => parseInt(a) - parseInt(b)).map((lessonNum) => {
                                    const lessonData = allLessonsData[lessonNum];
                                    if (!lessonData) return null;
                                    
                                    return (
                                      <div 
                                        key={lessonNum}
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-3"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <h6 className="font-medium text-gray-900">Lesson {lessonNum}</h6>
                                          <div className="flex items-center space-x-1">
                                            <button
                                              onClick={() => moveLessonInUnit(unit.id, lessonNum, 'up')}
                                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200"
                                              title="Move Up"
                                            >
                                              <ArrowUp className="h-3 w-3" />
                                            </button>
                                            <button
                                              onClick={() => moveLessonInUnit(unit.id, lessonNum, 'down')}
                                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200"
                                              title="Move Down"
                                            >
                                              <ArrowDown className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mb-2">
                                          {lessonData.categoryOrder.slice(0, 3).map((category) => (
                                            <span
                                              key={category}
                                              className="px-2 py-0.5 bg-white text-xs font-medium rounded-full border border-gray-200"
                                            >
                                              {category}
                                            </span>
                                          ))}
                                          {lessonData.categoryOrder.length > 3 && (
                                            <span className="px-2 py-0.5 bg-white text-xs font-medium rounded-full border border-gray-200">
                                              +{lessonData.categoryOrder.length - 3}
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center text-xs text-gray-500">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>{lessonData.totalTime} mins</span>
                                          <span className="mx-2">•</span>
                                          <Users className="h-3 w-3 mr-1" />
                                          <span>
                                            {Object.values(lessonData.grouped).reduce((sum, activities) => sum + activities.length, 0)} activities
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Unit Stats */}
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="text-center">
                                    <div className="text-sm text-gray-500 mb-1">Lessons</div>
                                    <div className="text-lg font-semibold text-gray-900">{unit.lessonNumbers.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-500 mb-1">Total Duration</div>
                                    <div className="text-lg font-semibold text-gray-900">{totalDuration} mins</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-500 mb-1">Activities</div>
                                    <div className="text-lg font-semibold text-gray-900">{totalActivities}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Lesson Builder Section */}
            <div>
              <LessonPlanBuilder />
            </div>
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
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Failed to save unit. Please ensure you've provided a unit name and selected at least one lesson.</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer - Only show if not embedded */}
        {!embedded && (
          <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}