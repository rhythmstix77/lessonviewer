import React, { useState, useEffect } from 'react';
import { X, ChevronRight, HelpCircle, Info, BookOpen, Calendar, Edit3, FolderOpen, Tag } from 'lucide-react';

interface WalkthroughStep {
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
}

interface WalkthroughGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalkthroughGuide({ isOpen, onClose }: WalkthroughGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipArrowPosition, setTooltipArrowPosition] = useState('top');

  // Define the walkthrough steps
  const steps: WalkthroughStep[] = [
    {
      title: 'Welcome to EYFS Lesson Builder',
      description: 'This guide will help you navigate through the main features of the application. Click Next to continue.',
      target: 'body',
      position: 'top',
      icon: <Info className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Unit Viewer',
      description: 'Browse through all your lessons organized by term. Click on a lesson to view its details.',
      target: '[data-tab="unit-viewer"]',
      position: 'bottom',
      icon: <BookOpen className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Unit Builder',
      description: 'Create and manage units by grouping lessons together. Drag and drop lessons to build your units.',
      target: '[data-tab="unit-builder"]',
      position: 'bottom',
      icon: <FolderOpen className="h-6 w-6 text-indigo-500" />
    },
    {
      title: 'Lesson Builder',
      description: 'Create individual lesson plans by adding activities. Customize your lessons with detailed notes.',
      target: '[data-tab="lesson-builder"]',
      position: 'bottom',
      icon: <Edit3 className="h-6 w-6 text-green-500" />
    },
    {
      title: 'Activity Library',
      description: 'Browse and search through all available activities. Filter by category or level to find what you need.',
      target: '[data-tab="activity-library"]',
      position: 'bottom',
      icon: <Tag className="h-6 w-6 text-pink-500" />
    },
    {
      title: 'Calendar',
      description: 'Plan your lessons across the academic year. Add units or individual lessons to specific dates.',
      target: '[data-tab="calendar"]',
      position: 'bottom',
      icon: <Calendar className="h-6 w-6 text-purple-500" />
    },
    {
      title: 'Help Button',
      description: 'Click this button anytime to restart this walkthrough guide.',
      target: '[data-help-button]',
      position: 'left',
      icon: <HelpCircle className="h-6 w-6 text-blue-500" />
    }
  ];

  // Find and position the tooltip relative to the target element
  useEffect(() => {
    if (!isOpen) return;

    const findTargetElement = () => {
      const selector = steps[currentStep].target;
      if (selector === 'body') {
        // Center in the viewport for the welcome step
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        setTooltipPosition({
          left: viewportWidth / 2 - 150,
          top: viewportHeight / 2 - 100
        });
        setTooltipArrowPosition('none');
        setTargetElement(document.body);
        return;
      }
      
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        console.warn(`Target element not found: ${selector}`);
        return;
      }

      setTargetElement(element);
      
      // Calculate position
      const rect = element.getBoundingClientRect();
      const position = steps[currentStep].position;
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = rect.top - 180;
          left = rect.left + rect.width / 2 - 150;
          setTooltipArrowPosition('bottom');
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - 150;
          setTooltipArrowPosition('top');
          break;
        case 'left':
          top = rect.top + rect.height / 2 - 90;
          left = rect.left - 310;
          setTooltipArrowPosition('right');
          break;
        case 'right':
          top = rect.top + rect.height / 2 - 90;
          left = rect.right + 10;
          setTooltipArrowPosition('left');
          break;
      }
      
      // Ensure tooltip stays within viewport
      if (top < 10) top = 10;
      if (left < 10) left = 10;
      if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
      
      setTooltipPosition({ top, left });
    };

    // Find target element on step change
    findTargetElement();
    
    // Highlight the target element
    if (targetElement && targetElement !== document.body) {
      targetElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-70', 'z-50');
    }
    
    // Add resize listener
    window.addEventListener('resize', findTargetElement);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', findTargetElement);
      if (targetElement && targetElement !== document.body) {
        targetElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-70', 'z-50');
      }
    };
  }, [isOpen, currentStep, steps, targetElement]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Remove highlight from current target
      if (targetElement && targetElement !== document.body) {
        targetElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-70', 'z-50');
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Remove highlight from current target
      if (targetElement && targetElement !== document.body) {
        targetElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-70', 'z-50');
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Remove highlight from current target
    if (targetElement && targetElement !== document.body) {
      targetElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-70', 'z-50');
    }
    onClose();
  };

  // Render the tooltip
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto" onClick={handleClose} />
      
      {/* Tooltip */}
      <div 
        className="absolute bg-white rounded-xl shadow-xl w-80 p-4 pointer-events-auto transition-all duration-300 animate-bounce-in"
        style={{ 
          top: tooltipPosition.top, 
          left: tooltipPosition.left,
        }}
      >
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Tooltip content */}
        <div className="mb-4 flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {steps[currentStep].icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{steps[currentStep].title}</h3>
            <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              <span>{currentStep < steps.length - 1 ? 'Next' : 'Finish'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Tooltip arrow */}
        {tooltipArrowPosition !== 'none' && (
          <div 
            className={`absolute w-4 h-4 bg-white transform rotate-45 ${
              tooltipArrowPosition === 'top' ? 'top-[-8px]' : 
              tooltipArrowPosition === 'bottom' ? 'bottom-[-8px]' : 
              tooltipArrowPosition === 'left' ? 'left-[-8px]' : 
              'right-[-8px]'
            }`}
            style={{
              left: tooltipArrowPosition === 'top' || tooltipArrowPosition === 'bottom' ? 'calc(50% - 8px)' : undefined,
              top: tooltipArrowPosition === 'left' || tooltipArrowPosition === 'right' ? 'calc(50% - 8px)' : undefined
            }}
          />
        )}
      </div>
    </div>
  );
}