import React from 'react';
import { Clock, Users, ChevronRight, Tag } from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';

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
}

export function LessonLibraryCard({
  lessonNumber,
  lessonData,
  viewMode,
  onClick,
  theme
}: LessonLibraryCardProps) {
  const { getCategoryColor } = useSettings();
  
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

  if (viewMode === 'compact') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer"
        style={{ borderLeftColor: theme.primary }}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">
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
              <h4 className="font-semibold text-gray-900 text-base truncate">
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
            <ChevronRight className="h-5 w-5" />
          </div>

          <p className="text-white text-opacity-90 text-sm font-medium">
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
          <p className="text-sm text-gray-600 line-clamp-2">
            {getFirstActivityDescription()}
          </p>
        </div>
      </div>
    </div>
  );
}