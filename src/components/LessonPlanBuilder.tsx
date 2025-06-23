import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Save, 
  Clock, 
  Users, 
  Download,
  Search,
  Grid3X3,
  List,
  Tag,
  SortAsc,
  SortDesc,
  MoreVertical,
  Plus,
  Check,
  Filter,
  Edit3,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { LessonDropZone } from './LessonDropZone';
import { ActivityDetails } from './ActivityDetails';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  unitId?: string;
  unitName?: string;
}

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export function LessonPlanBuilder() {
  const { currentSheetInfo, allLessonsData } = useData();
  
  // Initialize currentLessonPlan with a default value instead of null
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan>(() => ({
    id: `plan-${Date.now()}`,
    date: new Date(),
    week: 1,
    className: currentSheetInfo.sheet,
    activities: [],
    duration: 0,
    notes: '',
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [libraryActivities, setLibraryActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAddToUnitModal, setShowAddToUnitModal] = useState(false);

  // Load lesson plans from localStorage
  useEffect(() => {
    const savedPlans = localStorage.getItem('lesson-plans');
    if (savedPlans) {
      const plans = JSON.parse(savedPlans).map((plan: any) => ({
        ...plan,
        date: new Date(plan.date),
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
      }));
      setLessonPlans(plans);
    }

    // Load library activities
    const savedActivities = localStorage.getItem('library-activities');
    if (savedActivities) {
      setLibraryActivities(JSON.parse(savedActivities));
    } else {
      // Extract activities from all lessons data as initial library
      const activities: Activity[] = [];
      Object.values(allLessonsData).forEach(lessonData => {
        Object.values(lessonData.grouped).forEach(categoryActivities => {
          activities.push(...categoryActivities);
        });
      });
      
      // Remove duplicates based on activity name and category
      const uniqueActivities = activities.filter((activity, index, self) => 
        index === self.findIndex(a => a.activity === activity.activity && a.category === activity.category)
      );
      
      setLibraryActivities(uniqueActivities);
      localStorage.setItem('library-activities', JSON.stringify(uniqueActivities));
    }

    // Load units
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
  }, [allLessonsData, currentSheetInfo.sheet]);

  // Save lesson plans to localStorage
  const saveLessonPlans = (plans: LessonPlan[]) => {
    localStorage.setItem('lesson-plans', JSON.stringify(plans));
    setLessonPlans(plans);
  };

  // Save library activities to localStorage
  const saveLibraryActivities = (activities: Activity[]) => {
    localStorage.setItem('library-activities', JSON.stringify(activities));
    setLibraryActivities(activities);
  };

  const handleUpdateLessonPlan = (updatedPlan: LessonPlan) => {
    try {
      const updatedPlans = lessonPlans.map(plan => 
        plan.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date() } : plan
      );
      
      if (!lessonPlans.find(plan => plan.id === updatedPlan.id)) {
        updatedPlans.push({ ...updatedPlan, updatedAt: new Date() });
      }
      
      saveLessonPlans(updatedPlans);
      setCurrentLessonPlan(updatedPlan);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return true;
    } catch (error) {
      console.error('Failed to update lesson plan:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return false;
    }
  };

  const handleActivityAdd = (activity: Activity) => {
    // Create a deep copy of the activity to avoid reference issues
    const activityCopy = JSON.parse(JSON.stringify(activity));
    
    // Generate a unique ID for this activity instance to ensure it's treated as unique
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    
    // Update the lesson plan
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, uniqueActivity],
      duration: currentLessonPlan.duration + (uniqueActivity.time || 0),
    };
    
    setCurrentLessonPlan(updatedPlan);
  };

  const handleActivityRemove = (activityIndex: number) => {
    const removedActivity = currentLessonPlan.activities[activityIndex];
    const updatedPlan = {
      ...currentLessonPlan,
      activities: currentLessonPlan.activities.filter((_, index) => index !== activityIndex),
      duration: currentLessonPlan.duration - (removedActivity.time || 0),
    };
    setCurrentLessonPlan(updatedPlan);
  };

  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    const draggedActivity = currentLessonPlan.activities[dragIndex];
    const newActivities = [...currentLessonPlan.activities];
    newActivities.splice(dragIndex, 1);
    newActivities.splice(hoverIndex, 0, draggedActivity);
    
    const updatedPlan = {
      ...currentLessonPlan,
      activities: newActivities,
    };
    
    setCurrentLessonPlan(updatedPlan);
  };

  const handleSaveLessonPlan = () => {
    const success = handleUpdateLessonPlan(currentLessonPlan);
    if (success) {
      // Create a new empty lesson plan after saving
      if (showAddToUnitModal) {
        setShowAddToUnitModal(false);
      }
    }
  };

  const handleExportLessonPlan = () => {
    // Create a simple text export
    const exportData = {
      date: currentLessonPlan.date.toLocaleDateString(),
      week: currentLessonPlan.week,
      className: currentLessonPlan.className,
      duration: currentLessonPlan.duration,
      activities: currentLessonPlan.activities.map(activity => ({
        name: activity.activity,
        category: activity.category,
        time: activity.time,
        description: activity.description,
        level: activity.level,
      })),
      notes: currentLessonPlan.notes,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-plan-${currentLessonPlan.date.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter and sort activities for the library
  const filteredAndSortedActivities = React.useMemo(() => {
    let filtered = libraryActivities.filter(activity => {
      const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || activity.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort activities
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.activity.localeCompare(b.activity);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'time':
          comparison = a.time - b.time;
          break;
        case 'level':
          comparison = a.level.localeCompare(b.level);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [libraryActivities, searchQuery, selectedCategory, selectedLevel, sortBy, sortOrder]);

  // Get unique categories and levels for filters
  const categories = React.useMemo(() => {
    const cats = new Set(libraryActivities.map(a => a.category));
    return Array.from(cats).sort();
  }, [libraryActivities]);

  const levels = React.useMemo(() => {
    const lvls = new Set(libraryActivities.map(a => a.level).filter(Boolean));
    return Array.from(lvls).sort();
  }, [libraryActivities]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Toggle activity selection
  const toggleActivitySelection = (activityId: string) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    } else {
      setSelectedActivities(prev => [...prev, activityId]);
    }
  };

  // Add selected activities to lesson plan
  const addSelectedActivities = () => {
    // Find all selected activities
    const activitiesToAdd = libraryActivities.filter(activity => {
      const activityId = `${activity.activity}-${activity.category}`;
      return selectedActivities.includes(activityId);
    });
    
    if (activitiesToAdd.length === 0) return;
    
    // Create a new array of activities with unique IDs
    const newActivities = activitiesToAdd.map(activity => {
      // Create a deep copy of the activity
      const activityCopy = JSON.parse(JSON.stringify(activity));
      
      // Add a unique ID
      return {
        ...activityCopy,
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
      };
    });
    
    // Calculate new total duration
    const additionalDuration = newActivities.reduce((sum, activity) => sum + (activity.time || 0), 0);
    
    // Update the lesson plan
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, ...newActivities],
      duration: currentLessonPlan.duration + additionalDuration,
    };
    
    setCurrentLessonPlan(updatedPlan);
    
    // Clear selections after adding
    setSelectedActivities([]);
  };

  // Add current lesson plan to a unit
  const handleAddToUnit = () => {
    if (!selectedUnit) return;

    // Find the selected unit
    const unit = units.find(u => u.id === selectedUnit);
    if (!unit) return;

    // Update the current lesson plan with unit information
    const updatedPlan = {
      ...currentLessonPlan,
      unitId: unit.id,
      unitName: unit.name
    };

    // Save the updated plan
    const success = handleUpdateLessonPlan(updatedPlan);
    
    if (success) {
      // Update the unit with the new lesson plan
      const updatedUnit = {
        ...unit,
        lessonNumbers: [...unit.lessonNumbers, currentLessonPlan.id],
        updatedAt: new Date()
      };

      // Save the updated unit
      const updatedUnits = units.map(u => u.id === unit.id ? updatedUnit : u);
      localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
      setUnits(updatedUnits);

      // Close the modal
      setShowAddToUnitModal(false);
    }
  };

  // Create a new lesson plan after saving the current one
  const handleCreateNewAfterSave = () => {
    // First save the current plan
    const success = handleUpdateLessonPlan(currentLessonPlan);
    
    if (success) {
      // Create a new empty plan
      const newPlan: LessonPlan = {
        id: `plan-${Date.now()}`,
        date: new Date(),
        week: currentLessonPlan.week + 1, // Increment week number
        className: currentSheetInfo.sheet,
        activities: [],
        duration: 0,
        notes: '',
        status: 'planned',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Preserve unit information if it exists
        unitId: currentLessonPlan.unitId,
        unitName: currentLessonPlan.unitName
      };
      
      setCurrentLessonPlan(newPlan);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Edit3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Lesson Plan Builder</h1>
                  <p className="text-gray-600 text-lg">
                    {currentSheetInfo.display} • Create and manage your lesson plans
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAddToUnitModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Add to Unit</span>
                </button>
                
                <button
                  onClick={handleExportLessonPlan}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                
                <button
                  onClick={handleSaveLessonPlan}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Plan</span>
                </button>
                
                <button
                  onClick={handleCreateNewAfterSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save & Create New</span>
                </button>
              </div>
            </div>
            
            {/* Save Status Message */}
            {saveStatus !== 'idle' && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                saveStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {saveStatus === 'success' ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Lesson plan saved successfully!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span>Failed to save lesson plan. Please try again.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lesson Plan Details */}
            <div className="lg:col-span-2">
              <LessonDropZone
                lessonPlan={currentLessonPlan}
                onActivityAdd={handleActivityAdd}
                onActivityRemove={handleActivityRemove}
                onActivityReorder={handleActivityReorder}
                onNotesUpdate={(notes) => {
                  const updatedPlan = { ...currentLessonPlan, notes };
                  setCurrentLessonPlan(updatedPlan);
                }}
                isEditing={true}
                onActivityClick={(activity) => setSelectedActivity(activity)}
              />
            </div>

            {/* Quick Activity Library */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <h3 className="text-lg font-semibold">Quick Add Activities</h3>
                  <p className="text-blue-100 text-sm">Select activities to add to your lesson plan</p>
                  
                  {/* Category Selector */}
                  <div className="mt-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                    >
                      <option value="all" className="text-gray-900">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category} className="text-gray-900">
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Mini search */}
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                    <input
                      type="text"
                      placeholder="Filter activities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Add Selected Button */}
                  {selectedActivities.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={addSelectedActivities}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add {selectedActivities.length} Selected {selectedActivities.length === 1 ? 'Activity' : 'Activities'}</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  {filteredAndSortedActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No matching activities found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAndSortedActivities.map((activity, index) => {
                        const activityId = `${activity.activity}-${activity.category}`;
                        const isSelected = selectedActivities.includes(activityId);
                        
                        return (
                          <div 
                            key={`${activityId}-${index}`}
                            className={`relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md ${
                              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => toggleActivitySelection(activityId)}
                          >
                            {/* Checkbox */}
                            <div className="absolute top-3 right-3 z-10">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-blue-600' : 'border-2 border-gray-300'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                            
                            <div className="pr-6">
                              <div className="flex items-start">
                                <div 
                                  className="w-1 h-full rounded-full flex-shrink-0 mr-2"
                                  style={{ 
                                    backgroundColor: activity.category ? 
                                      {
                                        'Welcome': '#F59E0B',
                                        'Kodaly Songs': '#8B5CF6',
                                        'Kodaly Action Songs': '#F97316',
                                        'Action/Games Songs': '#F97316',
                                        'Rhythm Sticks': '#D97706',
                                        'Scarf Songs': '#10B981',
                                        'General Game': '#3B82F6',
                                        'Core Songs': '#84CC16',
                                        'Parachute Games': '#EF4444',
                                        'Percussion Games': '#06B6D4',
                                        'Teaching Units': '#6366F1',
                                        'Goodbye': '#14B8A6'
                                      }[activity.category] || '#6B7280'
                                    : '#6B7280',
                                    minHeight: '40px'
                                  }}
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{activity.activity}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500">{activity.category}</span>
                                    {activity.level && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {activity.level}
                                      </span>
                                    )}
                                    {activity.time > 0 && (
                                      <span className="text-xs text-gray-500 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {activity.time}m
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onAddToLesson={() => {
            handleActivityAdd(selectedActivity);
            setSelectedActivity(null);
          }}
        />
      )}

      {/* Add to Unit Modal */}
      {showAddToUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Unit</h3>
            
            {units.length === 0 ? (
              <div className="text-center py-6">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No units available. Create a unit first in the Unit Manager.</p>
                <button
                  onClick={() => setShowAddToUnitModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Unit
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                
                {selectedUnit && (
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-800">
                      This lesson plan will be added to the selected unit and will appear in the Unit Viewer.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddToUnitModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToUnit}
                    disabled={!selectedUnit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Add to Unit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DndProvider>
  );
}