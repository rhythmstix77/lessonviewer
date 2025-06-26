import React, { useState, useRef, useEffect } from 'react';
import { Clock, Users, Tag, X, ExternalLink, FileText, Edit3, Save, FolderPlus, ChevronDown, Trash2 } from 'lucide-react';
import type { LessonData, Activity } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { RichTextEditor } from './RichTextEditor';

interface HalfTerm {
  id: string;
  name: string;
  months: string;
}

interface LessonLibraryCardProps {
  lessonNumber: string;
  lessonData: LessonData;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
  halfTerms?: HalfTerm[];
  onDelete?: (lessonNumber: string) => void;
}

export function LessonLibraryCard({
  lessonNumber,
  lessonData,
  viewMode,
  onClick,
  theme,
  onAssignToUnit,
  halfTerms = [],
  onDelete
}: LessonLibraryCardProps) {
  const { getCategoryColor } = useSettings();
  const { eyfsStatements, updateLessonTitle } = useData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Calculate total activities
  const totalActivities = React.useMemo(() => {
    try {
      if (!lessonData || !lessonData.grouped) return 0;
      return Object.values(lessonData.grouped).reduce(
        (sum, activities) => sum + (Array.isArray(activities) ? activities.length : 0),
        0
      );
    } catch (error) {
      console.error('Error calculating total activities:', error);
      return 0;
    }
  }, [lessonData]);

  // Get first activity description for preview
  const getFirstActivityDescription = () => {
    if (!lessonData || !lessonData.categoryOrder.length) return '';
    
    const firstCategory = lessonData.categoryOrder[0];
    const activities = lessonData.grouped[firstCategory];
    
    if (!activities || !activities.length) return '';
    
    const description = activities[0].description;
    // Remove HTML tags for plain text preview
    return description.replace(/<[^>]*>/g, '').substring(0, 100) + (description.length > 100 ? '...' : '');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAssignDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded) {
      // If already expanded, don't do anything (let inner elements handle their own clicks)
      return;
    }
    setIsExpanded(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    setSelectedActivity(null);
    setEditingActivity(null);
    setEditedTitle(null);
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity({...activity});
  };

  const handleSaveActivity = (activity: Activity) => {
    // Update the activity in the lesson data
    const updatedLessonData = {...lessonData};
    const category = activity.category;
    
    if (updatedLessonData.grouped[category]) {
      const activityIndex = updatedLessonData.grouped[category].findIndex(a => 
        a.activity === activity.activity && a._id === activity._id
      );
      
      if (activityIndex !== -1) {
        updatedLessonData.grouped[category][activityIndex] = activity;
        
        // Save to localStorage
        const savedData = localStorage.getItem(`lesson-data-${activity.lessonNumber}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          parsedData.allLessonsData[lessonNumber] = updatedLessonData;
          localStorage.setItem(`lesson-data-${activity.lessonNumber}`, JSON.stringify(parsedData));
        }
        
        // Update the state
        setEditingActivity(null);
        setSelectedActivity(null);
      }
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle !== null) {
      updateLessonTitle(lessonNumber, editedTitle);
      setEditedTitle(null);
    }
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAssignDropdown(!showAssignDropdown);
  };

  const handleAssignToHalfTerm = (halfTermId: string) => {
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
      setShowAssignDropdown(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(lessonNumber);
    }
  };

  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    
    // If already HTML, return as is
    if (text.includes('<')) {
      return text;
    }
    
    // Replace newlines with <br> tags
    return text.replace(/\n/g, '<br>');
  };

  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div 
            className="p-6 text-white relative"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                {editedTitle !== null ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-2xl font-bold bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditedTitle(null)}
                      className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold mb-1 flex items-center space-x-2">
                    <span>{lessonData.title || `Lesson ${lessonNumber}`}</span>
                    <button
                      onClick={() => setEditedTitle(lessonData.title || `Lesson ${lessonNumber}`)}
                      className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                      title="Edit lesson title"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </h1>
                )}
                <p className="text-white text-opacity-90 text-lg">
                  {lessonData.totalTime} minutes • {lessonData.categoryOrder.length} categories • {totalActivities} activities
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {onAssignToUnit && halfTerms.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={handleAssignClick}
                      className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      title="Assign to Unit"
                    >
                      <FolderPlus className="h-6 w-6" />
                      <span className="text-base font-medium">Assign to Unit</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAssignDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showAssignDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200 dropdown-menu">
                        <div className="p-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700">Select Half-Term</h3>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto">
                          {halfTerms.map(halfTerm => (
                            <button
                              key={halfTerm.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignToHalfTerm(halfTerm.id);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              {halfTerm.name} ({halfTerm.months})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {onDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="p-3 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-all duration-200 flex items-center space-x-2"
                    title="Delete Lesson"
                  >
                    <Trash2 className="h-6 w-6" />
                    <span className="text-base font-medium">Delete</span>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Categories and Activities */}
            <div className="space-y-8">
              {lessonData.categoryOrder.map((category) => {
                const activities = lessonData.grouped[category] || [];
                
                return (
                  <div key={category} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Category Header */}
                    <div 
                      className="p-4 border-b border-gray-200"
                      style={{ 
                        background: `linear-gradient(to right, ${getCategoryColor(category)}20, ${getCategoryColor(category)}05)`,
                        borderLeft: `4px solid ${getCategoryColor(category)}`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">{category}</h3>
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm" style={{ color: getCategoryColor(category) }}>
                          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Activities */}
                    <div className="p-4 space-y-6">
                      {activities.map((activity, index) => (
                        <div 
                          key={`${category}-${index}`}
                          className="bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md"
                        >
                          {editingActivity && editingActivity.activity === activity.activity && editingActivity.category === activity.category ? (
                            <div className="p-4">
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Activity Name
                                </label>
                                <input
                                  type="text"
                                  value={editingActivity.activity}
                                  onChange={(e) => setEditingActivity({...editingActivity, activity: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <RichTextEditor
                                  value={editingActivity.description}
                                  onChange={(value) => setEditingActivity({...editingActivity, description: value})}
                                  placeholder="Enter activity description..."
                                  minHeight="150px"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingActivity(null)}
                                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveActivity(editingActivity)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                                >
                                  <Save className="h-4 w-4" />
                                  <span>Save Changes</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Activity Header */}
                              <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {activity.activity}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    {activity.time > 0 && (
                                      <span className="ml-2 px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">
                                        {activity.time} mins
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleEditActivity(activity)}
                                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                {activity.level && (
                                  <div className="mt-2">
                                    <span 
                                      className="px-3 py-1 text-white text-sm font-medium rounded-full"
                                      style={{ backgroundColor: getCategoryColor(category) }}
                                    >
                                      {activity.level}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Activity Content */}
                              <div className="p-4">
                                {/* Activity Text (if available) */}
                                {activity.activityText && (
                                  <div 
                                    className="mb-4 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: activity.activityText }}
                                  />
                                )}
                                
                                {/* Description */}
                                <div 
                                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: formatDescription(activity.description) }}
                                />
                                
                                {/* Unit Name */}
                                {activity.unitName && (
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit:</span>
                                    <p className="text-sm text-gray-700 font-medium">{activity.unitName}</p>
                                  </div>
                                )}
                                
                                {/* Web Links Section - Prominently displayed */}
                                {(activity.videoLink || activity.musicLink || activity.backingLink || 
                                  activity.resourceLink || activity.link || activity.vocalsLink || 
                                  activity.imageLink) && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                                      <FileText className="h-4 w-4 mr-1" />
                                      Web Resources
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      {activity.videoLink && (
                                        <a 
                                          href={activity.videoLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Video</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                      {activity.musicLink && (
                                        <a 
                                          href={activity.musicLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Music</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                      {activity.backingLink && (
                                        <a 
                                          href={activity.backingLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Backing</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                      {activity.resourceLink && (
                                        <a 
                                          href={activity.resourceLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Resource</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                      {activity.link && (
                                        <a 
                                          href={activity.link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Link</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                      {activity.vocalsLink && (
                                        <a 
                                          href={activity.vocalsLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Vocals</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                      {activity.imageLink && (
                                        <a 
                                          href={activity.imageLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 p-2 rounded-lg border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-sm font-medium">Image</span>
                                          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer relative"
        style={{ borderLeftColor: theme.primary }}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{lessonData.title || `Lesson ${lessonNumber}`}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{lessonData.totalTime} mins</span>
              <span>•</span>
              <span>{totalActivities} activities</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lessonNumber);
                }}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete Lesson"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer hover:border-green-300 relative"
        onClick={onClick}
      >
        <div className="flex items-start">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mr-4"
            style={{ backgroundColor: theme.primary }}
          >
            {lessonNumber}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-base truncate" dir="ltr">
                {lessonData.title || `Lesson ${lessonNumber}`}
              </h4>
              <div className="flex items-center space-x-1">
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lessonNumber);
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 mr-1"
                    title="Delete Lesson"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{lessonData.totalTime} mins</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{totalActivities} activities</span>
              </div>
            </div>
            
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
        </div>
      </div>
    );
  }

  // Default grid view
  return (
    <div 
      className="bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden hover:scale-[1.02] relative"
      style={{ borderColor: theme.primary, borderWidth: '1px' }}
      onClick={onClick}
    >
      {/* Colorful Header */}
      <div 
        className="p-4 text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
        }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">
              Lesson {lessonNumber}
            </h3>
            <div className="flex items-center space-x-1">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(lessonNumber);
                  }}
                  className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                  title="Delete Lesson"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-white text-opacity-90 text-sm font-medium" dir="ltr">
            {lessonData.title || `Lesson ${lessonNumber}`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center space-x-4 text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{lessonData.totalTime} mins</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">{totalActivities} activities</span>
          </div>
        </div>
        
        {/* Categories */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {lessonData.categoryOrder.slice(0, 4).map(category => (
              <span 
                key={category}
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${getCategoryColor(category)}20`,
                  color: getCategoryColor(category)
                }}
              >
                {category}
              </span>
            ))}
            {lessonData.categoryOrder.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                +{lessonData.categoryOrder.length - 4}
              </span>
            )}
          </div>
        </div>
        
        {/* Description Preview */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2" dir="ltr">
            {getFirstActivityDescription()}
          </p>
        </div>
      </div>
    </div>
  );
}