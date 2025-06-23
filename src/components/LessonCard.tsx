import React from 'react';
import { Clock, Users, ChevronRight, Tag } from 'lucide-react';
import type { LessonData, Activity } from '../contexts/DataContext';
import { useData } from '../contexts/DataContext';

interface LessonCardProps {
  lessonNumber: string;
  lessonData: LessonData;
  isSelected: boolean;
  onSelect: (lessonNumber: string) => void;
  onActivityClick: (activity: Activity) => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
}

const categoryColors: Record<string, string> = {
  'Welcome': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Kodaly Songs': 'bg-purple-100 text-purple-800 border-purple-200',
  'Kodaly Action Songs': 'bg-orange-100 text-orange-800 border-orange-200',
  'Action/Games Songs': 'bg-orange-100 text-orange-800 border-orange-200',
  'Rhythm Sticks': 'bg-amber-100 text-amber-800 border-amber-200',
  'Scarf Songs': 'bg-green-100 text-green-800 border-green-200',
  'General Game': 'bg-blue-100 text-blue-800 border-blue-200',
  'Core Songs': 'bg-lime-100 text-lime-800 border-lime-200',
  'Parachute Games': 'bg-red-100 text-red-800 border-red-200',
  'Percussion Games': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Teaching Units': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Goodbye': 'bg-teal-100 text-teal-800 border-teal-200'
};

const categoryIndicatorColors: Record<string, string> = {
  'Welcome': 'bg-yellow-500',
  'Kodaly Songs': 'bg-purple-500',
  'Kodaly Action Songs': 'bg-orange-500',
  'Action/Games Songs': 'bg-orange-500',
  'Rhythm Sticks': 'bg-amber-500',
  'Scarf Songs': 'bg-green-500',
  'General Game': 'bg-blue-500',
  'Core Songs': 'bg-lime-500',
  'Parachute Games': 'bg-red-500',
  'Percussion Games': 'bg-cyan-500',
  'Teaching Units': 'bg-indigo-500',
  'Goodbye': 'bg-teal-500'
};

export function LessonCard({
  lessonNumber,
  lessonData,
  isSelected,
  onSelect,
  onActivityClick,
  theme
}: LessonCardProps) {
  const { eyfsStatements } = useData();
  
  // Safely calculate total activities
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

  // Safely get category order
  const categoryOrder = React.useMemo(() => {
    try {
      return lessonData?.categoryOrder || [];
    } catch (error) {
      console.error('Error getting category order:', error);
      return [];
    }
  }, [lessonData]);

  // Safely get total time
  const totalTime = React.useMemo(() => {
    try {
      return lessonData?.totalTime || 0;
    } catch (error) {
      console.error('Error getting total time:', error);
      return 0;
    }
  }, [lessonData]);

  // Get EYFS standards count
  const eyfsCount = (eyfsStatements[lessonNumber] || []).length;

  if (!lessonData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No data available for Lesson {lessonNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer w-full overflow-hidden ${
        isSelected 
          ? 'ring-4 ring-opacity-30' 
          : 'border-gray-200 hover:border-gray-300 hover:scale-[1.02]'
      }`}
      style={{
        borderColor: isSelected ? theme.primary : undefined,
        ringColor: isSelected ? theme.primary : undefined
      }}
      onClick={() => onSelect(isSelected ? '' : lessonNumber)}
    >
      {/* Colorful Header */}
      <div 
        className="p-6 text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">
              Lesson {lessonNumber}
            </h3>
            <ChevronRight 
              className={`h-6 w-6 transition-transform duration-300 ${
                isSelected ? 'rotate-90' : ''
              }`} 
            />
          </div>

          <div className="flex items-center space-x-6 text-white text-opacity-90">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">{totalTime} mins</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">{totalActivities} activities</span>
            </div>
            {eyfsCount > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span className="font-medium">{eyfsCount} EYFS</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="p-6">
        <div className="flex flex-wrap gap-2">
          {categoryOrder.slice(0, 4).map((category) => (
            <span
              key={category}
              className={`px-3 py-2 rounded-full text-sm font-medium border shadow-sm ${
                categoryColors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              {category}
            </span>
          ))}
          {categoryOrder.length > 4 && (
            <span className="px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
              +{categoryOrder.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isSelected && (
        <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
          <div className="p-6 space-y-6">
            {categoryOrder.map((category) => {
              const activities = lessonData.grouped[category] || [];
              
              return (
                <div key={category} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-3">
                    <span
                      className={`w-4 h-4 rounded ${
                        categoryIndicatorColors[category] || 'bg-gray-400'
                      }`}
                    ></span>
                    <span className="text-lg">{category}</span>
                    <span className="text-sm text-gray-500 font-normal bg-gray-100 px-2 py-1 rounded-full">
                      {activities.length}
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <button
                        key={`${category}-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivityClick(activity);
                        }}
                        className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md group"
                        style={{
                          '--hover-border-color': theme.primary,
                          '--hover-bg-color': `${theme.primary}10`
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = theme.primary;
                          e.currentTarget.style.backgroundColor = `${theme.primary}10`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p 
                              className="font-semibold text-gray-900 text-base mb-2 transition-colors group-hover:text-blue-700"
                              style={{ '--hover-text-color': theme.secondary } as React.CSSProperties}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = theme.secondary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '';
                              }}
                            >
                              {activity.activity || 'Untitled Activity'}
                            </p>
                            {activity.level && (
                              <span 
                                className="inline-block px-3 py-1 text-white text-xs font-medium rounded-full mb-2"
                                style={{ backgroundColor: theme.primary }}
                              >
                                {activity.level}
                              </span>
                            )}
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {activity.description || 'No description available'}
                            </p>
                          </div>
                          {activity.time > 0 && (
                            <span className="text-sm text-gray-500 font-medium ml-4 flex-shrink-0 bg-gray-100 px-2 py-1 rounded-full">
                              {activity.time}m
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}