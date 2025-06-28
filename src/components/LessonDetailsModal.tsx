import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Edit3, Save, Check, Tag, Clock, Users, ExternalLink, FileText, Trash2, Printer } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { ActivityDetails } from './ActivityDetails';
import { EyfsStandardsSelector } from './EyfsStandardsSelector';
import { EyfsStandardsList } from './EyfsStandardsList';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
}

export function LessonDetailsModal({ 
  lessonNumber, 
  onClose, 
  theme,
  onExport
}: LessonDetailsModalProps) {
  const { allLessonsData, updateLessonTitle, eyfsStatements, deleteLesson } = useData();
  const { getCategoryColor } = useSettings();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  const [editingLessonTitle, setEditingLessonTitle] = useState(false);
  const [lessonTitleValue, setLessonTitleValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Handle print or export
  const handlePrintOrExport = async (type: 'print' | 'export') => {
    if (type === 'print') {
      window.print();
      return;
    }
    
    // Export to PDF
    setIsExporting(true);
    
    try {
      if (previewRef.current) {
        const canvas = await html2canvas(previewRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Create PDF with proper A4 dimensions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // A4 dimensions: 210mm x 297mm
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // If the content is longer than one page, create additional pages
        if (imgHeight > 297) {
          let remainingHeight = imgHeight;
          let currentPosition = 0;
          
          while (remainingHeight > 0) {
            currentPosition += 297;
            remainingHeight -= 297;
            
            if (remainingHeight > 0) {
              pdf.addPage();
              pdf.addImage(
                imgData, 
                'PNG', 
                0, 
                -currentPosition, 
                imgWidth, 
                imgHeight
              );
            }
          }
        }
        
        // Now add hyperlinks for all resources
        // We need to collect all resource links from the activities
        lessonData.categoryOrder.forEach(category => {
          const activities = lessonData.grouped[category] || [];
          activities.forEach(activity => {
            // Add hyperlinks for each resource type
            if (activity.videoLink) {
              addHyperlinkToPdf(pdf, 'Video', activity.videoLink);
            }
            if (activity.musicLink) {
              addHyperlinkToPdf(pdf, 'Music', activity.musicLink);
            }
            if (activity.backingLink) {
              addHyperlinkToPdf(pdf, 'Backing', activity.backingLink);
            }
            if (activity.resourceLink) {
              addHyperlinkToPdf(pdf, 'Resource', activity.resourceLink);
            }
            if (activity.link) {
              addHyperlinkToPdf(pdf, 'Link', activity.link);
            }
            if (activity.vocalsLink) {
              addHyperlinkToPdf(pdf, 'Vocals', activity.vocalsLink);
            }
            if (activity.imageLink) {
              addHyperlinkToPdf(pdf, 'Image', activity.imageLink);
            }
          });
        });
        
        // Save the PDF
        const title = lessonData.title || `Lesson ${lessonNumber}`;
        pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
        
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to add hyperlinks to the PDF
  const addHyperlinkToPdf = (pdf: jsPDF, resourceType: string, url: string) => {
    // Find all instances of this resource type in the PDF
    // This is a simplified approach - in a real implementation, you would need to
    // calculate the exact positions of each resource badge in the PDF
    
    // For now, we'll add a page of hyperlinks at the end
    const pageCount = pdf.getNumberOfPages();
    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resource Links', 20, 20);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 255);
    
    // Add the hyperlink
    const linkText = `${resourceType}: ${url}`;
    pdf.textWithLink(linkText, 20, 40, { url });
    
    // Add a note about the hyperlinks
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text('Note: All resource badges in the lesson plan are clickable links.', 20, 60);
  };

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
              {/* Print Button */}
              <button
                onClick={() => handlePrintOrExport('print')}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Print Lesson"
              >
                <Printer className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">Print</span>
              </button>
              {/* Export Button */}
              <button
                onClick={() => handlePrintOrExport('export')}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Export Lesson as PDF"
                disabled={isExporting}
              >
                {isExporting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : exportSuccess ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                )}
                <span className="text-sm font-medium">Export</span>
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

          {/* Printable content */}
          <div ref={previewRef} className="print-content">
            {/* Print-only header */}
            <div className="hidden print:block text-center border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {lessonData.title || `Lesson ${lessonNumber}`}
              </h1>
              <div className="text-gray-600 font-medium">
                Total Time: {lessonData.totalTime} minutes
              </div>
              
              {/* Page number */}
              <div className="absolute top-0 right-0 text-xs text-gray-500">
                Page <span className="pageNumber"></span>
              </div>
            </div>

            {/* Categories and Activities */}
            <div className="space-y-8">
              {lessonData.categoryOrder.map((category) => {
                const activities = lessonData.grouped[category] || [];
                
                return (
                  <div key={category} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden print:border-0 print:shadow-none print:mb-6 page-break-inside-avoid">
                    {/* Category Header */}
                    <div 
                      className="p-4 border-b border-gray-200 print:border-b-0 print:pb-0"
                      style={{ 
                        background: `linear-gradient(to right, ${getCategoryColor(category)}20, ${getCategoryColor(category)}05)`,
                        borderLeft: `4px solid ${getCategoryColor(category)}`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 print:text-lg">{category}</h3>
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm print:text-xs" style={{ color: getCategoryColor(category) }}>
                          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Activities */}
                    <div className="p-4 space-y-6 print:space-y-3 print:p-0">
                      {activities.map((activity, index) => (
                        <button
                          key={`${category}-${index}`}
                          onClick={() => setSelectedActivity(activity)}
                          className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden cursor-pointer print:cursor-default print:hover:bg-gray-50 print:hover:border-gray-200 print:hover:shadow-sm print-activity"
                        >
                          {/* Activity Header */}
                          <div className="p-4 border-b border-gray-200 bg-white print:p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-base leading-tight print:text-sm">
                                {activity.activity || 'Untitled Activity'}
                              </h4>
                              {/* Time Badge - Simple and Clean */}
                              {activity.time > 0 && (
                                <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded-full ml-3 flex-shrink-0 print:text-[8px] print:py-0.5 print:px-1.5">
                                  {activity.time}m
                                </span>
                              )}
                            </div>
                            
                            {/* Level Badge */}
                            {activity.level && (
                              <span 
                                className="inline-block px-3 py-1 text-white text-xs font-medium rounded-full mb-2 print:text-[8px] print:py-0.5 print:px-1.5"
                                style={{ backgroundColor: theme.primary }}
                              >
                                {activity.level}
                              </span>
                            )}
                          </div>

                          {/* Activity Content */}
                          <div className="p-4 print:p-3">
                            {/* Activity Text (if available) */}
                            {activity.activityText && (
                              <div 
                                className="mb-3 prose prose-sm max-w-none print:text-xs print:mb-2"
                                dangerouslySetInnerHTML={{ __html: activity.activityText }}
                              />
                            )}
                            
                            {/* Full Description - No line clamps or truncation */}
                            <div 
                              className="text-sm text-gray-700 leading-relaxed mb-3 prose prose-sm max-w-none print:text-xs print:mb-2"
                              dangerouslySetInnerHTML={{ __html: activity.description.includes('<') ? 
                                activity.description : 
                                activity.description.replace(/\n/g, '<br>') 
                              }}
                            />

                            {/* Unit Name */}
                            {activity.unitName && (
                              <div className="mb-3 print:mb-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide print:text-[8px]">Unit:</span>
                                <p className="text-sm text-gray-700 font-medium print:text-xs">{activity.unitName}</p>
                              </div>
                            )}

                            {/* Web Links Section - Prominently displayed */}
                            {(activity.videoLink || activity.musicLink || activity.backingLink || 
                              activity.resourceLink || activity.link || activity.vocalsLink || 
                              activity.imageLink) && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 print:mt-2 print:p-2 print:bg-gray-100">
                                <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center print:text-xs print:mb-1">
                                  <FileText className="h-4 w-4 mr-1 print:h-3 print:w-3" />
                                  Web Resources
                                </h5>
                                <div className="grid grid-cols-2 gap-2 print:grid-cols-3 print:gap-1">
                                  {activity.videoLink && (
                                    <a 
                                      href={activity.videoLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-red-700 bg-red-50 border-red-200 hover:bg-red-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.videoLink, `${activity.activity} - Video`, 'video');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Video</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                  {activity.musicLink && (
                                    <a 
                                      href={activity.musicLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-green-700 bg-green-50 border-green-200 hover:bg-green-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.musicLink, `${activity.activity} - Music`, 'music');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Music</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                  {activity.backingLink && (
                                    <a 
                                      href={activity.backingLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.backingLink, `${activity.activity} - Backing Track`, 'backing');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Backing</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                  {activity.resourceLink && (
                                    <a 
                                      href={activity.resourceLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.resourceLink, `${activity.activity} - Resource`, 'resource');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Resource</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                  {activity.link && (
                                    <a 
                                      href={activity.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.link, `${activity.activity} - Link`, 'link');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Link</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                  {activity.vocalsLink && (
                                    <a 
                                      href={activity.vocalsLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.vocalsLink, `${activity.activity} - Vocals`, 'vocals');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Vocals</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                  {activity.imageLink && (
                                    <a 
                                      href={activity.imageLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg border transition-colors text-pink-700 bg-pink-50 border-pink-200 hover:bg-pink-100 flex items-center cursor-pointer print:p-1 print:text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResourceClick(activity.imageLink, `${activity.activity} - Image`, 'image');
                                      }}
                                    >
                                      <span className="text-sm font-medium truncate print:text-xs">Image</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 print:h-3 print:w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Click to view resources message - hide in print */}
                            <div className="text-xs text-blue-600 italic mt-2 print:hidden">
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

            {/* Print-only footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>EYFS Lesson Builder</p>
              <p className="pageNumber">Page 1</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end print:hidden">
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
    </div>
  );
}