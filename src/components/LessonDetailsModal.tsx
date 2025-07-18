import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Edit3, Save, Check, Tag, Clock, Users, ExternalLink, FileText, Trash2, Printer } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { ActivityDetails } from './ActivityDetails';
import { EditableText } from './EditableText';
import { EyfsStandardsSelector } from './EyfsStandardsSelector';
import { EyfsStandardsList } from './EyfsStandardsList';
import { LessonPrintModal } from './LessonPrintModal';
import type { Activity, LessonData } from '../contexts/DataContext';

interface LessonDetailsModalProps {
  lessonNumber: string;
  onClose: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onExport?: () => void;
  unitId?: string;
  unitName?: string;
  halfTermId?: string;
  halfTermName?: string;
}

export function LessonDetailsModal({ 
  lessonNumber, 
  onClose, 
  theme,
  onExport,
  unitId,
  unitName,
  halfTermId,
  halfTermName
}: LessonDetailsModalProps) {
  const { allLessonsData, updateLessonTitle, eyfsStatements, deleteLesson } = useData();
  const { getCategoryColor } = useSettings();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  const [editingLessonTitle, setEditingLessonTitle] = useState(false);
  const [lessonTitleValue, setLessonTitleValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const lessonData = allLessonsData[lessonNumber];

  // Initialize lesson title when component mounts
  useEffect(() => {
    if (lessonData?.title) {
      setLessonTitleValue(lessonData.title);
    } else {
      setLessonTitleValue(`Lesson ${lessonNumber}`);
    }
  }, [lessonData, lessonNumber]);

  if (!lessonData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">Lesson data not found for lesson {lessonNumber}.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveLessonTitle = () => {
    if (lessonTitleValue.trim()) {
      updateLessonTitle(lessonNumber, lessonTitleValue.trim());
      setEditingLessonTitle(false);
    }
  };

  const handleResourceClick = (url: string, title: string, type: string) => {
    // Find the activity that contains this resource
    let foundActivity: Activity | null = null;
    
    Object.values(lessonData.grouped).forEach(activities => {
      activities.forEach(activity => {
        if (
          activity.videoLink === url ||
          activity.musicLink === url ||
          activity.backingLink === url ||
          activity.resourceLink === url ||
          activity.link === url ||
          activity.vocalsLink === url ||
          activity.imageLink === url
        ) {
          foundActivity = activity;
        }
      });
    });
    
    if (foundActivity) {
      setSelectedActivity(foundActivity);
      setInitialResource({ url, title, type });
    }
  };

  const handleDeleteLesson = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteLesson(lessonNumber);
    onClose();
  };

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

  // Get EYFS standards count
  const eyfsCount = (eyfsStatements[lessonNumber] || []).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="p-4 text-white relative"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              {editingLessonTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={lessonTitleValue}
                    onChange={(e) => setLessonTitleValue(e.target.value)}
                    className="text-xl font-bold bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveLessonTitle();
                      if (e.key === 'Escape') setEditingLessonTitle(false);
                    }}
                  />
                  <button
                    onClick={handleSaveLessonTitle}
                    className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingLessonTitle(false)}
                    className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h1 className="text-xl font-bold mb-1 flex items-center space-x-2">
                  <span>{lessonData.title || `Lesson ${lessonNumber}`}</span>
                  <button
                    onClick={() => setEditingLessonTitle(true)}
                    className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                    title="Edit lesson title"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </h1>
              )}
              <p className="text-white text-opacity-90 text-sm">
                {lessonData.totalTime} minutes • {lessonData.categoryOrder.length} categories
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeleteLesson}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Delete Lesson"
              >
                <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">Delete</span>
              </button>
              <button
                onClick={() => setShowEyfsSelector(!showEyfsSelector)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Manage EYFS Standards"
              >
                <Tag className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">EYFS Standards</span>
              </button>
              {/* Unified Save/Print Button */}
              <button
                onClick={() => setShowPrintModal(true)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Save/Print Lesson"
              >
                <Printer className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">Save / Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group"
                title="Close lesson view"
              >
                <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* EYFS Standards Selector (conditionally shown) */}
          {showEyfsSelector && (
            <div className="mb-6">
              <EyfsStandardsSelector lessonNumber={lessonNumber} />
            </div>
          )}

          {/* EYFS Standards List */}
          <div className="mb-6">
            <EyfsStandardsList lessonNumber={lessonNumber} />
          </div>

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
                      <button
                        key={`${category}-${index}`}
                        onClick={() => setSelectedActivity(activity)}
                        className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden cursor-pointer"
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

                        {/* Activity Content */}
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
                                    className="p-2 rounded-lg border transition-colors text-red-700 bg-red-50 border-red-200 hover:bg-red-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.videoLink, `${activity.activity} - Video`, 'video');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Video</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                                  </a>
                                )}
                                {activity.musicLink && (
                                  <a 
                                    href={activity.musicLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg border transition-colors text-green-700 bg-green-50 border-green-200 hover:bg-green-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.musicLink, `${activity.activity} - Music`, 'music');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Music</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                                  </a>
                                )}
                                {activity.backingLink && (
                                  <a 
                                    href={activity.backingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg border transition-colors text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.backingLink, `${activity.activity} - Backing Track`, 'backing');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Backing</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                                  </a>
                                )}
                                {activity.resourceLink && (
                                  <a 
                                    href={activity.resourceLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg border transition-colors text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.resourceLink, `${activity.activity} - Resource`, 'resource');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Resource</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                                  </a>
                                )}
                                {activity.link && (
                                  <a 
                                    href={activity.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg border transition-colors text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.link, `${activity.activity} - Link`, 'link');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Link</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                                  </a>
                                )}
                                {activity.vocalsLink && (
                                  <a 
                                    href={activity.vocalsLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg border transition-colors text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.vocalsLink, `${activity.activity} - Vocals`, 'vocals');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Vocals</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                                  </a>
                                )}
                                {activity.imageLink && (
                                  <a 
                                    href={activity.imageLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg border transition-colors text-pink-700 bg-pink-50 border-pink-200 hover:bg-pink-100 flex items-center cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResourceClick(activity.imageLink, `${activity.activity} - Image`, 'image');
                                    }}
                                  >
                                    <span className="text-sm font-medium truncate">Image</span>
                                    <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => {
            setSelectedActivity(null);
            setInitialResource(null);
          }}
          initialResource={initialResource}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Lesson</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete Lesson {lessonNumber}? This action cannot be undone and will remove the lesson from all units.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Lesson</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <LessonPrintModal
          lessonNumber={lessonNumber}
          onClose={() => setShowPrintModal(false)}
          unitId={unitId}
          unitName={unitName}
          halfTermId={halfTermId}
          halfTermName={halfTermName}
        />
      )}
    </div>
  );
}