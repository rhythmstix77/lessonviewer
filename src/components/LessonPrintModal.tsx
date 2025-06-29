import React, { useState, useRef, useEffect } from 'react';
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
  const [contentReady, setContentReady] = useState(false);

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

  // Set content ready after component mounts
  useEffect(() => {
    setContentReady(true);
  }, []);

  // Auto-print when content is ready for unit print
  useEffect(() => {
    if (contentReady && isUnitPrint && previewRef.current) {
      // Small delay to ensure content is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [contentReady, isUnitPrint]);

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
    // Export to PDF using html2canvas to capture the styled preview
    if (previewRef.current) {
      try {
        // Create PDF with proper A4 dimensions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Add title page for unit or multiple lessons
        if (isUnitPrint || lessonNums.length > 1) {
          pdf.setFontSize(24);
          pdf.setTextColor(0, 0, 0);
          
          if (isUnitPrint && unitName) {
            // Unit title page
            pdf.text(`${currentSheetInfo.display}`, 105, 60, { align: 'center' });
            pdf.setFontSize(30);
            pdf.text(`Unit: ${unitName}`, 105, 80, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(`${lessonNums.length} Lessons`, 105, 100, { align: 'center' });
          } else {
            // Multiple lessons title page
            pdf.text(`${currentSheetInfo.display}`, 105, 60, { align: 'center' });
            pdf.setFontSize(30);
            pdf.text(`Lesson Collection`, 105, 80, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(`${lessonNums.length} Lessons`, 105, 100, { align: 'center' });
          }
          
          // Add footer to title page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page 1 of ${lessonNums.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
        }
        
        // Process each lesson
        for (let i = 0; i < lessonNums.length; i++) {
          const lessonNum = lessonNums[i];
          const lesson = allLessonsData[lessonNum];
          
          if (!lesson) continue;
          
          // For unit print or multiple lessons, add a new page for each lesson
          // For single lesson, only add page if it's not the first lesson or if we added a title page
          if ((isUnitPrint || lessonNums.length > 1) || i > 0) {
            pdf.addPage();
          }
          
          // Create a temporary div for this lesson
          const lessonDiv = document.createElement('div');
          lessonDiv.className = "bg-white p-8 print:p-4";
          lessonDiv.style.width = "210mm";
          lessonDiv.style.minHeight = "297mm";
          lessonDiv.style.position = "absolute";
          lessonDiv.style.left = "-9999px";
          document.body.appendChild(lessonDiv);
          
          // Add lesson header HTML
          lessonDiv.innerHTML = `
            <div class="text-center border-b border-gray-200 pb-6 mb-6 relative">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                ${currentSheetInfo.display} Lesson Plan
              </h1>
              <h2 class="text-xl font-semibold text-gray-800 mb-2">
                ${lesson.title || `Lesson ${lessonNum}`}
              </h2>
              <div class="text-gray-600 font-medium">
                Total Time: ${lesson.totalTime} minutes
              </div>
            </div>
          `;
          
          // Add EYFS standards if available
          const lessonEyfs = getLessonEyfs(lessonNum);
          if (showEyfs && lessonEyfs.length > 0) {
            const eyfsDiv = document.createElement('div');
            eyfsDiv.className = "mb-6";
            
            const eyfsHeader = document.createElement('h3');
            eyfsHeader.className = "text-lg font-semibold text-gray-900 mb-3";
            eyfsHeader.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              EYFS Objectives
            `;
            eyfsDiv.appendChild(eyfsHeader);
            
            // Group EYFS statements by area
            const groupedEyfs = groupEyfsStatements(lessonEyfs);
            
            const eyfsGrid = document.createElement('div');
            eyfsGrid.className = "grid grid-cols-1 gap-3";
            
            Object.entries(groupedEyfs).forEach(([area, statements]) => {
              const areaDiv = document.createElement('div');
              areaDiv.className = "bg-gray-50 rounded-lg p-3 border border-gray-200";
              
              const areaHeader = document.createElement('h4');
              areaHeader.className = "font-medium text-gray-800 text-sm mb-2";
              areaHeader.textContent = area;
              areaDiv.appendChild(areaHeader);
              
              const statementsList = document.createElement('ul');
              statementsList.className = "space-y-1";
              
              statements.forEach(statement => {
                const listItem = document.createElement('li');
                listItem.className = "flex items-start space-x-2 text-sm text-gray-700";
                listItem.innerHTML = `
                  <span class="text-green-500 font-bold">✓</span>
                  <span>${statement}</span>
                `;
                statementsList.appendChild(listItem);
              });
              
              areaDiv.appendChild(statementsList);
              eyfsGrid.appendChild(areaDiv);
            });
            
            eyfsDiv.appendChild(eyfsGrid);
            lessonDiv.appendChild(eyfsDiv);
          }
          
          // Add activities by category
          lesson.categoryOrder.forEach(category => {
            const activities = lesson.grouped[category] || [];
            if (activities.length === 0) return;
            
            const categoryColor = getCategoryColor(category);
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = "mb-8 page-break-inside-avoid";
            
            const categoryHeader = document.createElement('h2');
            categoryHeader.className = "text-xl font-semibold mb-4";
            categoryHeader.textContent = category;
            categoryHeader.style.color = category === 'Welcome' ? '#F59E0B' : 
                                        category === 'Kodaly Songs' ? '#8B5CF6' : 
                                        category === 'Goodbye' ? '#10B981' : categoryColor;
            categoryDiv.appendChild(categoryHeader);
            
            const activitiesDiv = document.createElement('div');
            activitiesDiv.className = "space-y-4";
            
            activities.forEach((activity, index) => {
              const activityDiv = document.createElement('div');
              activityDiv.className = "bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden print-activity";
              activityDiv.style.borderLeftWidth = '4px';
              activityDiv.style.borderLeftColor = categoryColor;
              
              // Activity Header
              const activityHeader = document.createElement('div');
              activityHeader.className = "bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center";
              
              const activityTitle = document.createElement('h3');
              activityTitle.className = "font-semibold text-gray-900";
              activityTitle.textContent = activity.activity;
              activityHeader.appendChild(activityTitle);
              
              if (activity.time > 0) {
                const timeBadge = document.createElement('div');
                timeBadge.className = "bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
                timeBadge.textContent = `${activity.time} min`;
                activityHeader.appendChild(timeBadge);
              }
              
              activityDiv.appendChild(activityHeader);
              
              // Activity Content
              const activityContent = document.createElement('div');
              activityContent.className = "p-3";
              
              // Activity Text (if available)
              if (activity.activityText) {
                const activityTextDiv = document.createElement('div');
                activityTextDiv.className = "mb-2 text-sm text-gray-800";
                activityTextDiv.innerHTML = activity.activityText;
                activityContent.appendChild(activityTextDiv);
              }
              
              // Description
              const descriptionDiv = document.createElement('div');
              descriptionDiv.className = "text-sm text-gray-700";
              descriptionDiv.innerHTML = activity.description.includes('<') ? 
                activity.description : 
                activity.description.replace(/\n/g, '<br>');
              activityContent.appendChild(descriptionDiv);
              
              // Resources
              if (activity.videoLink || activity.musicLink || activity.backingLink || 
                  activity.resourceLink || activity.link || activity.vocalsLink || 
                  activity.imageLink) {
                const resourcesDiv = document.createElement('div');
                resourcesDiv.className = "mt-2 pt-2 border-t border-gray-100";
                
                const resourcesWrap = document.createElement('div');
                resourcesWrap.className = "flex flex-wrap gap-1";
                
                if (activity.videoLink) {
                  const videoLink = document.createElement('a');
                  videoLink.href = activity.videoLink;
                  videoLink.target = "_blank";
                  videoLink.rel = "noopener noreferrer";
                  videoLink.className = "inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors";
                  videoLink.textContent = "Video";
                  resourcesWrap.appendChild(videoLink);
                }
                
                if (activity.musicLink) {
                  const musicLink = document.createElement('a');
                  musicLink.href = activity.musicLink;
                  musicLink.target = "_blank";
                  musicLink.rel = "noopener noreferrer";
                  musicLink.className = "inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors";
                  musicLink.textContent = "Music";
                  resourcesWrap.appendChild(musicLink);
                }
                
                if (activity.backingLink) {
                  const backingLink = document.createElement('a');
                  backingLink.href = activity.backingLink;
                  backingLink.target = "_blank";
                  backingLink.rel = "noopener noreferrer";
                  backingLink.className = "inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors";
                  backingLink.textContent = "Backing";
                  resourcesWrap.appendChild(backingLink);
                }
                
                if (activity.resourceLink) {
                  const resourceLink = document.createElement('a');
                  resourceLink.href = activity.resourceLink;
                  resourceLink.target = "_blank";
                  resourceLink.rel = "noopener noreferrer";
                  resourceLink.className = "inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200 transition-colors";
                  resourceLink.textContent = "Resource";
                  resourcesWrap.appendChild(resourceLink);
                }
                
                if (activity.link) {
                  const link = document.createElement('a');
                  link.href = activity.link;
                  link.target = "_blank";
                  link.rel = "noopener noreferrer";
                  link.className = "inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200 transition-colors";
                  link.textContent = "Link";
                  resourcesWrap.appendChild(link);
                }
                
                if (activity.vocalsLink) {
                  const vocalsLink = document.createElement('a');
                  vocalsLink.href = activity.vocalsLink;
                  vocalsLink.target = "_blank";
                  vocalsLink.rel = "noopener noreferrer";
                  vocalsLink.className = "inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors";
                  vocalsLink.textContent = "Vocals";
                  resourcesWrap.appendChild(vocalsLink);
                }
                
                if (activity.imageLink) {
                  const imageLink = document.createElement('a');
                  imageLink.href = activity.imageLink;
                  imageLink.target = "_blank";
                  imageLink.rel = "noopener noreferrer";
                  imageLink.className = "inline-flex items-center px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full hover:bg-pink-200 transition-colors";
                  imageLink.textContent = "Image";
                  resourcesWrap.appendChild(imageLink);
                }
                
                resourcesDiv.appendChild(resourcesWrap);
                activityContent.appendChild(resourcesDiv);
              }
              
              activityDiv.appendChild(activityContent);
              activitiesDiv.appendChild(activityDiv);
            });
            
            categoryDiv.appendChild(activitiesDiv);
            lessonDiv.appendChild(categoryDiv);
          });
          
          // Add notes section if available
          if (lesson.notes) {
            const notesDiv = document.createElement('div');
            notesDiv.className = "mt-8 pt-6 border-t border-gray-200 page-break-inside-avoid";
            
            const notesHeader = document.createElement('h3');
            notesHeader.className = "text-lg font-semibold text-gray-900 mb-3";
            notesHeader.textContent = "Lesson Notes";
            notesDiv.appendChild(notesHeader);
            
            const notesContent = document.createElement('div');
            notesContent.className = "bg-gray-50 rounded-lg p-4 text-gray-700";
            notesContent.innerHTML = lesson.notes;
            notesDiv.appendChild(notesContent);
            
            lessonDiv.appendChild(notesDiv);
          }
          
          // Add footer
          const footerDiv = document.createElement('div');
          footerDiv.className = "mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500";
          
          const pageNum = isUnitPrint || lessonNums.length > 1 ? i + 2 : i + 1;
          const totalPages = isUnitPrint || lessonNums.length > 1 ? lessonNums.length + 1 : lessonNums.length;
          
          footerDiv.innerHTML = `
            <p>Page ${pageNum} of ${totalPages} | Curriculum Designer – ${currentSheetInfo.display} | © 2025</p>
          `;
          
          lessonDiv.appendChild(footerDiv);
          
          // Capture the lesson div with html2canvas
          const canvas = await html2canvas(lessonDiv, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Allow loading cross-origin images
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          // Remove the temporary div
          document.body.removeChild(lessonDiv);
          
          const imgData = canvas.toDataURL('image/png');
          
          // A4 dimensions: 210mm x 297mm
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add image to PDF
          if (i > 0 || isUnitPrint || lessonNums.length > 1) {
            // Don't add image to first page if we already added a title page
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          } else {
            // For single lesson without title page, add directly to first page
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          }
          
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
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
      }
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
    
    // Add footer to title page
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page 1 of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
    
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
        pdf.text('EYFS Objectives', 20, 45);
        
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
              
              // Add footer to new page
              pdf.setFontSize(10);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`Page ${i + 2} of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
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
          
          // Add footer to new page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page ${i + 2} of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
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
            
            // Add footer to new page
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Page ${i + 2} of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
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
              
              // Add footer to new page
              pdf.setFontSize(10);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`Page ${i + 2} of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
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
                
                // Add footer to new page
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Page ${i + 2} of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
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
      
      // Add page number and footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i + 2} of ${lessons.length + 1}   |   Curriculum Designer – ${currentSheetInfo.display}   |   © 2025`, 105, 285, { align: 'center' });
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
            className="bg-white mx-auto shadow-md max-w-[210mm] print:shadow-none print:max-w-none print-content"
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
                        <span>EYFS Objectives</span>
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
                              className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden print:border print:rounded-lg print:mb-3 print-activity"
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
                <p>Page <span className="pageNumber">1</span> | Curriculum Designer – {currentSheetInfo.display} | © 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}