import React, { useState } from 'react';
import { HelpCircle, Tag, Edit3, FolderOpen, Calendar } from 'lucide-react';

interface HelpButtonProps {
  onOpenGuide: (section?: 'activity' | 'lesson' | 'unit' | 'assign') => void;
}

export function HelpButton({ onOpenGuide }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenGuide = (section?: 'activity' | 'lesson' | 'unit' | 'assign') => {
    onOpenGuide(section);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-20 right-6 z-40">
      {/* Help Menu */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 w-64 overflow-hidden animate-bounce-in">
          <div className="p-3 bg-blue-600 text-white">
            <h3 className="font-medium">Help Guide</h3>
            <p className="text-xs text-blue-100">Select a topic to learn more</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => handleOpenGuide('activity')}
              className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Tag className="h-4 w-4 text-pink-500" />
              <span>Creating Activities</span>
            </button>
            <button
              onClick={() => handleOpenGuide('lesson')}
              className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4 text-green-500" />
              <span>Building Lessons</span>
            </button>
            <button
              onClick={() => handleOpenGuide('unit')}
              className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <FolderOpen className="h-4 w-4 text-indigo-500" />
              <span>Managing Units</span>
            </button>
            <button
              onClick={() => handleOpenGuide('assign')}
              className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>Assigning to Half-Terms</span>
            </button>
            <button
              onClick={() => handleOpenGuide()}
              className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center space-x-2 mt-2 pt-2 border-t border-gray-200"
            >
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <span>Full Guide</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Main Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-md transition-all duration-200 hover:scale-105 flex items-center justify-center"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </div>
  );
}