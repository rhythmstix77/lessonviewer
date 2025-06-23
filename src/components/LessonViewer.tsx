import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonCard } from './LessonCard';
import { ActivityDetails } from './ActivityDetails';
import { ExportButtons } from './ExportButtons';
import { LoadingSpinner } from './LoadingSpinner';
import { EyfsStandardsList } from './EyfsStandardsList';
import { EyfsStandardsSelector } from './EyfsStandardsSelector';
import { BookOpen, X, Search, GraduationCap, Edit3, Tag, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Activity } from '../contexts/DataContext';

export function LessonViewer() {
  const { loading, lessonNumbers, allLessonsData, currentSheetInfo } = useData();
  const { settings, getThemeForClass } = useSettings();
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [previewLesson, setPreviewLesson] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  
  // Ref for scrolling to top when lesson is selected
  const topRef = useRef<HTMLDivElement>(null);

  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Scroll to top when a lesson is selected
  useEffect(() => {
    if (selectedLesson && topRef.current) {
      topRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [selectedLesson]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          {/* Centered Loading with Simulated Circle */}
          <div className="relative mx-auto mb-6">
            <div className="w-24 h-24 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Lesson Data</h2>
          <p className="text-gray-600">Please wait while we fetch your {currentSheetInfo.display} lessons...</p>
        </div>
      </div>
    );
  }

  const filteredLessons = lessonNumbers.filter(lessonNum => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const hasMatch = Object.values(lessonData.grouped).some(activities =>
        activities.some(activity =>
          activity.activity.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.category.toLowerCase().includes(query)
        )
      );
      if (!hasMatch) return false;
    }

    return true;
  });

  const handleLessonSelect = (lessonNumber: string) => {
    setSelectedLesson(lessonNumber === selectedLesson ? '' : lessonNumber);
    setPreviewLesson('');
  };

  const handleLessonPreview = (lessonNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewLesson(lessonNumber === previewLesson ? '' : lessonNumber);
  };

  const handleCloseLessonView = () => {
    setSelectedLesson('');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // If a lesson is selected, show full-width expanded view
  if (selectedLesson && allLessonsData[selectedLesson]) {
    const lessonData = allLessonsData[selectedLesson];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Scroll target for auto-scroll */}
        <div ref={topRef} className="absolute top-16"></div>
        
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Compact Lesson Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div 
              className="p-4 text-white relative"
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold mb-1">
                    Lesson {selectedLesson} - {currentSheetInfo.display}
                  </h1>
                  <p className="text-white text-opacity-90 text-sm">
                    {lessonData.totalTime} minutes • {lessonData.categoryOrder.length} categories
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEyfsSelector(!showEyfsSelector)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Manage EYFS Standards"
                  >
                    <Tag className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">EYFS Standards</span>
                  </button>
                  <button
                    onClick={handleCloseLessonView}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group"
                    title="Close lesson view"
                  >
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EYFS Standards Selector (conditionally shown) */}
          {showEyfsSelector && (
            <div className="mb-6">
              <EyfsStandardsSelector lessonNumber={selectedLesson} />
            </div>
          )}

          {/* EYFS Standards List */}
          <div className="mb-6">
            <EyfsStandardsList lessonNumber={selectedLesson} />
          </div>

          {/* Full Width Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {lessonData.categoryOrder.map((category) => {
              const activities = lessonData.grouped[category] || [];
              const categoryColors = {
                'Welcome': 'from-yellow-400 to-orange-500',
                'Kodaly Songs': 'from-purple-400 to-pink-500',
                'Kodaly Action Songs': 'from-orange-400 to-red-500',
                'Action/Games Songs': 'from-orange-400 to-red-500',
                'Rhythm Sticks': 'from-amber-400 to-yellow-500',
                'Scarf Songs': 'from-green-400 to-emerald-500',
                'General Game': 'from-blue-400 to-indigo-500',
                'Core Songs': 'from-lime-400 to-green-500',
                'Parachute Games': 'from-red-400 to-pink-500',
                'Percussion Games': 'from-cyan-400 to-blue-500',
                'Teaching Units': 'from-indigo-400 to-purple-500',
                'Goodbye': 'from-teal-400 to-cyan-500'
              };

              return (
                <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Category Header */}
                  <div className={`bg-gradient-to-r ${categoryColors[category] || theme.gradient} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">{category}</h3>
                      <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                        {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>
                  </div>

                  {/* Activities List - Full Content Display with NO truncation */}
                  <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                    {activities.map((activity, index) => (
                      <button
                        key={`${category}-${index}`}
                        onClick={() => setSelectedActivity(activity)}
                        className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden"
                      >
                        {/* Activity Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-base leading-tight">
                              {activity.activity || 'Untitled Activity'}
                            </h4>
                            {/* Time Badge - Simple and Clean */}
                            {activity.time > 0 && (
                              <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded-full ml-3 flex-shrink-0">
                                {activity.time}m
                              </span>
                            )}
                          </div>
                          
                          {/* Level Badge */}
                          {activity.level && (
                            <span 
                              className="inline-block px-3 py-1 text-white text-xs font-medium rounded-full mb-2"
                              style={{ backgroundColor: theme.primary }}
                            >
                              {activity.level}
                            </span>
                          )}
                        </div>

                        {/* Activity Content - FULL DESCRIPTION WITHOUT TRUNCATION */}
                        <div className="p-4">
                          {/* Full Description - No line clamps or truncation */}
                          <div 
                            className="text-sm text-gray-700 leading-relaxed mb-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: activity.description.includes('<') ? 
                              activity.description : 
                              activity.description.replace(/\n/g, '<br>') 
                            }}
                          />

                          {/* Unit Name */}
                          {activity.unitName && (
                            <div className="mb-3">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit:</span>
                              <p className="text-sm text-gray-700 font-medium">{activity.unitName}</p>
                            </div>
                          )}

                          {/* Click to view resources message */}
                          <div className="text-xs text-blue-600 italic">
                            Click to view all resources and details
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Back to Overview Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleCloseLessonView}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <X className="h-5 w-5" />
              <span>Back to Lesson Overview</span>
            </button>
          </div>

          {/* Activity Details Modal */}
          {selectedActivity && (
            <ActivityDetails
              activity={selectedActivity}
              onClose={() => setSelectedActivity(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // Default view - lesson cards in horizontal scroll
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Scroll target for auto-scroll */}
      <div ref={topRef} className="absolute top-16"></div>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0 lg:space-x-6 mb-6">
            {/* Title Section with Learning Icon */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div 
                  className="h-16 w-16 p-3 rounded-xl shadow-lg border-2 border-blue-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
                  }}
                >
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Lesson Viewer
                </h1>
                <p className="text-gray-600 text-lg">
                  {currentSheetInfo.display} • {filteredLessons.length} of {lessonNumbers.length} lessons available
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Search Section */}
              <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[320px]">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search activities, descriptions, categories..."
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-2 transition-colors duration-200 text-gray-900 placeholder-gray-500 shadow-sm"
                    style={{ 
                      focusRingColor: theme.primary,
                      focusBorderColor: theme.primary 
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {/* Search Results Info */}
                {searchQuery && (
                  <div className="mt-2 text-sm text-gray-600">
                    {filteredLessons.length === 0 ? (
                      <span className="text-red-600">No lessons found for "{searchQuery}"</span>
                    ) : (
                      <span>
                        Found {filteredLessons.length} lesson{filteredLessons.length !== 1 ? 's' : ''} matching "{searchQuery}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <ExportButtons />
        </div>

        {/* Lesson Grid - Horizontal Scrollable Layout */}
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">No lessons found</h3>
            <p className="text-gray-600 text-lg">
              {searchQuery 
                ? 'Try adjusting your search terms to see more results.'
                : 'No lesson data available for this age group.'}
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-white font-medium rounded-lg transition-colors duration-200"
                style={{ backgroundColor: theme.primary }}
              >
                <X className="h-4 w-4" />
                <span>Clear Search</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-6 min-w-max">
                {filteredLessons.map((lessonNum) => (
                  <div key={lessonNum} className="flex-shrink-0 w-80 relative">
                    <LessonCard
                      lessonNumber={lessonNum}
                      lessonData={allLessonsData[lessonNum]}
                      isSelected={selectedLesson === lessonNum}
                      onSelect={handleLessonSelect}
                      onActivityClick={setSelectedActivity}
                      theme={theme}
                    />
                    {/* Preview Button */}
                    <button
                      onClick={(e) => handleLessonPreview(lessonNum, e)}
                      className="absolute top-3 right-3 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-md transition-all duration-200 z-10"
                      title="Preview Lesson"
                    >
                      {previewLesson === lessonNum ? (
                        <ChevronLeft className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                    
                    {/* Lesson Preview Box */}
                    {previewLesson === lessonNum && (
                      <div className="absolute top-0 -right-[340px] w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 max-h-[500px] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">Lesson {lessonNum} Preview</h3>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewLesson('');
                              }}
                              className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="space-y-4">
                            {allLessonsData[lessonNum]?.categoryOrder.map(category => {
                              const activities = allLessonsData[lessonNum].grouped[category] || [];
                              return (
                                <div key={category} className="border-b border-gray-100 pb-3 last:border-0">
                                  <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                                  <ul className="space-y-2">
                                    {activities.map((activity, idx) => (
                                      <li key={idx} className="text-sm">
                                        <div className="flex items-start">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></span>
                                          <div>
                                            <p className="font-medium">{activity.activity}</p>
                                            {activity.time > 0 && (
                                              <span className="text-xs text-gray-500">{activity.time} mins</span>
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLesson(lessonNum);
                                setPreviewLesson('');
                              }}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                            >
                              View Full Lesson
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}
      </div>
    </div>
  );
}