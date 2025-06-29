import React from 'react';
import { Calendar, Clock, X, Eye, Printer, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';

interface HalfTermViewProps {
  halfTermId: string;
  halfTermName: string;
  halfTermColor: string;
  orderedLessons: string[];
  onReorderLessons: (dragIndex: number, hoverIndex: number) => void;
  onRemoveLesson: (lessonNumber: string) => void;
  onViewLessonDetails: (lessonNumber: string) => void;
  onPrintHalfTerm?: (halfTermId: string, halfTermName: string) => void;
}

export function HalfTermView({
  halfTermId,
  halfTermName,
  halfTermColor,
  orderedLessons,
  onReorderLessons,
  onRemoveLesson,
  onViewLessonDetails,
  onPrintHalfTerm
}: HalfTermViewProps) {
  const { allLessonsData } = useData();
  const { getThemeForClass } = useSettings();
  const theme = getThemeForClass('LKG'); // Default theme

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-gray-900">{halfTermName} Complete</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onPrintHalfTerm && (
              <button
                onClick={() => onPrintHalfTerm(halfTermId, halfTermName)}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Drag and drop lessons to reorder them for this half-term
        </p>
      </div>

      {orderedLessons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons selected</h3>
          <p className="text-gray-600">
            Select lessons from the library to add to this half-term
          </p>
        </div>
      ) : (
        <div className="flex overflow-x-auto pb-4 space-x-4">
          {orderedLessons.map((lessonNum, index) => {
            const lessonData = allLessonsData[lessonNum];
            if (!lessonData) return null;
            
            return (
              <div 
                key={lessonNum} 
                className="flex-shrink-0 w-64"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', index.toString());
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  onReorderLessons(dragIndex, index);
                }}
              >
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 h-full flex flex-col relative">
                  {/* Star icon to show it's selected */}
                  <div className="absolute top-2 right-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Lesson {lessonNum}</h4>
                    <div className="flex items-center">
                      <button
                        onClick={() => onRemoveLesson(lessonNum)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${lessonNum}`}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                    <Clock className="h-3 w-3" />
                    <span>{lessonData.totalTime} mins</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {lessonData.categoryOrder.slice(0, 2).map(category => (
                      <span 
                        key={category}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                    {lessonData.categoryOrder.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{lessonData.categoryOrder.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onViewLessonDetails(lessonNum)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      {index > 0 && (
                        <button
                          onClick={() => onReorderLessons(index, index - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                      )}
                      {index < orderedLessons.length - 1 && (
                        <button
                          onClick={() => onReorderLessons(index, index + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}