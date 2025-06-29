import React, { useState, useRef } from 'react';
import { Download, Printer, X, Check, Tag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface LessonPrintModalProps {
  lessonNumber?: string;
  lessonNumbers?: string[];
  onClose: () => void;
  halfTermId?: string;
  unitId?: string;
  unitName?: string;
  isUnitPrint?: boolean;
}

export function LessonPrintModal({ 
  lessonNumber, 
  lessonNumbers = [], 
  onClose, 
  halfTermId,
  unitId,
  unitName,
  isUnitPrint = false
}: LessonPrintModalProps) {
  const { allLessonsData, currentSheetInfo, eyfsStatements, halfTerms } = useData();
  const { getCategoryColor } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showEyfs, setShowEyfs] = useState(true);
  const [exportMode, setExportMode] = useState<'single' | 'halfterm' | 'unit'>('single');
  const previewRef = useRef<HTMLDivElement>(null);

  // Determine which lesson numbers to use
  const effectiveLessonNumbers = lessonNumber 
    ? [lessonNumber] 
    : lessonNumbers.length > 0 
      ? lessonNumbers 
      : halfTermId 
        ? getLessonsForHalfTerm(halfTermId)
        : [];

  // Get the first lesson data for preview
  const firstLessonData = effectiveLessonNumbers.length > 0 
    ? allLessonsData[effectiveLessonNumbers[0]] 
    : null;

  // Get lessons for half-term if applicable
  function getLessonsForHalfTerm(halfTermId: string): string[] {
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    return halfTerm?.lessons || [];
  }

  if (!firstLessonData && effectiveLessonNumbers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">No lesson data found to print.</p>
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

  // Determine the appropriate export mode based on props
  React.useEffect(() => {
    if (unitId) {
      setExportMode('unit');
    } else if (halfTermId) {
      setExportMode('halfterm');
    } else {
      setExportMode('single');
    }
  }, [unitId, halfTermId]);

  // Get EYFS statements for a lesson
  const getLessonEyfs = (lessonNum: string) => {
    return eyfsStatements[lessonNum] || [];
  };

  // Group EYFS statements by area
  const groupEyfsStatements = (statements: string[]) => {
    const grouped: Record<string, string[]> = {};
    
    statements.forEach(statement => {
      const parts = statement.split(':');
      const area = parts[0].trim();
      const detail = parts.length > 1 ? parts[1].trim() : statement;
      
      if (!grouped[area]) {
        grouped[area] = [];
      }
      
      grouped[area].push(detail);
    });
    
    return grouped;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportMode === 'single' || exportMode === 'unit') {
        await exportLessonsToPdf(effectiveLessonNumbers);
      } else if (exportMode === 'halfterm') {
        await exportHalfTermToPdf();
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

  const exportLessonsToPdf = async (lessonNums: string[]) => {
    // Create PDF with proper A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title page
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    
    if (isUnitPrint && unitName) {
      // Unit title page
      pdf.text(`${currentSheetInfo.display}`, 105, 60, { align: 'center' });
      pdf.setFontSize(30);
      pdf.text(`Unit: ${unitName}`, 105, 80, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(`${lessonNums.length} Lessons`, 105, 100, { align: 'center' });
    } else if (lessonNums.length > 1) {
      // Multiple lessons title page
      pdf.text(`${currentSheetInfo.display}`, 105, 60, { align: 'center' });
      pdf.setFontSize(30);
      pdf.text(`Lesson Collection`, 105, 80, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(`${lessonNums.length} Lessons`, 105, 100, { align: 'center' });
    } else {
      // Single lesson - no title page needed
      // We'll start directly with the lesson content
    }
    
    // Process each lesson
    for (let i = 0; i < lessonNums.length; i++) {
      const lessonNum = lessonNums[i];
      const lesson = allLessonsData[lessonNum];
      
      if (!lesson) continue;
      
      // For unit print or multiple lessons, add a new page for each lesson
      // For single lesson, only add title page if it's the first lesson
      if ((isUnitPrint || lessonNums.length > 1) || i > 0) {
        pdf.addPage();
      }
      
      // Add lesson header
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Lesson ${lessonNum}: ${lesson.title || `Lesson ${lessonNum}`}`, 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Duration: ${lesson.totalTime} minutes`, 105, 30, { align: 'center' });
      
      // Add EYFS standards if available
      const lessonEyfs = getLessonEyfs(lessonNum);
      if (showEyfs && lessonEyfs.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Learning Goals', 20, 45);
        
        // Group EYFS statements by area
        const groupedEyfs = groupEyfsStatements(lessonEyfs);
        
        // Add EYFS statements to PDF
        let yPos = 55;
        Object.entries(groupedEyfs).forEach(([area, statements]) => {
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 150);
          pdf.text(area, 20, yPos);
          yPos += 7;
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          statements.forEach(statement => {
            // Check if we need a new page
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.text(`• ${statement}`, 25, yPos);
            yPos += 6;
          });
          
          yPos += 5;
        });
      }
      
      // Add activities
      let yPos = showEyfs && lessonEyfs.length > 0 ? 130 : 45;
      
      lesson.categoryOrder.forEach(category => {
        const activities = lesson.grouped[category] || [];
        
        // Check if we need a new page
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        // Category header
        pdf.setFontSize(14);
        const categoryColor = getCategoryColor(category);
        const colorRGB = hexToRgb(categoryColor);
        if (colorRGB) {
          pdf.setTextColor(colorRGB.r, colorRGB.g, colorRGB.b);
        } else {
          pdf.setTextColor(0, 0, 150);
        }
        pdf.text(category, 20, yPos);
        yPos += 8;
        pdf.setTextColor(0, 0, 0);
        
        // Activities
        pdf.setFontSize(12);
        activities.forEach(activity => {
          // Check if we need a new page
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFont(undefined, 'bold');
          pdf.text(`${activity.activity}${activity.time ? ` (${activity.time} mins)` : ''}`, 25, yPos);
          yPos += 6;
          
          pdf.setFont(undefined, 'normal');
          // Split description into lines
          const descText = activity.description.replace(/<[^>]*>/g, '');
          const splitText = pdf.splitTextToSize(descText, 165);
          
          splitText.forEach(line => {
            // Check if we need a new page
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.text(line, 30, yPos);
            yPos += 6;
          });
          
          // Add resources if available
          const resources = [];
          if (activity.videoLink) resources.push(`Video: ${activity.videoLink}`);
          if (activity.musicLink) resources.push(`Music: ${activity.musicLink}`);
          if (activity.backingLink) resources.push(`Backing: ${activity.backingLink}`);
          if (activity.resourceLink) resources.push(`Resource: ${activity.resourceLink}`);
          if (activity.link) resources.push(`Link: ${activity.link}`);
          if (activity.vocalsLink) resources.push(`Vocals: ${activity.vocalsLink}`);
          if (activity.imageLink) resources.push(`Image: ${activity.imageLink}`);
          
          if (resources.length > 0) {
            yPos += 3;
            pdf.setFont(undefined, 'italic');
            pdf.text('Resources:', 30, yPos);
            yPos += 5;
            
            resources.forEach(resource => {
              if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
              }
              
              // Add hyperlinks for resources
              const linkText = resource.split(': ')[0];
              const linkUrl = resource.split(': ')[1];
              
              // Add text with link
              const textWidth = pdf.getTextWidth(linkText);
              pdf.setTextColor(0, 0, 255); // Blue color for links
              pdf.textWithLink(linkText, 35, yPos, { url: linkUrl });
              
              // Add the URL after the link text
              pdf.setTextColor(0, 0, 0); // Reset to black
              pdf.text(`: ${linkUrl}`, 35 + textWidth, yPos);
              
              yPos += 5;
            });
            
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
          }
          
          yPos += 5;
        });
        
        yPos += 10;
      });
      
      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      
      if (isUnitPrint || lessonNums.length > 1) {
        pdf.text(`Page ${i + 2} of ${lessonNums.length + 1}`, 105, 285, { align: 'center' });
      } else {
        pdf.text(`Page ${i + 1} of ${lessonNums.length}`, 105, 285, { align: 'center' });
      }
    }
    
    // Save the PDF
    if (isUnitPrint && unitName) {
      pdf.save(`${currentSheetInfo.sheet}_Unit_${unitName.replace(/\s+/g, '_')}.pdf`);
    } else if (lessonNums.length > 1) {
      pdf.save(`${currentSheetInfo.sheet}_Multiple_Lessons.pdf`);
    } else {
      const lessonTitle = allLessonsData[lessonNums[0]]?.title || `Lesson_${lessonNums[0]}`;
      pdf.save(`${currentSheetInfo.sheet}_${lessonTitle.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const exportHalfTermToPdf = async () => {
    if (!halfTermId) {
      alert('No half-term selected');
      return;
    }
    
    const lessons = getLessonsForHalfTerm(halfTermId);
    if (lessons.length === 0) {
      alert('No lessons found for this half-term');
      return;
    }
    
    // Create PDF with proper A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title page
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${currentSheetInfo.display}`, 105, 60, { align: 'center' });
    pdf.setFontSize(30);
    pdf.text(`Half-Term Plan`, 105, 80, { align: 'center' });
    
    const currentHalfTerm = halfTerms.find(term => term.id === halfTermId);
    if (currentHalfTerm) {
      pdf.setFontSize(20);
      pdf.text(`${currentHalfTerm.name} (${currentHalfTerm.months})`, 105, 100, { align: 'center' });
    }
    
    pdf.setFontSize(12);
    pdf.text(`${lessons.length} Lessons`, 105, 120, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 130, { align: 'center' });
    
    // Process each lesson
    for (let i = 0; i < lessons.length; i++) {
      const lessonNum = lessons[i];
      const lesson = allLessonsData[lessonNum];
      
      if (!lesson) continue;
      
      // Add a new page for each lesson
      pdf.addPage();
      
      // Add lesson header
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Lesson ${lessonNum}: ${lesson.title || `Lesson ${lessonNum}`}`, 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Duration: ${lesson.totalTime} minutes`, 105, 30, { align: 'center' });
      
      // Add EYFS standards if available
      const lessonEyfs = eyfsStatements[lessonNum] || [];
      if (showEyfs && lessonEyfs.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Learning Goals', 20, 45);
        
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
        
        // Add EYFS statements to PDF
        let yPos = 55;
        Object.entries(groupedEyfs).forEach(([area, statements]) => {
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 150);
          pdf.text(area, 20, yPos);
          yPos += 7;
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          statements.forEach(statement => {
            // Check if we need a new page
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.text(`• ${statement}`, 25, yPos);
            yPos += 6;
          });
          
          yPos += 5;
        });
      }
      
      // Add activities
      let yPos = showEyfs && lessonEyfs.length > 0 ? 130 : 45;
      
      lesson.categoryOrder.forEach(category => {
        const activities = lesson.grouped[category] || [];
        
        // Check if we need a new page
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        // Category header
        pdf.setFontSize(14);
        const categoryColor = getCategoryColor(category);
        const colorRGB = hexToRgb(categoryColor);
        if (colorRGB) {
          pdf.setTextColor(colorRGB.r, colorRGB.g, colorRGB.b);
        } else {
          pdf.setTextColor(0, 0, 150);
        }
        pdf.text(category, 20, yPos);
        yPos += 8;
        pdf.setTextColor(0, 0, 0);
        
        // Activities
        pdf.setFontSize(12);
        activities.forEach(activity => {
          // Check if we need a new page
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFont(undefined, 'bold');
          pdf.text(`${activity.activity}${activity.time ? ` (${activity.time} mins)` : ''}`, 25, yPos);
          yPos += 6;
          
          pdf.setFont(undefined, 'normal');
          // Split description into lines
          const descText = activity.description.replace(/<[^>]*>/g, '');
          const splitText = pdf.splitTextToSize(descText, 165);
          
          splitText.forEach(line => {
            // Check if we need a new page
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.text(line, 30, yPos);
            yPos += 6;
          });
          
          // Add resources if available
          const resources = [];
          if (activity.videoLink) resources.push(`Video: ${activity.videoLink}`);
          if (activity.musicLink) resources.push(`Music: ${activity.musicLink}`);
          if (activity.backingLink) resources.push(`Backing: ${activity.backingLink}`);
          if (activity.resourceLink) resources.push(`Resource: ${activity.resourceLink}`);
          if (activity.link) resources.push(`Link: ${activity.link}`);
          if (activity.vocalsLink) resources.push(`Vocals: ${activity.vocalsLink}`);
          if (activity.imageLink) resources.push(`Image: ${activity.imageLink}`);
          
          if (resources.length > 0) {
            yPos += 3;
            pdf.setFont(undefined, 'italic');
            pdf.text('Resources:', 30, yPos);
            yPos += 5;
            
            resources.forEach(resource => {
              if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
              }
              pdf.text(resource, 35, yPos, { maxWidth: 160 });
              yPos += 5;
            });
            
            pdf.setFont(undefined, 'normal');
          }
          
          yPos += 5;
        });
        
        yPos += 10;
      });
      
      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i + 2} of ${lessons.length + 1}`, 105, 285, { align: 'center' });
    }
    
    // Save the PDF
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    const halfTermName = halfTerm ? halfTerm.name.replace(/\s+/g, '_') : halfTermId;
    pdf.save(`${currentSheetInfo.sheet}_${halfTermName}_Half_Term_Plan.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Save / Print {isUnitPrint ? 'Unit' : 'Lesson Plan'}</h2>
            <p className="text-sm text-gray-600">
              {isUnitPrint && unitName 
                ? `Unit: ${unitName} - ${effectiveLessonNumbers.length} lessons` 
                : effectiveLessonNumbers.length > 1 
                  ? `${effectiveLessonNumbers.length} lessons` 
                  : firstLessonData?.title || `Lesson ${effectiveLessonNumbers[0]}`} - {currentSheetInfo.display}
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
                <span>Include EYFS Standards</span>
              </label>
              
              {halfTermId && !isUnitPrint && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Export:</label>
                  <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExportMode('single')}
                      className={`px-3 py-1.5 text-sm font-medium ${
                        exportMode === 'single' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Single Lesson
                    </button>
                    <button
                      onClick={() => setExportMode('halfterm')}
                      className={`px-3 py-1.5 text-sm font-medium ${
                        exportMode === 'halfterm' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Entire Half-Term
                    </button>
                  </div>
                </div>
              )}
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
            className="bg-white mx-auto shadow-md max-w-[210mm] print:shadow-none print:max-w-none"
            style={{ minHeight: '297mm' }}
          >
            {/* Lesson Plan Preview */}
            <div className="p-8 print:p-4">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-6 mb-6 relative print:pb-4 print:mb-4">
                {isUnitPrint && unitName ? (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                      {currentSheetInfo.display} Unit Plan
                    </h1>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 print:text-lg">
                      {unitName}
                    </h2>
                    <div className="text-gray-600 font-medium">
                      {effectiveLessonNumbers.length} lessons
                    </div>
                  </>
                ) : effectiveLessonNumbers.length > 1 ? (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                      {currentSheetInfo.display} Lesson Collection
                    </h1>
                    <div className="text-gray-600 font-medium">
                      {effectiveLessonNumbers.length} lessons
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                      {currentSheetInfo.display} Lesson Plan
                    </h1>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 print:text-lg">
                      {firstLessonData?.title || `Lesson ${effectiveLessonNumbers[0]}`}
                    </h2>
                    <div className="text-gray-600 font-medium">
                      Total Time: {firstLessonData?.totalTime || 0} minutes
                    </div>
                  </>
                )}
                
                {/* Page number - only visible when printing */}
                <div className="hidden print:block absolute top-0 right-0 text-xs text-gray-500">
                  Page <span className="pageNumber"></span>
                </div>
              </div>
              
              {/* For unit or multiple lessons, show a list of lessons */}
              {(isUnitPrint || effectiveLessonNumbers.length > 1) && (
                <div className="mb-6 print:mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">
                    Lessons Included
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-2 print:bg-gray-100">
                    <ul className="space-y-1">
                      {effectiveLessonNumbers.map((num, index) => {
                        const lesson = allLessonsData[num];
                        if (!lesson) return null;
                        
                        return (
                          <li key={num} className="flex items-center space-x-2 text-sm text-gray-700 print:text-xs">
                            <span className="font-medium">Lesson {num}:</span>
                            <span>{lesson.title || `Lesson ${num}`}</span>
                            <span className="text-gray-500">({lesson.totalTime} mins)</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* For single lesson view, show EYFS and lesson content */}
              {effectiveLessonNumbers.length === 1 && (
                <>
                  {/* EYFS Goals */}
                  {showEyfs && getLessonEyfs(effectiveLessonNumbers[0]).length > 0 && (
                    <div className="mb-6 print:mb-4 w-full">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2 print:text-base print:mb-2">
                        <Tag className="h-5 w-5 text-blue-600 print:h-4 print:w-4" />
                        <span>Learning Goals</span>
                      </h3>
                      <div className="w-full grid grid-cols-1 gap-3 print:gap-2">
                        {Object.entries(groupEyfsStatements(getLessonEyfs(effectiveLessonNumbers[0]))).map(([area, statements]) => (
                          <div key={area} className="bg-gray-50 rounded-lg p-3 border border-gray-200 print:p-2 print:bg-gray-100 w-full">
                            <h4 className="font-medium text-gray-800 text-sm mb-2 print:text-xs print:mb-1">{area}</h4>
                            <ul className="space-y-1 w-full">
                              {statements.map((statement, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 print:text-xs">
                                  <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                                  <span className="flex-1">{statement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Activities by Category */}
                  {firstLessonData?.categoryOrder.map((category) => {
                    const activities = firstLessonData.grouped[category] || [];
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
                  {firstLessonData?.notes && (
                    <div className="mt-8 pt-6 border-t border-gray-200 print:mt-4 print:pt-3 page-break-inside-avoid">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Lesson Notes</h3>
                      <div 
                        className="bg-gray-50 rounded-lg p-4 text-gray-700 print:p-2 print:text-xs"
                        dangerouslySetInnerHTML={{ __html: firstLessonData.notes }}
                      />
                    </div>
                  )}
                </>
              )}
              
              {/* For unit or multiple lessons, show a placeholder */}
              {(isUnitPrint || effectiveLessonNumbers.length > 1) && (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {isUnitPrint 
                      ? `This unit contains ${effectiveLessonNumbers.length} lessons. Each lesson will be printed on a separate page.` 
                      : `${effectiveLessonNumbers.length} lessons will be printed, one per page.`
                    }
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Click the "Export PDF" button to generate the complete document.
                  </p>
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