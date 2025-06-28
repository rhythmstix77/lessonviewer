import React from 'react';
import { FolderOpen, Clock, BookOpen, Calendar, Tag, Eye, EyeOff, Printer } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '../contexts/DataContext';

function UnitCard({ 
  unit, 
  viewMode = 'grid', 
  onClick, 
  theme, 
  onFocusHalfTerm,
  isFocused = false
}) {
  const { getCategoryColor } = useSettings();
  const { allLessonsData } = useData();
  
  // Format date for display
  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get term name from term ID
  const getTermName = (termId) => {
    if (!termId) return 'Not assigned';
    
    const TERM_NAMES = {
      'A1': 'Autumn 1',
      'A2': 'Autumn 2',
      'SP1': 'Spring 1',
      'SP2': 'Spring 2',
      'SM1': 'Summer 1',
      'SM2': 'Summer 2',
    };
    
    return TERM_NAMES[termId] || termId;
  };

  // Get a brief preview of the description
  const getDescriptionPreview = () => {
    if (!unit.description) return '';
    
    // Remove HTML tags for plain text preview
    const plainText = unit.description.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  // Handle focus button click
  const handleFocusClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onFocusHalfTerm && unit.term) {
      onFocusHalfTerm(unit.term);
    }
  };

  // Handle print button click
  const handlePrintClick = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title page
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Unit: ${unit.name}`, 105, 40, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text(`${getTermName(unit.term)}`, 105, 55, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text(`${unit.lessonNumbers.length} Lessons`, 105, 70, { align: 'center' });
      
      // Add unit description
      if (unit.description) {
        pdf.setFontSize(12);
        const plainDescription = unit.description.replace(/<[^>]*>/g, '');
        const splitDescription = pdf.splitTextToSize(plainDescription, 170);
        pdf.text(splitDescription, 20, 90);
      }
      
      // Process each lesson in the unit
      for (let i = 0; i < unit.lessonNumbers.length; i++) {
        const lessonNumber = unit.lessonNumbers[i];
        const lessonData = allLessonsData[lessonNumber];
        
        if (!lessonData) continue;
        
        // Add a new page for each lesson
        pdf.addPage();
        
        // Add lesson header
        pdf.setFontSize(18);
        pdf.text(`Lesson ${lessonNumber}: ${lessonData.title || `Lesson ${lessonNumber}`}`, 105, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.text(`Duration: ${lessonData.totalTime} minutes`, 105, 30, { align: 'center' });
        
        // Add activities
        let yPos = 50;
        
        lessonData.categoryOrder.forEach(category => {
          const activities = lessonData.grouped[category] || [];
          
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
        pdf.text(`Page ${i + 2} of ${unit.lessonNumbers.length + 1}`, 105, 285, { align: 'center' });
      }
      
      // Save the PDF
      pdf.save(`Unit_${unit.name.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error('Failed to export unit:', error);
      alert('Failed to export unit. Please try again.');
    }
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  if (viewMode === 'compact') {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer relative ${
          isFocused ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
        }`}
        style={{ borderLeftColor: unit.color || theme.primary }}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{unit.name}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{unit.lessonNumbers.length} lessons</span>
              <span>•</span>
              <span>{getTermName(unit.term)}</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {/* Print button */}
          <button
            onClick={handlePrintClick}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
            title="Export Unit to PDF"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          
          {/* Focus button */}
          {onFocusHalfTerm && unit.term && (
            <button
              onClick={handleFocusClick}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
              title={isFocused ? "Show all half-terms" : `Focus on ${getTermName(unit.term)}`}
            >
              {isFocused ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div 
        className={`bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer hover:border-indigo-300 relative ${
          isFocused ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mr-4"
            style={{ backgroundColor: unit.color || theme.primary }}
          >
            <FolderOpen className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-base truncate" dir="ltr">{unit.name}</h4>
            </div>
            
            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span>{unit.lessonNumbers.length} lessons</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{getTermName(unit.term)}</span>
              </div>
            </div>
            
            <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
              {getDescriptionPreview()}
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          {/* Print button */}
          <button
            onClick={handlePrintClick}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
            title="Export Unit to PDF"
          >
            <Printer className="h-4 w-4" />
          </button>
          
          {/* Focus button */}
          {onFocusHalfTerm && unit.term && (
            <button
              onClick={handleFocusClick}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
              title={isFocused ? "Show all half-terms" : `Focus on ${getTermName(unit.term)}`}
            >
              {isFocused ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default grid view
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden hover:scale-[1.02] h-full flex flex-col relative ${
        isFocused ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
      }`}
      style={{ borderColor: unit.color || theme.primary, borderWidth: '1px' }}
      onClick={onClick}
    >
      {/* Colorful Header */}
      <div 
        className="p-4 text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${unit.color || theme.primary} 0%, ${theme.secondary} 100%)` 
        }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold truncate" dir="ltr">{unit.name}</h3>
          </div>

          <div className="flex items-center space-x-2 text-white text-opacity-90">
            <span className="text-sm font-medium">{getTermName(unit.term)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center space-x-4 text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">{unit.lessonNumbers.length} lessons</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Created {formatDate(unit.createdAt)}</span>
          </div>
        </div>
        
        {/* Description Preview */}
        <p className="text-sm text-gray-600 line-clamp-3 flex-grow" dir="ltr">
          {getDescriptionPreview()}
        </p>
        
        {/* Lesson Numbers Preview */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {unit.lessonNumbers.slice(0, 5).map(lessonNum => (
              <span 
                key={lessonNum}
                className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
              >
                L{lessonNum}
              </span>
            ))}
            {unit.lessonNumbers.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                +{unit.lessonNumbers.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex space-x-1 z-10">
        {/* Print button */}
        <button
          onClick={handlePrintClick}
          className="p-1.5 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
          title="Export Unit to PDF"
        >
          <Printer className="h-4 w-4" />
        </button>
        
        {/* Focus button */}
        {onFocusHalfTerm && unit.term && (
          <button
            onClick={handleFocusClick}
            className={`p-1.5 rounded-lg transition-colors duration-200 z-10 ${
              isFocused 
                ? 'bg-white text-indigo-600' 
                : 'bg-white bg-opacity-80 text-gray-600 hover:text-indigo-600 hover:bg-opacity-100'
            }`}
            title={isFocused ? "Show all half-terms" : `Focus on ${getTermName(unit.term)}`}
          >
            {isFocused ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export { UnitCard };