import React, { useState, useRef } from 'react';
import { Download, FileText, File, Printer, X, Check, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface LessonPrintModalProps {
  lessonNumber: string;
  onClose: () => void;
}

export function LessonPrintModal({ lessonNumber, onClose }: LessonPrintModalProps) {
  const { allLessonsData, currentSheetInfo, eyfsStatements } = useData();
  const { getCategoryColor } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showEyfs, setShowEyfs] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const lessonData = allLessonsData[lessonNumber];
  const lessonEyfs = eyfsStatements[lessonNumber] || [];

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

  // Calculate total duration
  const totalDuration = lessonData.totalTime;

  // Group EYFS statements by area
  const groupedEyfs: Record<string, string[]> = {};
  lessonEyfs.forEach(statement => {
    const parts = statement.split(':');
    const area = parts[0].trim();
    const detail = parts.length > 1 ? parts[1].trim() : statement;
    
    if (!groupedEyfs[area]) {
      groupedEyfs[area] = [];
    }
    
    groupedEyfs[area].push(detail);
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title and header
      pdf.setFontSize(18);
      pdf.text(`${currentSheetInfo.display} Lesson Plan`, 105, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text(lessonData.title || `Lesson ${lessonNumber}`, 105, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Total Time: ${lessonData.totalTime} minutes`, 105, 40, { align: 'center' });
      
      let yPosition = 50;
      
      // Add EYFS Goals if enabled
      if (showEyfs && lessonEyfs.length > 0) {
        pdf.setFontSize(14);
        pdf.text("🎯 Learning Goals", 20, yPosition);
        yPosition += 10;
        
        // Add each EYFS area and its statements
        Object.entries(groupedEyfs).forEach(([area, statements]) => {
          pdf.setFontSize(12);
          pdf.text(area, 20, yPosition);
          yPosition += 6;
          
          statements.forEach(statement => {
            pdf.setFontSize(10);
            pdf.text(`✓ ${statement}`, 25, yPosition);
            yPosition += 5;
          });
          
          yPosition += 5;
        });
      }
      
      // Add activities by category
      lessonData.categoryOrder.forEach(category => {
        const activities = lessonData.grouped[category] || [];
        if (activities.length === 0) return;
        
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Add category header
        pdf.setFontSize(14);
        const categoryColorHex = getCategoryColor(category).replace('#', '');
        const r = parseInt(categoryColorHex.substring(0, 2), 16);
        const g = parseInt(categoryColorHex.substring(2, 4), 16);
        const b = parseInt(categoryColorHex.substring(4, 6), 16);
        pdf.setTextColor(r, g, b);
        pdf.text(category, 20, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 8;
        
        // Add activities
        activities.forEach(activity => {
          // Check if we need a new page
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Activity title and time
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${activity.activity}${activity.time ? ` (${activity.time} mins)` : ''}`, 25, yPosition);
          yPosition += 6;
          
          // Activity description
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(10);
          
          // Clean description text (remove HTML tags)
          const descText = activity.description.replace(/<[^>]*>/g, '');
          
          // Split text to fit page width
          const splitText = pdf.splitTextToSize(descText, 160);
          splitText.forEach(line => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.text(line, 30, yPosition);
            yPosition += 5;
          });
          
          // Add resources with links
          const resources = [];
          if (activity.videoLink) resources.push({ text: 'Video', url: activity.videoLink });
          if (activity.musicLink) resources.push({ text: 'Music', url: activity.musicLink });
          if (activity.backingLink) resources.push({ text: 'Backing', url: activity.backingLink });
          if (activity.resourceLink) resources.push({ text: 'Resource', url: activity.resourceLink });
          if (activity.link) resources.push({ text: 'Link', url: activity.link });
          if (activity.vocalsLink) resources.push({ text: 'Vocals', url: activity.vocalsLink });
          if (activity.imageLink) resources.push({ text: 'Image', url: activity.imageLink });
          
          if (resources.length > 0) {
            yPosition += 3;
            pdf.setFont(undefined, 'italic');
            pdf.text('Resources:', 30, yPosition);
            yPosition += 5;
            
            resources.forEach(resource => {
              if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
              }
              
              // Add text with link
              const text = `${resource.text}: ${resource.url}`;
              const textWidth = pdf.getTextWidth(text);
              
              pdf.setTextColor(0, 0, 255); // Blue color for links
              pdf.text(text, 35, yPosition);
              
              // Add link annotation
              pdf.link(35, yPosition - 5, textWidth, 6, { url: resource.url });
              
              pdf.setTextColor(0, 0, 0); // Reset text color
              yPosition += 5;
            });
            
            pdf.setFont(undefined, 'normal');
          }
          
          yPosition += 8;
        });
        
        yPosition += 5;
      });
      
      // Add notes if available
      if (lessonData.notes) {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.text('Lesson Notes', 20, yPosition);
        yPosition += 8;
        
        // Clean notes text (remove HTML tags)
        const notesText = lessonData.notes.replace(/<[^>]*>/g, '');
        
        // Split text to fit page width
        pdf.setFontSize(10);
        const splitNotes = pdf.splitTextToSize(notesText, 170);
        splitNotes.forEach(line => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(line, 25, yPosition);
          yPosition += 5;
        });
      }
      
      // Add footer with page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
        pdf.text(`Curriculum Designer - ${currentSheetInfo.display}`, 105, 292, { align: 'center' });
      }
      
      // Save the PDF
      const title = lessonData.title || `Lesson ${lessonNumber}`;
      pdf.save(`${currentSheetInfo.sheet}_${title.replace(/\s+/g, '_')}.pdf`);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Save / Print Lesson Plan</h2>
            <p className="text-sm text-gray-600">
              {lessonData.title || `Lesson ${lessonNumber}`} - {currentSheetInfo.display}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showEyfs}
                  onChange={() => setShowEyfs(!showEyfs)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Include Learning Goals</span>
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:bg-blue-400"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Exporting...</span>
                  </>
                ) : exportSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Exported!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="bg-white mx-auto shadow-md max-w-[210mm] print:shadow-none print:max-w-none print-content"
            style={{ minHeight: '297mm' }}
          >
            {/* Lesson Plan Preview */}
            <div className="p-8 print:p-4">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-6 mb-6 relative print:pb-4 print:mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                  {currentSheetInfo.display} Lesson Plan
                </h1>
                <h2 className="text-xl font-semibold text-gray-800 mb-2 print:text-lg">
                  {lessonData.title || `Lesson ${lessonNumber}`}
                </h2>
                <div className="text-gray-600 font-medium">
                  Total Time: {totalDuration} minutes
                </div>
                
                {/* Page number - only visible when printing */}
                <div className="hidden print:block absolute top-0 right-0 text-xs text-gray-500">
                  Page <span className="pageNumber"></span>
                </div>
              </div>
              
              {/* EYFS Goals */}
              {showEyfs && lessonEyfs.length > 0 && (
                <div className="mb-6 print:mb-4 learning-goals">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2 print:text-base print:mb-2 print-emoji">
                    <span>🎯</span>
                    <span>Learning Goals</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2 learning-goals-list">
                    {Object.entries(groupedEyfs).map(([area, statements]) => (
                      <div key={area} className="bg-gray-50 rounded-lg p-3 border border-gray-200 print:p-2 print:bg-gray-100">
                        <h4 className="font-medium text-gray-800 text-sm mb-2 print:text-xs print:mb-1">{area}</h4>
                        <ul className="space-y-1">
                          {statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 print:text-xs">
                              <span className="text-green-500 font-bold print-emoji">✓</span>
                              <span>{statement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Activities by Category */}
              {lessonData.categoryOrder.map((category) => {
                const activities = lessonData.grouped[category] || [];
                if (activities.length === 0) return null;
                
                const categoryColor = getCategoryColor(category);
                
                return (
                  <div key={category} className="mb-8 print:mb-6 page-break-inside-avoid">
                    <h2 
                      className="text-xl font-semibold mb-4 print:text-lg print:mb-3"
                      style={{ 
                        color: category === 'Welcome' ? '#F59E0B' : 
                               category === 'Kodaly Songs' ? '#8B5CF6' : 
                               category === 'Goodbye' ? '#10B981' : categoryColor 
                      }}
                    >
                      {category}
                    </h2>
                    
                    <div className="space-y-4 print:space-y-3">
                      {activities.map((activity, index) => (
                        <div 
                          key={`${category}-${index}`} 
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden print:border print:rounded-lg print:mb-3 print-activity"
                          style={{ 
                            borderLeftWidth: '4px',
                            borderLeftColor: categoryColor
                          }}
                        >
                          {/* Activity Header */}
                          <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center print:p-2 activity-header">
                            <h3 className="font-semibold text-gray-900 print:text-sm activity-name">
                              {activity.activity}
                            </h3>
                            {activity.time > 0 && (
                              <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-medium print:text-xs time-badge">
                                {activity.time} min
                              </div>
                            )}
                          </div>
                          
                          {/* Activity Content */}
                          <div className="p-3 print:p-2 activity-content">
                            {/* Activity Text (if available) */}
                            {activity.activityText && (
                              <div 
                                className="mb-2 text-sm text-gray-800 print:text-xs"
                                dangerouslySetInnerHTML={{ __html: activity.activityText }}
                              />
                            )}
                            
                            {/* Description */}
                            <div 
                              className="text-sm text-gray-700 print:text-xs"
                              dangerouslySetInnerHTML={{ 
                                __html: activity.description.includes('<') ? 
                                  activity.description : 
                                  activity.description.replace(/\n/g, '<br>') 
                              }}
                            />
                            
                            {/* Resources */}
                            {(activity.videoLink || activity.musicLink || activity.backingLink || 
                              activity.resourceLink || activity.link || activity.vocalsLink || 
                              activity.imageLink) && (
                              <div className="mt-2 pt-2 border-t border-gray-100 print:mt-1 print:pt-1">
                                <div className="flex flex-wrap gap-1">
                                  {activity.videoLink && (
                                    <a 
                                      href={activity.videoLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-red-200 transition-colors resource-badge resource-badge-video"
                                    >
                                      Video
                                    </a>
                                  )}
                                  {activity.musicLink && (
                                    <a 
                                      href={activity.musicLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-green-200 transition-colors resource-badge resource-badge-music"
                                    >
                                      Music
                                    </a>
                                  )}
                                  {activity.backingLink && (
                                    <a 
                                      href={activity.backingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-blue-200 transition-colors resource-badge resource-badge-backing"
                                    >
                                      Backing
                                    </a>
                                  )}
                                  {activity.resourceLink && (
                                    <a 
                                      href={activity.resourceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-purple-200 transition-colors resource-badge resource-badge-resource"
                                    >
                                      Resource
                                    </a>
                                  )}
                                  {activity.link && (
                                    <a 
                                      href={activity.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-gray-200 transition-colors"
                                    >
                                      Link
                                    </a>
                                  )}
                                  {activity.vocalsLink && (
                                    <a 
                                      href={activity.vocalsLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-orange-200 transition-colors"
                                    >
                                      Vocals
                                    </a>
                                  )}
                                  {activity.imageLink && (
                                    <a 
                                      href={activity.imageLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-pink-200 transition-colors"
                                    >
                                      Image
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Notes Section */}
              {lessonData.notes && (
                <div className="mt-8 pt-6 border-t border-gray-200 print:mt-4 print:pt-3 page-break-inside-avoid">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Lesson Notes</h3>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 text-gray-700 print:p-2 print:text-xs"
                    dangerouslySetInnerHTML={{ __html: lessonData.notes }}
                  />
                </div>
              )}
              
              {/* Footer with page number */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-4 print:pt-2">
                <p>Curriculum Designer - {currentSheetInfo.display}</p>
                <p className="pageNumber hidden print:block">Page 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}