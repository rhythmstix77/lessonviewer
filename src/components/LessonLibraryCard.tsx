import React, { useState } from 'react';
import { Clock, Users, Tag, Star, ChevronRight } from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';

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
  isSelected?: boolean;
  onToggleSelection?: (lessonNumber: string) => void;
}

// Map term IDs to readable names
const TERM_NAMES: Record<string, string> = {
  'A1': 'Autumn 1',
  'A2': 'Autumn 2',
  'SP1': 'Spring 1',
  'SP2': 'Spring 2',
  'SM1': 'Summer 1',
  'SM2': 'Summer 2',
};

export function LessonLibraryCard({
  lessonNumber,
  lessonData,
  viewMode,
  onClick,
  theme,
  onAssignToUnit,
  halfTerms = [],
  isSelected = false,
  onToggleSelection
}: LessonLibraryCardProps) {
  const { getCategoryColor } = useSettings();
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Calculate total activities
  const totalActivities = React.useMemo(() => {
    return Object.values(lessonData.grouped).reduce((total, activities) => total + activities.length, 0);
  }, [lessonData.grouped]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get term name from term ID
  const getTermName = (termId?: string) => {
    if (!termId) return 'Not assigned';
    return TERM_NAMES[termId] || termId;
  };

  // Get a brief preview of the description
  const getDescriptionPreview = () => {
    if (!lessonData.title) return '';
    
    // Remove HTML tags for plain text preview
    const plainText = lessonData.title.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAssignModal(true);
  };

  const handleAssignToHalfTerm = (halfTermId: string) => {
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
    }
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onToggleSelection) {
      onToggleSelection(lessonNumber);
    }
  };

  if (viewMode === 'compact') {
    return (
      <div className="relative group">
        <div 
          className="bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer h-full"
          style={{ borderLeftColor: theme.primary }}
          onClick={onClick}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{lessonData.title || `Lesson ${lessonNumber}`}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{lessonData.totalTime} mins</span>
                <span>•</span>
                <span>{totalActivities} activities</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Star icon for selection */}
        {onToggleSelection && (
          <div 
            className="absolute top-2 right-2 z-10"
            onClick={handleStarClick}
          >
            <Star 
              className={`h-5 w-5 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} hover:text-amber-400 cursor-pointer`} 
            />
          </div>
        )}
        
        {/* Assign Modal */}
        {showAssignModal && (
          <AssignToHalfTermModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignToHalfTerm}
            lessonNumber={lessonNumber}
            halfTerms={halfTerms}
          />
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="relative group">
        <div 
          className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer hover:border-blue-300"
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
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 text-base flex items-center space-x-2">
                  {lessonData.title || `Lesson ${lessonNumber}`}
                </h4>
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
              
              <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
                {getDescriptionPreview()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Star icon for selection */}
        {onToggleSelection && (
          <div 
            className="absolute top-2 right-2 z-10"
            onClick={handleStarClick}
          >
            <Star 
              className={`h-5 w-5 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} hover:text-amber-400 cursor-pointer`} 
            />
          </div>
        )}
      </div>
    );
  }

  // Default grid view
  return (
    <div className="relative group">
      <div 
        className="bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden hover:scale-[1.02] h-full flex flex-col"
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

            <p className="text-white text-opacity-90 text-sm font-medium" dir="ltr">
              {lessonData.title || `Lesson ${lessonNumber}`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow flex flex-col">
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
              {lessonData.categoryOrder.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded-full text-sm font-medium border shadow-sm"
                  style={{
                    backgroundColor: `${getCategoryColor(category)}20`,
                    color: getCategoryColor(category),
                    borderColor: `${getCategoryColor(category)}40`
                  }}
                >
                  {category}
                </span>
              ))}
              {lessonData.categoryOrder.length > 4 && (
                <span className="px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                  +{lessonData.categoryOrder.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          {/* Description Preview */}
          <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
            {getDescriptionPreview()}
          </p>
        </div>
        
        {/* Star icon for selection */}
        {onToggleSelection && (
          <div 
            className="absolute top-2 right-2 z-10"
            onClick={handleStarClick}
          >
            <Star 
              className={`h-6 w-6 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} hover:text-amber-400 cursor-pointer`} 
            />
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignToHalfTermModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignToHalfTerm}
          lessonNumber={lessonNumber}
          halfTerms={halfTerms}
        />
      )}
    </div>
  );
}