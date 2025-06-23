import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  BookOpen, 
  Clock, 
  Tag,
  SortAsc,
  SortDesc,
  Eye,
  MoreVertical,
  Upload,
  Download,
  Edit3
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityDetails } from './ActivityDetails';
import { ActivityImporter } from './ActivityImporter';
import { ActivityCreator } from './ActivityCreator';
import { useData } from '../contexts/DataContext';
import { activitiesApi } from '../config/api';
import type { Activity } from '../contexts/DataContext';

interface ActivityLibraryProps {
  onActivitySelect: (activity: Activity) => void;
  selectedActivities: Activity[];
  className: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const categoryColors: Record<string, string> = {
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
};

export function ActivityLibrary({ 
  onActivitySelect, 
  selectedActivities, 
  className,
  selectedCategory = 'all',
  onCategoryChange
}: ActivityLibraryProps) {
  const { allLessonsData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<Activity | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [libraryActivities, setLibraryActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync local category with prop
  useEffect(() => {
    setLocalSelectedCategory(selectedCategory);
  }, [selectedCategory]);

  // Handle local category change
  const handleCategoryChange = (category: string) => {
    setLocalSelectedCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Load activities from server or extract from lessons data
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // Try to get activities from server
        let activities = [];
        try {
          activities = await activitiesApi.getAll();
        } catch (serverError) {
          console.warn('Failed to fetch activities from server:', serverError);
          
          // Fallback to localStorage
          const savedActivities = localStorage.getItem('library-activities');
          if (savedActivities) {
            activities = JSON.parse(savedActivities);
          }
        }
        
        // If we still don't have activities, extract from lessons data
        if (!activities || activities.length === 0) {
          const extractedActivities: Activity[] = [];
          Object.values(allLessonsData).forEach(lessonData => {
            Object.values(lessonData.grouped).forEach(categoryActivities => {
              extractedActivities.push(...categoryActivities);
            });
          });
          
          // Remove duplicates based on activity name and category
          activities = extractedActivities.filter((activity, index, self) => 
            index === self.findIndex(a => a.activity === activity.activity && a.category === activity.category)
          );
          
          // Save to localStorage
          localStorage.setItem('library-activities', JSON.stringify(activities));
          
          // Try to save to server
          try {
            activities.forEach(async (activity) => {
              if (!activity._id) {
                activity._id = `${activity.activity}-${activity.category}-${Date.now()}`;
              }
              await activitiesApi.create(activity);
            });
          } catch (saveError) {
            console.warn('Failed to save activities to server:', saveError);
          }
        }
        
        setLibraryActivities(activities);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [allLessonsData]);

  // Get unique categories and levels
  const categories = useMemo(() => {
    const cats = new Set(libraryActivities.map(a => a.category));
    return Array.from(cats).sort();
  }, [libraryActivities]);

  const levels = useMemo(() => {
    const lvls = new Set(libraryActivities.map(a => a.level).filter(Boolean));
    return Array.from(lvls).sort();
  }, [libraryActivities]);

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = libraryActivities.filter(activity => {
      const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = localSelectedCategory === 'all' || activity.category === localSelectedCategory;
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
  }, [libraryActivities, searchQuery, localSelectedCategory, selectedLevel, sortBy, sortOrder]);

  const handleActivityUpdate = async (updatedActivity: Activity) => {
    try {
      // Try to update on server
      try {
        if (updatedActivity._id) {
          await activitiesApi.update(updatedActivity._id, updatedActivity);
        } else {
          const newActivity = await activitiesApi.create(updatedActivity);
          updatedActivity._id = newActivity._id;
        }
      } catch (serverError) {
        console.warn('Failed to update activity on server:', serverError);
      }
      
      // Update local state
      setLibraryActivities(prev => 
        prev.map(activity => 
          (activity._id === updatedActivity._id || 
           (activity.activity === updatedActivity.activity && 
            activity.category === updatedActivity.category)) 
            ? updatedActivity : activity
        )
      );
      
      // Also update in localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        const updatedActivities = activities.map((activity: Activity) => 
          (activity._id === updatedActivity._id || 
           (activity.activity === updatedActivity.activity && 
            activity.category === updatedActivity.category)) 
            ? updatedActivity : activity
        );
        localStorage.setItem('library-activities', JSON.stringify(updatedActivities));
      }
      
      setEditingActivity(null);
      setSelectedActivityDetails(null);
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  const handleActivityDelete = async (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        const activity = libraryActivities.find(a => a.activity === activityId);
        
        // Try to delete from server
        if (activity && activity._id) {
          try {
            await activitiesApi.delete(activity._id);
          } catch (serverError) {
            console.warn('Failed to delete activity from server:', serverError);
          }
        }
        
        // Update local state
        setLibraryActivities(prev => prev.filter(a => a.activity !== activityId));
        
        // Also update in localStorage
        const savedActivities = localStorage.getItem('library-activities');
        if (savedActivities) {
          const activities = JSON.parse(savedActivities);
          const updatedActivities = activities.filter((a: Activity) => a.activity !== activityId);
          localStorage.setItem('library-activities', JSON.stringify(updatedActivities));
        }
      } catch (error) {
        console.error('Failed to delete activity:', error);
        alert('Failed to delete activity. Please try again.');
      }
    }
  };

  const handleActivityDuplicate = async (activity: Activity) => {
    const duplicatedActivity = {
      ...activity,
      _id: undefined, // Remove ID to create a new one
      activity: `${activity.activity} (Copy)`,
    };
    
    try {
      // Try to create on server
      let newActivity = duplicatedActivity;
      try {
        newActivity = await activitiesApi.create(duplicatedActivity);
      } catch (serverError) {
        console.warn('Failed to create duplicated activity on server:', serverError);
        // Generate a local ID
        newActivity = {
          ...duplicatedActivity,
          _id: `local-${Date.now()}`
        };
      }
      
      // Update local state
      setLibraryActivities(prev => [...prev, newActivity]);
      
      // Also update in localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        activities.push(newActivity);
        localStorage.setItem('library-activities', JSON.stringify(activities));
      }
    } catch (error) {
      console.error('Failed to duplicate activity:', error);
      alert('Failed to duplicate activity. Please try again.');
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleViewActivityDetails = (activity: Activity) => {
    setSelectedActivityDetails(activity);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setSelectedActivityDetails(activity);
  };

  const handleImportActivities = async (activities: Activity[]) => {
    try {
      setLoading(true);
      
      // Try to add each activity to the server
      for (const activity of activities) {
        if (!activity._id) {
          activity._id = `${activity.activity}-${activity.category}-${Date.now()}`;
        }
        
        try {
          await activitiesApi.create(activity);
        } catch (serverError) {
          console.warn('Failed to add imported activity to server:', serverError);
        }
      }
      
      // Update local state
      setLibraryActivities(prev => {
        // Remove duplicates based on activity name and category
        const existingActivities = new Map(prev.map(a => [`${a.activity}-${a.category}`, a]));
        
        // Add new activities, replacing existing ones with the same name and category
        activities.forEach(activity => {
          existingActivities.set(`${activity.activity}-${activity.category}`, activity);
        });
        
        return Array.from(existingActivities.values());
      });
      
      // Also update in localStorage
      localStorage.setItem('library-activities', JSON.stringify([...libraryActivities, ...activities]));
      
      setShowImporter(false);
    } catch (error) {
      console.error('Failed to import activities:', error);
      alert('Failed to import activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (newActivity: Activity) => {
    try {
      setLoading(true);
      
      // Try to add the activity to the server
      let createdActivity = newActivity;
      try {
        createdActivity = await activitiesApi.create(newActivity);
      } catch (serverError) {
        console.warn('Failed to create activity on server:', serverError);
        // Generate a local ID
        createdActivity = {
          ...newActivity,
          _id: `local-${Date.now()}`
        };
      }
      
      // Update local state
      setLibraryActivities(prev => [...prev, createdActivity]);
      
      // Also update in localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        activities.push(createdActivity);
        localStorage.setItem('library-activities', JSON.stringify(activities));
      } else {
        localStorage.setItem('library-activities', JSON.stringify([createdActivity]));
      }
      
      setShowCreator(false);
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
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
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Activity</span>
            </button>
            
            <button
              onClick={() => setShowImporter(true)}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Import/Export</span>
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
          
          <div className="flex items-center space-x-2">
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
            
            <div className="flex items-center space-x-2 ml-auto">
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
        </div>
      </div>

      {/* Activity Grid */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : filteredAndSortedActivities.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">
              {searchQuery || localSelectedCategory !== 'all' || selectedLevel !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No activities available in the library'
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
            {filteredAndSortedActivities.map((activity, index) => (
              <div key={`${activity._id || activity.activity}-${activity.category}-${index}`} className="relative group h-full">
                {/* Edit button with larger hit area */}
                <button 
                  className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditActivity(activity);
                  }}
                  title="Edit Activity"
                >
                  <Edit3 className="h-4 w-4 text-gray-600" />
                </button>
                
                <ActivityCard
                  activity={activity}
                  onUpdate={handleActivityUpdate}
                  onDelete={handleActivityDelete}
                  onDuplicate={handleActivityDuplicate}
                  isEditing={false}
                  onEditToggle={() => handleEditActivity(activity)}
                  categoryColor={categoryColors[activity.category] || '#6B7280'}
                  viewMode={viewMode === 'grid' ? 'detailed' : viewMode === 'list' ? 'compact' : 'minimal'}
                  onActivityClick={handleViewActivityDetails}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {selectedActivityDetails && (
        <ActivityDetails
          activity={selectedActivityDetails}
          onClose={() => {
            setSelectedActivityDetails(null);
            setEditingActivity(null);
          }}
          onAddToLesson={() => {
            onActivitySelect(selectedActivityDetails);
            setSelectedActivityDetails(null);
          }}
          isEditing={selectedActivityDetails === editingActivity}
          onUpdate={(updatedActivity) => {
            handleActivityUpdate(updatedActivity);
            setEditingActivity(null);
            setSelectedActivityDetails(null);
          }}
        />
      )}

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