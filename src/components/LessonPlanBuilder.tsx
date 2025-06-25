import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Save, 
  Clock, 
  Users, 
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
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { LessonDropZone } from './LessonDropZone';
import { ActivityDetails } from './ActivityDetails';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Activity } from '../contexts/DataContext';

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

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
  title?: string;
  term?: string;
}

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

interface LessonPlanBuilderProps {
  initialLessonId?: string | null;
  onLessonLoaded?: () => void;
}

export function LessonPlanBuilder({ initialLessonId, onLessonLoaded }: LessonPlanBuilderProps) {
  const { currentSheetInfo, allLessonsData } = useData();
  const { categories } = useSettings();
  
  // Initialize currentLessonPlan with a default value instead of null
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan>(() => ({
    id: `plan-${Date.now()}`,
    date: new Date(),
    week: 1,
    className: currentSheetInfo.sheet,
    activities: [],
    duration: 0,
    notes: '',
    status: 'draft', // Changed from 'planned' to 'draft' to be more accurate
    title: '', // Empty title by default
    term: 'A1', // Default to Autumn 1
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
  }, [allLessonsData, currentSheetInfo.sheet]);

  // Load initial lesson if provided
  useEffect(() => {
    if (initialLessonId) {
      // First check if it's a lesson plan ID
      const existingPlan = lessonPlans.find(plan => plan.id === initialLessonId);
      
      if (existingPlan) {
        setCurrentLessonPlan(existingPlan);
        if (onLessonLoaded) onLessonLoaded();
        return;
      }
      
      // If not a plan ID, check if it's a lesson number
      const lessonData = allLessonsData[initialLessonId];
      
      if (lessonData) {
        // Create a new lesson plan from the lesson data
        const activities: Activity[] = [];
        let totalDuration = 0;
        
        // Collect all activities from the lesson
        lessonData.categoryOrder.forEach(category => {
          const categoryActivities = lessonData.grouped[category] || [];
          activities.push(...categoryActivities);
          
          // Calculate total duration
          categoryActivities.forEach(activity => {
            totalDuration += activity.time || 0;
          });
        });
        
        // Create a new plan
        const newPlan: LessonPlan = {
          id: `plan-${Date.now()}`,
          date: new Date(),
          week: 1,
          className: currentSheetInfo.sheet,
          activities,
          duration: totalDuration,
          notes: '',
          status: 'draft',
          title: lessonData.title || `Lesson ${initialLessonId}`,
          term: 'A1', // Default to Autumn 1
          createdAt: new Date(),
          updatedAt: new Date(),
          lessonNumber: initialLessonId
        };
        
        setCurrentLessonPlan(newPlan);
        if (onLessonLoaded) onLessonLoaded();
      }
    }
  }, [initialLessonId, lessonPlans, allLessonsData, currentSheetInfo.sheet, onLessonLoaded]);

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
      // Validate that the plan has a title
      if (!updatedPlan.title.trim()) {
        alert('Please provide a unit name');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return false;
      }
      
      const updatedPlans = lessonPlans.map(plan => 
        plan.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date() } : plan
      );
      
      if (!lessonPlans.find(plan => plan.id === updatedPlan.id)) {
        updatedPlans.push({ ...updatedPlan, updatedAt: new Date() });
      }
      
      saveLessonPlans(updatedPlans);
      setCurrentLessonPlan(updatedPlan);
      setSaveStatus('success');
      setHasUnsavedChanges(false);
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
    
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, uniqueActivity],
      duration: currentLessonPlan.duration + (uniqueActivity.time || 0),
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleActivityRemove = (activityIndex: number) => {
    const removedActivity = currentLessonPlan.activities[activityIndex];
    const updatedPlan = {
      ...currentLessonPlan,
      activities: currentLessonPlan.activities.filter((_, index) => index !== activityIndex),
      duration: currentLessonPlan.duration - (removedActivity.time || 0),
    };
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handleSaveLessonPlan = () => {
    const success = handleUpdateLessonPlan(currentLessonPlan);
    if (success) {
      setHasUnsavedChanges(false);
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
        status: 'draft',
        title: '',
        term: currentLessonPlan.term, // Keep the same term
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentLessonPlan(newPlan);
      setHasUnsavedChanges(false);
    }
  };

  // Navigation between lessons
  const navigateToLesson = (direction: 'prev' | 'next') => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmNavigation = window.confirm('You have unsaved changes. Do you want to continue without saving?');
      if (!confirmNavigation) {
        return;
      }
    }
    
    // Find the current lesson in the list of saved lessons
    const currentIndex = lessonPlans.findIndex(plan => plan.id === currentLessonPlan.id);
    
    if (currentIndex === -1) {
      // Current lesson is not saved yet
      if (direction === 'prev' && lessonPlans.length > 0) {
        // Navigate to the last saved lesson
        setCurrentLessonPlan(lessonPlans[lessonPlans.length - 1]);
      } else if (direction === 'next') {
        // Create a new lesson
        handleCreateNewAfterSave();
      }
    } else {
      // Current lesson is in the list
      if (direction === 'prev' && currentIndex > 0) {
        setCurrentLessonPlan(lessonPlans[currentIndex - 1]);
      } else if (direction === 'next' && currentIndex < lessonPlans.length - 1) {
        setCurrentLessonPlan(lessonPlans[currentIndex + 1]);
      } else if (direction === 'next' && currentIndex === lessonPlans.length - 1) {
        // Create a new lesson
        handleCreateNewAfterSave();
      }
    }
    
    setHasUnsavedChanges(false);
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
  const uniqueCategories = React.useMemo(() => {
    const cats = new Set(libraryActivities.map(a => a.category));
    return Array.from(cats).sort();
  }, [libraryActivities]);

  const uniqueLevels = React.useMemo(() => {
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
    setHasUnsavedChanges(true);
    
    // Clear selections after adding
    setSelectedActivities([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  setHasUnsavedChanges(true);
                }}
                isEditing={true}
                onActivityClick={(activity) => setSelectedActivity(activity)}
                onSave={handleSaveLessonPlan}
                onSaveAndCreate={handleCreateNewAfterSave}
              />
            </div>

            {/* Activity Library Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden sticky top-8">
                {/* Library Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                  <h3 className="text-lg font-semibold mb-2">Activity Library</h3>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex space-x-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                    >
                      <option value="all" className="text-gray-900">All Categories</option>
                      {categories.map(category => (
                        <option key={category.name} value={category.name} className="text-gray-900">
                          {category.name}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                    >
                      <option value="all" className="text-gray-900">All Levels</option>
                      <option value="All" className="text-gray-900">All</option>
                      <option value="LKG" className="text-gray-900">LKG</option>
                      <option value="UKG" className="text-gray-900">UKG</option>
                      <option value="Reception" className="text-gray-900">Reception</option>
                      {uniqueLevels.filter(level => !['All', 'LKG', 'UKG', 'Reception'].includes(level)).map(level => (
                        <option key={level} value={level} className="text-gray-900">
                          {level}
                        </option>
                      ))}
                    </select>
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
                
                {/* Activity List */}
                <div className="p-3 max-h-[600px] overflow-y-auto">
                  {filteredAndSortedActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No matching activities found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
                                      categories.find(cat => cat.name === activity.category)?.color || '#6B7280'
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
                <span>Failed to save unit. Please ensure you've provided a unit name.</span>
              </>
            )}
          </div>
        </div>
      )}
    </DndProvider>
  );
}