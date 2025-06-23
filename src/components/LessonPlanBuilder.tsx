import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Calendar, 
  Plus, 
  Save, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  Users, 
  BookOpen,
  Download,
  Share2,
  Upload,
  Filter,
  Search,
  Grid3X3,
  List,
  Tag,
  SortAsc,
  SortDesc,
  MoreVertical,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  Volume2,
  Image,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Play,
  Pause,
  ChevronDown
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { LessonDropZone } from './LessonDropZone';
import { ActivityImporter } from './ActivityImporter';
import { ActivityCreator } from './ActivityCreator';
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
}

export function LessonPlanBuilder() {
  const { currentSheetInfo, allLessonsData } = useData();
  const [currentView, setCurrentView] = useState<'library' | 'builder'>('builder');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [libraryActivities, setLibraryActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedResource, setSelectedResource] = useState<{url: string, title: string, type: string} | null>(null);

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

    // Create a default lesson plan if none exists
    if (!currentLessonPlan) {
      const newPlan: LessonPlan = {
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
      };
      setCurrentLessonPlan(newPlan);
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
    const updatedPlans = lessonPlans.map(plan => 
      plan.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date() } : plan
    );
    
    if (!lessonPlans.find(plan => plan.id === updatedPlan.id)) {
      updatedPlans.push({ ...updatedPlan, updatedAt: new Date() });
    }
    
    saveLessonPlans(updatedPlans);
    setCurrentLessonPlan(updatedPlan);
  };

  const handleActivityAdd = (activity: Activity) => {
    if (currentLessonPlan) {
      const updatedPlan = {
        ...currentLessonPlan,
        activities: [...currentLessonPlan.activities, activity],
        duration: currentLessonPlan.duration + activity.time,
      };
      setCurrentLessonPlan(updatedPlan);
    }
  };

  const handleActivityRemove = (activityIndex: number) => {
    if (currentLessonPlan) {
      const removedActivity = currentLessonPlan.activities[activityIndex];
      const updatedPlan = {
        ...currentLessonPlan,
        activities: currentLessonPlan.activities.filter((_, index) => index !== activityIndex),
        duration: currentLessonPlan.duration - removedActivity.time,
      };
      setCurrentLessonPlan(updatedPlan);
    }
  };

  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    if (currentLessonPlan) {
      const draggedActivity = currentLessonPlan.activities[dragIndex];
      const newActivities = [...currentLessonPlan.activities];
      newActivities.splice(dragIndex, 1);
      newActivities.splice(hoverIndex, 0, draggedActivity);
      
      setCurrentLessonPlan({
        ...currentLessonPlan,
        activities: newActivities,
      });
    }
  };

  const handleSaveLessonPlan = () => {
    if (currentLessonPlan) {
      handleUpdateLessonPlan(currentLessonPlan);
      setIsEditing(false);
    }
  };

  const handleExportLessonPlan = () => {
    if (currentLessonPlan) {
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
    }
  };

  const handleImportActivities = (activities: Activity[]) => {
    // Merge with existing activities, avoiding duplicates
    const existingActivities = new Set(libraryActivities.map(a => `${a.activity}-${a.category}`));
    const newActivities = activities.filter(a => !existingActivities.has(`${a.activity}-${a.category}`));
    
    const updatedLibrary = [...libraryActivities, ...newActivities];
    saveLibraryActivities(updatedLibrary);
    
    console.log(`Imported ${newActivities.length} new activities. Total library now: ${updatedLibrary.length}`);
  };

  const handleCreateActivity = (newActivity: Activity) => {
    // Add the new activity to the library
    const updatedLibrary = [...libraryActivities, newActivity];
    saveLibraryActivities(updatedLibrary);
    console.log('New activity created:', newActivity);
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

  return (
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
                onClick={() => setShowCreator(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Activity</span>
              </button>
              
              <button
                onClick={() => setShowImporter(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Import Activities</span>
              </button>

              {currentLessonPlan && (
                <>
                  <button
                    onClick={handleExportLessonPlan}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  
                  {isEditing ? (
                    <button
                      onClick={handleSaveLessonPlan}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Plan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Plan</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* View Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setCurrentView('builder')}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 ${
                currentView === 'builder' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Plan Builder</span>
            </button>
            <button
              onClick={() => setCurrentView('library')}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 ${
                currentView === 'library' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Activity Library</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'library' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Library Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-bold">Activity Library</h2>
                    <p className="text-purple-100 text-sm">
                      {filteredAndSortedActivities.length} of {libraryActivities.length} activities
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <Grid3X3 className="h-5 w-5" />
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                >
                  <option value="all" className="text-gray-900">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="text-gray-900">
                      {category}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                >
                  <option value="all" className="text-gray-900">All Levels</option>
                  {levels.map(level => (
                    <option key={level} value={level} className="text-gray-900">
                      {level}
                    </option>
                  ))}
                </select>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleSort('category')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      sortBy === 'category' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                    {sortBy === 'category' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                  </button>
                  <button
                    onClick={() => toggleSort('time')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      sortBy === 'time' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    {sortBy === 'time' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Grid */}
            <div className="p-6">
              {filteredAndSortedActivities.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                  <p className="text-gray-600">
                    {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No activities available in the library'
                    }
                  </p>
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      onClick={() => setShowCreator(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Activity</span>
                    </button>
                    <button
                      onClick={() => setShowImporter(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Import Activities</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`
                  ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
                    viewMode === 'list' ? 'space-y-4' :
                    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
                  }
                `}>
                  {filteredAndSortedActivities.map((activity, index) => (
                    <div 
                      key={`${activity.activity}-${activity.category}-${index}`}
                      onClick={() => handleActivityAdd(activity)}
                      className="cursor-pointer"
                    >
                      <ActivityCard 
                        key={`${activity.activity}-${activity.category}-${index}`}
                        activity={activity}
                        categoryColor={activity.category ? 
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
                        : '#6B7280'}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'builder' && currentLessonPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lesson Plan Details */}
            <div className="lg:col-span-2">
              <LessonDropZone
                lessonPlan={currentLessonPlan}
                onActivityAdd={handleActivityAdd}
                onActivityRemove={handleActivityRemove}
                onActivityReorder={handleActivityReorder}
                onNotesUpdate={(notes) => setCurrentLessonPlan(prev => prev ? { ...prev, notes } : null)}
                isEditing={isEditing}
              />
            </div>

            {/* Quick Activity Library */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <h3 className="text-lg font-semibold">Quick Add Activities</h3>
                  <p className="text-purple-100 text-sm">Drag activities to your lesson plan</p>
                  
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                    <input
                      type="text"
                      placeholder="Filter activities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  {filteredAndSortedActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No matching activities found</p>
                      <div className="mt-4 flex justify-center space-x-2">
                        <button
                          onClick={() => setShowCreator(true)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Create</span>
                        </button>
                        <button
                          onClick={() => setShowImporter(true)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-1"
                        >
                          <Upload className="h-3 w-3" />
                          <span>Import</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAndSortedActivities.map((activity, index) => (
                        <ActivityCard 
                          key={`${activity.activity}-${activity.category}-${index}`}
                          activity={activity}
                          categoryColor={activity.category ? 
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
                          : '#6B7280'}
                          viewMode="compact"
                          onActivityClick={handleActivityAdd}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Creator Modal */}
      {showCreator && (
        <ActivityCreator 
          onSave={handleCreateActivity}
          onClose={() => setShowCreator(false)}
          categories={categories}
          levels={levels}
        />
      )}

      {/* Activity Importer Modal */}
      {showImporter && (
        <ActivityImporter 
          onImport={handleImportActivities}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  );
}