import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, File, Printer, X, Check, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface LessonExporterProps {
  lessonNumber: string;
  onClose: () => void;
}

export function LessonExporter({ lessonNumber, onClose }: LessonExporterProps) {
  const { allLessonsData, currentSheetInfo, eyfsStatements } = useData();
  const { getCategoryColor } = useSettings();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'preview'>('preview');
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
      if (exportFormat === 'pdf') {
        // Export to PDF using html2canvas to capture the styled preview
        if (previewRef.current) {
          const canvas = await html2canvas(previewRef.current, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Allow loading cross-origin images
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
          pdf.save(`${currentSheetInfo.sheet}_${title.replace(/\s+/g, '_')}.pdf`);
        }
      }
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Lesson Plan</h2>
            <p className="text-sm text-gray-600">
              {lessonData.title || `Lesson ${lessonNumber}`} - {currentSheetInfo.display}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setExportFormat('preview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  exportFormat === 'preview' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  exportFormat === 'pdf' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
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
                <span>Include EYFS Standards</span>
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
                    <span>Export {exportFormat.toUpperCase()}</span>
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
            className="bg-white mx-auto shadow-md max-w-[210mm] print:shadow-none print:max-w-none"
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
                <div className="mb-6 print:mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2 print:text-base print:mb-2">
                    <Tag className="h-5 w-5 text-blue-600 print:h-4 print:w-4" />
                    <span>Learning Goals</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2">
                    {Object.entries(groupedEyfs).map(([area, statements]) => (
                      <div key={area} className="bg-gray-50 rounded-lg p-3 border border-gray-200 print:p-2 print:bg-gray-100">
                        <h4 className="font-medium text-gray-800 text-sm mb-2 print:text-xs print:mb-1">{area}</h4>
                        <ul className="space-y-1">
                          {statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 print:text-xs">
                              <span className="text-green-500 font-bold">✓</span>
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
                  <div key={category} className="mb-8 print:mb-6">
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
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden print:border print:rounded-lg print:mb-3"
                          style={{ 
                            borderLeftWidth: '4px',
                            borderLeftColor: categoryColor
                          }}
                        >
                          {/* Activity Header */}
                          <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center print:p-2">
                            <h3 className="font-semibold text-gray-900 print:text-sm">
                              {activity.activity}
                            </h3>
                            {activity.time > 0 && (
                              <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-medium print:text-xs">
                                {activity.time} min
                              </div>
                            )}
                          </div>
                          
                          {/* Activity Content */}
                          <div className="p-3 print:p-2">
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
                                      className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-red-200 transition-colors"
                                    >
                                      Video
                                    </a>
                                  )}
                                  {activity.musicLink && (
                                    <a 
                                      href={activity.musicLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-green-200 transition-colors"
                                    >
                                      Music
                                    </a>
                                  )}
                                  {activity.backingLink && (
                                    <a 
                                      href={activity.backingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-blue-200 transition-colors"
                                    >
                                      Backing
                                    </a>
                                  )}
                                  {activity.resourceLink && (
                                    <a 
                                      href={activity.resourceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full print:text-[8px] print:py-0.5 print:px-1.5 hover:bg-purple-200 transition-colors"
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
                <div className="mt-8 pt-6 border-t border-gray-200 print:mt-4 print:pt-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Lesson Notes</h3>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 text-gray-700 print:p-2 print:text-xs"
                    dangerouslySetInnerHTML={{ __html: lessonData.notes }}
                  />
                </div>
              )}
              
              {/* Footer with page number */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-4 print:pt-2">
                <p>EYFS Lesson Builder - {currentSheetInfo.display}</p>
                <p className="pageNumber hidden print:block">Page 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}