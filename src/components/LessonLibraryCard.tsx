import React, { useState } from 'react';
import { Clock, Users, ChevronRight, Tag, X, FileText, File } from 'lucide-react';
import type { LessonData, Activity } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { EyfsStandardsList } from './EyfsStandardsList';

interface LessonLibraryCardProps {
  lessonNumber: string;
  lessonData: LessonData;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  onExport: (type: 'pdf' | 'doc') => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
}

export function LessonLibraryCard({
  lessonNumber,
  lessonData,
  viewMode,
  onClick,
  onExport,
  theme
}: LessonLibraryCardProps) {
  const { getCategoryColor } = useSettings();
  const { eyfsStatements } = useData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
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
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
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
                <h1 className="text-2xl font-bold mb-1">
                  {lessonData.title || `Lesson ${lessonNumber}`}
                </h1>
                <p className="text-white text-opacity-90 text-lg">
                  {lessonData.totalTime} minutes • {lessonData.categoryOrder.length} categories • {totalActivities} activities
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onExport('pdf'); }}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="Export as PDF"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-base font-medium">PDF</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onExport('doc'); }}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="Export as DOCX"
                >
                  <File className="h-6 w-6" />
                  <span className="text-base font-medium">DOCX</span>
                </button>
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

          {/* EYFS Standards */}
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <EyfsStandardsList lessonNumber={lessonNumber} />
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
                          onClick={() => handleActivityClick(activity)}
                        >
                          {/* Activity Header */}
                          <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {activity.activity}
                              </h4>
                              {activity.time > 0 && (
                                <span className="ml-2 px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">
                                  {activity.time} mins
                                </span>
                              )}
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
                                dir="ltr"
                              />
                            )}
                            
                            {/* Description */}
                            <div 
                              className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formatDescription(activity.description) }}
                              dir="ltr"
                            />
                            
                            {/* Unit Name */}
                            {activity.unitName && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit:</span>
                                <p className="text-sm text-gray-700 font-medium" dir="ltr">{activity.unitName}</p>
                              </div>
                            )}
                          </div>
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
        className="bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer"
        style={{ borderLeftColor: theme.primary }}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">
              {lessonData.title || `Lesson ${lessonNumber}`}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{lessonData.totalTime} mins</span>
              <span>•</span>
              <span>{totalActivities} activities</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer hover:border-green-300"
        onClick={handleCardClick}
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
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
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
      className="bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden hover:scale-[1.02]"
      style={{ borderColor: theme.primary, borderWidth: '1px' }}
      onClick={handleCardClick}
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
            <ChevronRight className="h-5 w-5" />
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