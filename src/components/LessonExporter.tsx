import React, { useState, useRef } from 'react';
import { Download, FileText, File, Printer, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div 
            ref={previewRef}
            className="bg-white mx-auto shadow-md max-w-[210mm]"
            style={{ minHeight: '297mm' }}
          >
            {/* Lesson Plan Preview */}
            <div className="p-8">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-6 mb-6 relative">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {lessonData.title || `Lesson ${lessonNumber}`}
                </h1>
                <div className="text-gray-600 font-medium">
                  {currentSheetInfo.display} • {totalDuration} minutes
                </div>
              </div>
              
              {/* EYFS Goals */}
              {showEyfs && lessonEyfs.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 EYFS Learning Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(groupedEyfs).map(([area, statements]) => (
                      <div key={area} className="bg-white rounded-lg p-3 border border-blue-100">
                        <h4 className="font-medium text-blue-800 text-sm mb-2">{area}</h4>
                        <ul className="space-y-1">
                          {statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
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
                  <div key={category} className="mb-8">
                    <h2 
                      className="text-xl font-semibold mb-4 pb-2 border-b-2"
                      style={{ borderColor: `${categoryColor}40`, color: categoryColor }}
                    >
                      {category}
                    </h2>
                    
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div 
                          key={`${category}-${index}`}
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                        >
                          {/* Activity Header */}
                          <div 
                            className="p-3 flex justify-between items-center border-b border-gray-200"
                            style={{ borderLeft: `4px solid ${categoryColor}` }}
                          >
                            <div className="font-semibold text-gray-900">{activity.activity}</div>
                            {activity.time > 0 && (
                              <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                {activity.time} min
                              </div>
                            )}
                          </div>
                          
                          {/* Activity Content */}
                          <div className="p-4">
                            {/* Activity Text (if available) */}
                            {activity.activityText && (
                              <div 
                                className="mb-4 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: activity.activityText }}
                              />
                            )}
                            
                            {/* Description */}
                            {activity.description && (
                              <div 
                                className="text-gray-700 text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: activity.description }}
                              />
                            )}
                            
                            {/* Resources */}
                            {(activity.videoLink || activity.musicLink || activity.backingLink || 
                              activity.resourceLink || activity.link || activity.vocalsLink || 
                              activity.imageLink) && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Resources</h4>
                                <div className="flex flex-wrap gap-2">
                                  {activity.videoLink && (
                                    <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                      🎥 Video
                                    </div>
                                  )}
                                  {activity.musicLink && (
                                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      🎵 Music
                                    </div>
                                  )}
                                  {activity.backingLink && (
                                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      🎹 Backing
                                    </div>
                                  )}
                                  {activity.resourceLink && (
                                    <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                      📄 Resource
                                    </div>
                                  )}
                                  {activity.link && (
                                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                      🔗 Link
                                    </div>
                                  )}
                                  {activity.vocalsLink && (
                                    <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                      🎤 Vocals
                                    </div>
                                  )}
                                  {activity.imageLink && (
                                    <div className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                                      🖼️ Image
                                    </div>
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
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Lesson Notes</h3>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: lessonData.notes }}
                  />
                </div>
              )}
              
              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>EYFS Lesson Builder • {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}