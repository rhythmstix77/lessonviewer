import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonCard } from './LessonCard';
import { ActivityDetails } from './ActivityDetails';
import { ExportButtons } from './ExportButtons';
import { EyfsStandardsList } from './EyfsStandardsList';
import { EyfsStandardsSelector } from './EyfsStandardsSelector';
import { LessonExporter } from './LessonExporter';
import { BookOpen, X, ChevronRight, ChevronDown, ChevronUp, FileText, ExternalLink, Clock, Users, Tag, Edit3, Download, ChevronLeft } from 'lucide-react';
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

// Map lesson numbers to half-terms
const LESSON_TO_HALF_TERM: Record<string, string> = {
  '1': 'A1', '2': 'A1', '3': 'A1', '4': 'A1', '5': 'A1', '6': 'A1',
  '7': 'A2', '8': 'A2', '9': 'A2', '10': 'A2', '11': 'A2', '12': 'A2',
  '13': 'SP1', '14': 'SP1', '15': 'SP1', '16': 'SP1', '17': 'SP1', '18': 'SP1',
  '19': 'SP2', '20': 'SP2', '21': 'SP2', '22': 'SP2', '23': 'SP2', '24': 'SP2',
  '25': 'SM1', '26': 'SM1', '27': 'SM1', '28': 'SM1', '29': 'SM1', '30': 'SM1',
  '31': 'SM2', '32': 'SM2', '33': 'SM2', '34': 'SM2', '35': 'SM2', '36': 'SM2',
};

export function LessonViewer() {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { loading, lessonNumbers, allLessonsData, currentSheetInfo, updateLessonTitle } = useData();
  const { getThemeForClass, getCategoryColor } = useSettings();
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [expandedHalfTerms, setExpandedHalfTerms] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  const [editingLessonTitle, setEditingLessonTitle] = useState<string | null>(null);
  const [lessonTitleValue, setLessonTitleValue] = useState<string>('');
  const [showExporter, setShowExporter] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  
  // Ref for scrolling to top when lesson is selected
  const topRef = useRef<HTMLDivElement>(null);

  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Group lessons by half-term - useMemo MUST be after all other hooks
  const lessonsByHalfTerm = React.useMemo(() => {
    const grouped: Record<string, string[]> = {};
    
    // Initialize all half-terms with empty arrays
    HALF_TERMS.forEach(term => {
      grouped[term.id] = [];
    });
    
    // Group lessons by half-term
    lessonNumbers.forEach(lessonNum => {
      const halfTerm = LESSON_TO_HALF_TERM[lessonNum] || 'A1';
      if (!grouped[halfTerm]) {
        grouped[halfTerm] = [];
      }
      grouped[halfTerm].push(lessonNum);
    });
    
    return grouped;
  }, [lessonNumbers]);

  // Scroll to top when a lesson is selected
  useEffect(() => {
    if (selectedLesson && topRef.current) {
      topRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [selectedLesson]);

  // Update current lesson index when a lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      const index = lessonNumbers.findIndex(num => num === selectedLesson);
      if (index !== -1) {
        setCurrentLessonIndex(index);
      }
    }
  }, [selectedLesson, lessonNumbers]);

  // Initialize lesson title editing
  const startEditingLessonTitle = (lessonNumber: string) => {
    setEditingLessonTitle(lessonNumber);
    setLessonTitleValue(allLessonsData[lessonNumber]?.title || `Lesson ${lessonNumber}`);
  };

  // Save lesson title
  const saveLessonTitle = () => {
    if (editingLessonTitle && lessonTitleValue.trim()) {
      updateLessonTitle(editingLessonTitle, lessonTitleValue.trim());
      setEditingLessonTitle(null);
    }
  };

  // Navigate to previous or next lesson
  const navigateToLesson = (direction: 'prev' | 'next') => {
    let newIndex = currentLessonIndex;
    
    if (direction === 'prev' && currentLessonIndex > 0) {
      newIndex = currentLessonIndex - 1;
    } else if (direction === 'next' && currentLessonIndex < lessonNumbers.length - 1) {
      newIndex = currentLessonIndex + 1;
    } else {
      return; // Can't navigate further
    }
    
    setSelectedLesson(lessonNumbers[newIndex]);
    setCurrentLessonIndex(newIndex);
  };

  // NOW we can have conditional returns - all hooks are above this point
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
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

  const handleLessonSelect = (lessonNumber: string) => {
    setSelectedLesson(lessonNumber === selectedLesson ? '' : lessonNumber);
  };

  const handleCloseLessonView = () => {
    setSelectedLesson('');
  };

  const toggleHalfTerm = (halfTermId: string) => {
    setExpandedHalfTerms(prev => 
      prev.includes(halfTermId) 
        ? prev.filter(id => id !== halfTermId)
        : [...prev, halfTermId]
    );
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
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateToLesson('prev')}
                      disabled={currentLessonIndex === 0}
                      className={`p-1.5 rounded-lg transition-colors duration-200 ${
                        currentLessonIndex === 0 
                          ? 'text-white text-opacity-40 cursor-not-allowed' 
                          : 'text-white hover:bg-white hover:bg-opacity-20'
                      }`}
                      title="Previous Lesson"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {editingLessonTitle === selectedLesson ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={lessonTitleValue}
                          onChange={(e) => setLessonTitleValue(e.target.value)}
                          className="text-xl font-bold bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveLessonTitle();
                            if (e.key === 'Escape') setEditingLessonTitle(null);
                          }}
                        />
                        <button
                          onClick={saveLessonTitle}
                          className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingLessonTitle(null)}
                          className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <h1 className="text-xl font-bold mb-1 flex items-center space-x-2">
                        <span>{lessonData.title || `Lesson ${selectedLesson}`}</span>
                        <button
                          onClick={() => startEditingLessonTitle(selectedLesson)}
                          className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                          title="Edit lesson title"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </h1>
                    )}
                    <button
                      onClick={() => navigateToLesson('next')}
                      disabled={currentLessonIndex === lessonNumbers.length - 1}
                      className={`p-1.5 rounded-lg transition-colors duration-200 ${
                        currentLessonIndex === lessonNumbers.length - 1 
                          ? 'text-white text-opacity-40 cursor-not-allowed' 
                          : 'text-white hover:bg-white hover:bg-opacity-20'
                      }`}
                      title="Next Lesson"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowExporter(true)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Export Lesson"
                  >
                    <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
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
              <p className="text-white text-opacity-90 text-sm mt-1">
                {lessonData.totalTime} minutes • {lessonData.categoryOrder.length} categories
              </p>
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
                'Goodbye': 'from-teal-400 to-cyan-500',
                'Kodaly Rhythms': 'from-purple-400 to-indigo-500',
                'Kodaly Games': 'from-amber-400 to-orange-500',
                'IWB Games': 'from-yellow-400 to-amber-500'
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
                          {/* Activity Text (if available) */}
                          {activity.activityText && (
                            <div 
                              className="mb-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: activity.activityText }}
                            />
                          )}
                          
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
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                                    Video Link
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                                {activity.musicLink && (
                                  <a 
                                    href={activity.musicLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                    Music Link
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                                {activity.backingLink && (
                                  <a 
                                    href={activity.backingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                    Backing Track
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                                {activity.resourceLink && (
                                  <a 
                                    href={activity.resourceLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                                    Resource
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                                {activity.link && (
                                  <a 
                                    href={activity.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                                    Additional Link
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                                {activity.vocalsLink && (
                                  <a 
                                    href={activity.vocalsLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                                    Vocals
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                                {activity.imageLink && (
                                  <a 
                                    href={activity.imageLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-1"></span>
                                    Image
                                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Click to view resources message */}
                          <div className="text-xs text-blue-600 italic mt-2">
                            Click to view all details and resources
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
              <span>Back to Unit Overview</span>
            </button>
          </div>

          {/* Activity Details Modal */}
          {selectedActivity && (
            <ActivityDetails
              activity={selectedActivity}
              onClose={() => setSelectedActivity(null)}
            />
          )}

          {/* Lesson Exporter */}
          {showExporter && (
            <LessonExporter
              lessonNumber={selectedLesson}
              onClose={() => setShowExporter(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // Default view - half-term cards with lessons
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Scroll target for auto-scroll */}
      <div ref={topRef} className="absolute top-16"></div>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Export Buttons */}
        <ExportButtons />

        {/* Half-Term Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HALF_TERMS.map((halfTerm) => {
            const lessonsInTerm = lessonsByHalfTerm[halfTerm.id] || [];
            const hasLessons = lessonsInTerm.length > 0;
            const isExpanded = expandedHalfTerms.includes(halfTerm.id);
            
            // If this is Autumn 1 and it's expanded, it should take full width
            const isAutumn1Expanded = halfTerm.id === 'A1' && isExpanded;
            
            return (
              <div 
                key={halfTerm.id}
                className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl overflow-hidden ${
                  isExpanded 
                    ? 'ring-4 ring-opacity-30 border-blue-500 ring-blue-500' 
                    : 'border-gray-200 hover:border-gray-300 hover:scale-[1.02]'
                } ${!hasLessons ? 'opacity-60' : ''} ${
                  isAutumn1Expanded ? 'col-span-full' : ''
                }`}
              >
                {/* Colorful Header */}
                <div 
                  className="p-6 text-white relative overflow-hidden cursor-pointer"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
                  }}
                  onClick={() => hasLessons && toggleHalfTerm(halfTerm.id)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold">
                        {halfTerm.name}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 transition-transform duration-300" />
                      ) : (
                        <ChevronDown className="h-6 w-6 transition-transform duration-300" />
                      )}
                    </div>
                    
                    <p className="text-white text-opacity-90 text-sm font-medium">
                      {halfTerm.months}
                    </p>

                    <div className="flex items-center space-x-6 text-white text-opacity-90 mt-2">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span className="font-medium">{lessonsInTerm.length} lessons</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Lessons in this half-term */}
                {isExpanded && lessonsInTerm.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    {/* Special expanded layout for Autumn 1 */}
                    {isAutumn1Expanded ? (
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 px-2">
                          All Lessons for {halfTerm.name}
                        </h3>
                        
                        {/* Organized lesson list with clear numbering */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {lessonsInTerm.map((lessonNum) => {
                            const lessonData = allLessonsData[lessonNum];
                            if (!lessonData) return null;
                            
                            return (
                              <div 
                                key={lessonNum}
                                className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 overflow-hidden cursor-pointer"
                                onClick={() => handleLessonSelect(lessonNum)}
                              >
                                {/* Lesson Header */}
                                <div 
                                  className="p-4 border-b border-gray-200"
                                  style={{ 
                                    background: `linear-gradient(to right, ${theme.primary}20, ${theme.secondary}10)` 
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                      <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: theme.primary }}
                                      >
                                        {lessonNum}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                                          <span>{lessonData.title || `Lesson ${lessonNum}`}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingLessonTitle(lessonNum);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                            title="Edit lesson title"
                                          >
                                            <Edit3 className="h-3.5 w-3.5" />
                                          </button>
                                        </h4>
                                        {editingLessonTitle === lessonNum && (
                                          <div 
                                            className="absolute z-10 mt-2 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <input
                                              type="text"
                                              value={lessonTitleValue}
                                              onChange={(e) => setLessonTitleValue(e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveLessonTitle();
                                                if (e.key === 'Escape') setEditingLessonTitle(null);
                                              }}
                                            />
                                            <div className="flex justify-end space-x-2">
                                              <button
                                                onClick={() => setEditingLessonTitle(null)}
                                                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                onClick={saveLessonTitle}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                                              >
                                                Save
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                                
                                {/* Lesson Content */}
                                <div className="p-4">
                                  {/* Stats */}
                                  <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <span>{lessonData.totalTime} mins</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Users className="h-4 w-4 text-gray-500" />
                                      <span>
                                        {Object.values(lessonData.grouped).reduce((sum, activities) => sum + activities.length, 0)} activities
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Categories */}
                                  <div className="mb-3">
                                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                      Categories
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {lessonData.categoryOrder.map((category) => (
                                        <span
                                          key={category}
                                          className="px-2 py-1 bg-gray-100 text-xs font-medium rounded-full border border-gray-200"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* First Activity Preview */}
                                  {lessonData.categoryOrder.length > 0 && lessonData.grouped[lessonData.categoryOrder[0]]?.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                        First Activity
                                      </h5>
                                      <p className="text-sm font-medium text-gray-800 truncate">
                                        {lessonData.grouped[lessonData.categoryOrder[0]][0].activity}
                                      </p>
                                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                        {lessonData.grouped[lessonData.categoryOrder[0]][0].description.replace(/<[^>]*>/g, '')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      // Regular grid for other half-terms
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {lessonsInTerm.map((lessonNum) => {
                          const lessonData = allLessonsData[lessonNum];
                          if (!lessonData) return null;
                          
                          return (
                            <div 
                              key={lessonNum}
                              className="bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 p-4 cursor-pointer"
                              onClick={() => handleLessonSelect(lessonNum)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                    <span>{lessonData.title || `Lesson ${lessonNum}`}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingLessonTitle(lessonNum);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                      title="Edit lesson title"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                  </h4>
                                  {editingLessonTitle === lessonNum && (
                                    <div 
                                      className="absolute z-10 mt-2 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="text"
                                        value={lessonTitleValue}
                                        onChange={(e) => setLessonTitleValue(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveLessonTitle();
                                          if (e.key === 'Escape') setEditingLessonTitle(null);
                                        }}
                                      />
                                      <div className="flex justify-end space-x-2">
                                        <button
                                          onClick={() => setEditingLessonTitle(null)}
                                          className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={saveLessonTitle}
                                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  <p className="text-sm text-gray-600 mt-1">
                                    {lessonData.totalTime} mins • {lessonData.categoryOrder.length} categories
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              </div>
                              
                              {/* Categories Preview */}
                              <div className="mt-3 flex flex-wrap gap-1">
                                {lessonData.categoryOrder.slice(0, 3).map((category) => (
                                  <span
                                    key={category}
                                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                                    style={{
                                      backgroundColor: `${getCategoryColor(category)}20`,
                                      color: getCategoryColor(category)
                                    }}
                                  >
                                    {category}
                                  </span>
                                ))}
                                {lessonData.categoryOrder.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    +{lessonData.categoryOrder.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Empty State */}
                {!hasLessons && (
                  <div className="p-6 text-center text-gray-500">
                    <p>No lessons available for this half-term</p>
                  </div>
                )}
              </div>
            );
          })}
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