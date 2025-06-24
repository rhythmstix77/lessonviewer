import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Video, Music, FileText, Link as LinkIcon, Image, Volume2, Maximize2, Minimize2, ExternalLink, Tag, Plus, Save, Bold, Italic, Underline, List, ListOrdered, Upload, Edit3, Check } from 'lucide-react';
import { EditableText } from './EditableText';
import type { Activity } from '../contexts/DataContext';
import { useData } from '../contexts/DataContext';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
  onAddToLesson?: () => void;
  isEditing?: boolean;
  onUpdate?: (updatedActivity: Activity) => void;
}

export function ActivityDetails({ 
  activity, 
  onClose, 
  onAddToLesson,
  isEditing = false,
  onUpdate
}: ActivityDetailsProps) {
  const { allEyfsStatements, eyfsStatements, addEyfsToLesson, removeEyfsFromLesson } = useData();
  const [selectedLink, setSelectedLink] = useState<{ url: string; title: string; type: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  const [selectedEyfs, setSelectedEyfs] = useState<string[]>(activity.eyfsStandards || []);
  const [editedActivity, setEditedActivity] = useState<Activity>({...activity});
  const [isEditMode, setIsEditMode] = useState(isEditing);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const activityTextRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [descriptionActiveButtons, setDescriptionActiveButtons] = useState<string[]>([]);
  const [activityTextActiveButtons, setActivityTextActiveButtons] = useState<string[]>([]);

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize edited activity when the component mounts or activity changes
  useEffect(() => {
    setEditedActivity({...activity});
    setSelectedEyfs(activity.eyfsStandards || []);
    setIsEditMode(isEditing);
  }, [activity, isEditing]);

  // Set up event listeners for selection changes to update active buttons for description
  useEffect(() => {
    if (isEditMode && descriptionRef.current) {
      const handleSelectionChange = () => {
        if (!document.activeElement || !descriptionRef.current?.contains(document.activeElement)) return;
        
        const activeCommands: string[] = [];
        
        if (document.queryCommandState('bold')) activeCommands.push('bold');
        if (document.queryCommandState('italic')) activeCommands.push('italic');
        if (document.queryCommandState('underline')) activeCommands.push('underline');
        if (document.queryCommandState('insertUnorderedList')) activeCommands.push('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) activeCommands.push('insertOrderedList');
        
        setDescriptionActiveButtons(activeCommands);
      };
      
      document.addEventListener('selectionchange', handleSelectionChange);
      
      // Clean up
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [isEditMode]);

  // Set up event listeners for selection changes to update active buttons for activity text
  useEffect(() => {
    if (isEditMode && activityTextRef.current) {
      const handleSelectionChange = () => {
        if (!document.activeElement || !activityTextRef.current?.contains(document.activeElement)) return;
        
        const activeCommands: string[] = [];
        
        if (document.queryCommandState('bold')) activeCommands.push('bold');
        if (document.queryCommandState('italic')) activeCommands.push('italic');
        if (document.queryCommandState('underline')) activeCommands.push('underline');
        if (document.queryCommandState('insertUnorderedList')) activeCommands.push('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) activeCommands.push('insertOrderedList');
        
        setActivityTextActiveButtons(activeCommands);
      };
      
      document.addEventListener('selectionchange', handleSelectionChange);
      
      // Clean up
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [isEditMode]);

  const execDescriptionCommand = (command: string, value?: string) => {
    if (descriptionRef.current) {
      // Focus the editor to ensure commands work properly
      descriptionRef.current.focus();
      
      // Save the current selection
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      // Execute the command
      document.execCommand(command, false, value);
      
      // Update active buttons state
      if (descriptionActiveButtons.includes(command)) {
        setDescriptionActiveButtons(prev => prev.filter(cmd => cmd !== command));
      } else {
        setDescriptionActiveButtons(prev => [...prev, command]);
      }
      
      // Get the updated content
      const updatedContent = descriptionRef.current.innerHTML;
      setEditedActivity(prev => ({ ...prev, description: updatedContent }));
      
      // Restore focus to the editor
      descriptionRef.current.focus();
      
      // Restore selection if possible
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const execActivityTextCommand = (command: string, value?: string) => {
    if (activityTextRef.current) {
      // Focus the editor to ensure commands work properly
      activityTextRef.current.focus();
      
      // Save the current selection
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      // Execute the command
      document.execCommand(command, false, value);
      
      // Update active buttons state
      if (activityTextActiveButtons.includes(command)) {
        setActivityTextActiveButtons(prev => prev.filter(cmd => cmd !== command));
      } else {
        setActivityTextActiveButtons(prev => [...prev, command]);
      }
      
      // Get the updated content
      const updatedContent = activityTextRef.current.innerHTML;
      setEditedActivity(prev => ({ ...prev, activityText: updatedContent }));
      
      // Restore focus to the editor
      activityTextRef.current.focus();
      
      // Restore selection if possible
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...editedActivity,
        eyfsStandards: selectedEyfs
      });
    }
    setIsEditMode(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setEditedActivity(prev => ({
        ...prev,
        imageLink: imageUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const renderDescription = () => {
    if (isEditMode) {
      return (
        <div>
          {/* Rich Text Toolbar */}
          <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg">
            <button
              onClick={() => execDescriptionCommand('bold')}
              className={`p-1 rounded ${descriptionActiveButtons.includes('bold') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => execDescriptionCommand('italic')}
              className={`p-1 rounded ${descriptionActiveButtons.includes('italic') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => execDescriptionCommand('underline')}
              className={`p-1 rounded ${descriptionActiveButtons.includes('underline') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={() => execDescriptionCommand('insertUnorderedList')}
              className={`p-1 rounded ${descriptionActiveButtons.includes('insertUnorderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => execDescriptionCommand('insertOrderedList')}
              className={`p-1 rounded ${descriptionActiveButtons.includes('insertOrderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
          
          <div
            ref={descriptionRef}
            contentEditable
            className="min-h-[150px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            dangerouslySetInnerHTML={{ __html: editedActivity.description }}
            onInput={(e) => {
              const target = e.target as HTMLDivElement;
              setEditedActivity(prev => ({ ...prev, description: target.innerHTML }));
            }}
            onKeyDown={(e) => {
              // Prevent default behavior for Tab key to avoid losing focus
              if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
              }
            }}
            dir="ltr" // Explicitly set text direction to left-to-right
          />
        </div>
      );
    }
    
    if (activity.htmlDescription) {
      // Render HTML description with basic formatting
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.htmlDescription }}
          dir="ltr" // Explicitly set text direction to left-to-right
        />
      );
    }
    
    // Render plain text with markdown-style formatting or HTML
    if (activity.description.includes('<')) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.description }}
          dir="ltr" // Explicitly set text direction to left-to-right
        />
      );
    }
    
    // Format plain text with line breaks and basic markdown
    const formattedDescription = activity.description
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
    
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedDescription }}
        dir="ltr" // Explicitly set text direction to left-to-right
      />
    );
  };

  const renderActivityText = () => {
    if (isEditMode) {
      return (
        <div>
          {/* Rich Text Toolbar for Activity Text */}
          <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg">
            <button
              onClick={() => execActivityTextCommand('bold')}
              className={`p-1 rounded ${activityTextActiveButtons.includes('bold') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => execActivityTextCommand('italic')}
              className={`p-1 rounded ${activityTextActiveButtons.includes('italic') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => execActivityTextCommand('underline')}
              className={`p-1 rounded ${activityTextActiveButtons.includes('underline') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={() => execActivityTextCommand('insertUnorderedList')}
              className={`p-1 rounded ${activityTextActiveButtons.includes('insertUnorderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => execActivityTextCommand('insertOrderedList')}
              className={`p-1 rounded ${activityTextActiveButtons.includes('insertOrderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
          
          <div
            ref={activityTextRef}
            contentEditable
            className="min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            dangerouslySetInnerHTML={{ __html: editedActivity.activityText || '' }}
            onInput={(e) => {
              const target = e.target as HTMLDivElement;
              setEditedActivity(prev => ({ ...prev, activityText: target.innerHTML }));
            }}
            onKeyDown={(e) => {
              // Prevent default behavior for Tab key to avoid losing focus
              if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
              }
            }}
            dir="ltr" // Explicitly set text direction to left-to-right
          />
        </div>
      );
    }
    
    // If there's activity text, display it
    if (activity.activityText) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.activityText }}
          dir="ltr" // Explicitly set text direction to left-to-right
        />
      );
    }
    
    return null; // Don't show anything if there's no activity text
  };

  const resources = [
    { label: 'Video', url: isEditMode ? editedActivity.videoLink : activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: isEditMode ? editedActivity.musicLink : activity.musicLink, icon: Music, color: 'text-green-600 bg-green-50 border-green-200', type: 'music' },
    { label: 'Backing', url: isEditMode ? editedActivity.backingLink : activity.backingLink, icon: Volume2, color: 'text-blue-600 bg-blue-50 border-blue-200', type: 'backing' },
    { label: 'Resource', url: isEditMode ? editedActivity.resourceLink : activity.resourceLink, icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200', type: 'resource' },
    { label: 'Link', url: isEditMode ? editedActivity.link : activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Vocals', url: isEditMode ? editedActivity.vocalsLink : activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Image', url: isEditMode ? editedActivity.imageLink : activity.imageLink, icon: Image, color: 'text-pink-600 bg-pink-50 border-pink-200', type: 'image' },
  ].filter(resource => resource.url && resource.url.trim());

  const handleResourceClick = (resource: any) => {
    setSelectedLink({
      url: resource.url,
      title: `${activity.activity} - ${resource.label}`,
      type: resource.type
    });
  };

  const handleEyfsToggle = (eyfsStatement: string) => {
    if (selectedEyfs.includes(eyfsStatement)) {
      setSelectedEyfs(prev => prev.filter(s => s !== eyfsStatement));
      if (activity.lessonNumber) {
        removeEyfsFromLesson(activity.lessonNumber, eyfsStatement);
      }
    } else {
      setSelectedEyfs(prev => [...prev, eyfsStatement]);
      if (activity.lessonNumber) {
        addEyfsToLesson(activity.lessonNumber, eyfsStatement);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
          ref={containerRef}
          className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden modal-content modal-responsive ${
            isFullscreen ? 'fixed inset-0 rounded-none max-w-none max-h-none' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {isEditMode ? (
                <input
                  type="text"
                  value={editedActivity.activity}
                  onChange={(e) => setEditedActivity(prev => ({ ...prev, activity: e.target.value }))}
                  className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  dir="ltr" // Explicitly set text direction to left-to-right
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{activity.activity}</h2>
              )}
              <div className="flex items-center space-x-3 mt-1">
                {isEditMode ? (
                  <select
                    value={editedActivity.category}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, category: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1"
                    dir="ltr" // Explicitly set text direction to left-to-right
                  >
                    <option value="">Select Category</option>
                    <option value="Welcome">Welcome</option>
                    <option value="Kodaly Songs">Kodaly Songs</option>
                    <option value="Kodaly Action Songs">Kodaly Action Songs</option>
                    <option value="Action/Games Songs">Action/Games Songs</option>
                    <option value="Rhythm Sticks">Rhythm Sticks</option>
                    <option value="Scarf Songs">Scarf Songs</option>
                    <option value="General Game">General Game</option>
                    <option value="Core Songs">Core Songs</option>
                    <option value="Parachute Games">Parachute Games</option>
                    <option value="Percussion Games">Percussion Games</option>
                    <option value="Teaching Units">Teaching Units</option>
                    <option value="Goodbye">Goodbye</option>
                    <option value="Kodaly Rhythms">Kodaly Rhythms</option>
                    <option value="Kodaly Games">Kodaly Games</option>
                    <option value="IWB Games">IWB Games</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-600">{activity.category}</p>
                )}
                {activity.level && !isEditMode && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {activity.level}
                  </span>
                )}
                {isEditMode && (
                  <select
                    value={editedActivity.level}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, level: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1"
                    dir="ltr" // Explicitly set text direction to left-to-right
                  >
                    <option value="">Select Level</option>
                    <option value="All">All</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Reception">Reception</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Activity"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowEyfsSelector(!showEyfsSelector)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="EYFS Standards"
              >
                <Tag className="h-5 w-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* EYFS Standards Selector (conditionally shown) */}
            {showEyfsSelector && activity.lessonNumber && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-semibold text-blue-900 flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>EYFS Standards for this Activity</span>
                  </h3>
                  <button
                    onClick={() => setShowEyfsSelector(false)}
                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto p-2">
                  {allEyfsStatements.map(statement => (
                    <div 
                      key={statement}
                      className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded-lg cursor-pointer"
                      onClick={() => handleEyfsToggle(statement)}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 rounded border ${
                        selectedEyfs.includes(statement)
                          ? 'bg-blue-600 border-blue-600 flex items-center justify-center'
                          : 'border-gray-300'
                      }`}>
                        {selectedEyfs.includes(statement) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700" dir="ltr">{statement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time */}
            {(activity.time > 0 || isEditMode) && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600" />
                {isEditMode ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-900">Duration:</span>
                    <input
                      type="number"
                      value={editedActivity.time}
                      onChange={(e) => setEditedActivity(prev => ({ ...prev, time: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      dir="ltr" // Explicitly set text direction to left-to-right
                    />
                    <span className="text-sm font-medium text-blue-900">minutes</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-blue-900">
                    Duration: {activity.time} minutes
                  </span>
                )}
              </div>
            )}

            {/* Activity Text - NEW FIELD */}
            {(editedActivity.activityText || isEditMode) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-text-heading" 
                    fallback="Activity"
                  />
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  {renderActivityText()}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-description-heading" 
                  fallback="Description"
                />
              </h3>
              <div className="text-gray-700 leading-relaxed">
                {renderDescription()}
              </div>
            </div>

            {/* Unit Name */}
            {(activity.unitName || isEditMode) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-unit-heading" 
                    fallback="Unit"
                  />
                </h3>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedActivity.unitName}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, unitName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter unit name"
                    dir="ltr" // Explicitly set text direction to left-to-right
                  />
                ) : (
                  <p className="text-gray-700" dir="ltr">{activity.unitName}</p>
                )}
              </div>
            )}

            {/* EYFS Standards (if any) */}
            {selectedEyfs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>EYFS Standards</span>
                </h3>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <ul className="space-y-2">
                    {selectedEyfs.map((standard, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700" dir="ltr">{standard}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Image Upload (only in edit mode) */}
            {isEditMode && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Image</h3>
                <div className="flex items-center space-x-4">
                  {editedActivity.imageLink ? (
                    <div className="relative">
                      <img 
                        src={editedActivity.imageLink} 
                        alt="Activity" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => setEditedActivity(prev => ({ ...prev, imageLink: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload an image for this activity or provide an image URL
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <input
                        type="url"
                        value={editedActivity.imageLink}
                        onChange={(e) => setEditedActivity(prev => ({ ...prev, imageLink: e.target.value }))}
                        placeholder="Or paste image URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        dir="ltr" // Explicitly set text direction to left-to-right
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-resources-heading" 
                  fallback="Resources"
                />
              </h3>
              
              {isEditMode ? (
                <div className="space-y-4">
                  {[
                    { key: 'videoLink', label: 'Video URL', icon: Video },
                    { key: 'musicLink', label: 'Music URL', icon: Music },
                    { key: 'backingLink', label: 'Backing Track URL', icon: Volume2 },
                    { key: 'resourceLink', label: 'Resource URL', icon: FileText },
                    { key: 'link', label: 'Additional Link', icon: LinkIcon },
                    { key: 'vocalsLink', label: 'Vocals URL', icon: Volume2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <input
                        type="url"
                        value={editedActivity[key as keyof Activity] as string}
                        onChange={(e) => setEditedActivity(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={label}
                        dir="ltr" // Explicitly set text direction to left-to-right
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {resources.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {resources.map((resource, index) => {
                        const IconComponent = resource.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => handleResourceClick(resource)}
                            className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-sm ${resource.color}`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate" dir="ltr">{resource.label}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        <EditableText 
                          id="activity-no-resources-message" 
                          fallback="No additional resources available"
                        />
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
            {isEditMode ? (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            ) : (
              <>
                {onAddToLesson && (
                  <button
                    onClick={onAddToLesson}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Lesson</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <EditableText 
                    id="activity-close-button" 
                    fallback="Close"
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resource Viewer Modal */}
      {selectedLink && (
        <ResourceViewer
          url={selectedLink.url}
          title={selectedLink.title}
          type={selectedLink.type}
          onClose={() => setSelectedLink(null)}
        />
      )}
    </>
  );
}

// Resource Viewer Component with Fullscreen Support
interface ResourceViewerProps {
  url: string;
  title: string;
  type: string;
  onClose: () => void;
}

function ResourceViewer({ url, title, type, onClose }: ResourceViewerProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Detect content type from URL
  const getContentType = () => {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    }
    if (urlLower.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (urlLower.match(/\.(mp4|webm|ogg)$/)) {
      return 'video';
    }
    if (urlLower.match(/\.(mp3|wav|ogg|m4a)$/)) {
      return 'audio';
    }
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) || urlLower.startsWith('data:image/')) {
      return 'image';
    }
    if (urlLower.match(/\.(pdf)$/)) {
      return 'pdf';
    }
    return 'webpage';
  };

  const contentType = getContentType();

  // Convert YouTube URLs to embed format
  const getEmbedUrl = () => {
    if (contentType === 'youtube') {
      const videoId = extractYouTubeId(url);
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : url;
    }
    if (contentType === 'vimeo') {
      const videoId = extractVimeoId(url);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const getTypeIcon = () => {
    switch (contentType) {
      case 'youtube':
      case 'vimeo':
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Volume2 className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (contentType) {
      case 'youtube':
      case 'vimeo':
      case 'video':
        return 'text-red-600 bg-red-100';
      case 'audio':
        return 'text-green-600 bg-green-100';
      case 'image':
        return 'text-purple-600 bg-purple-100';
      case 'pdf':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <LinkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load content</h3>
            <p className="text-gray-600 mb-4">This content cannot be displayed in the viewer.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in New Tab</span>
            </a>
          </div>
        </div>
      );
    }

    if (contentType === 'image') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
          <img
            src={url}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      );
    }

    if (contentType === 'audio') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Volume2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            </div>
            <audio
              controls
              className="w-full"
              onLoadedData={handleLoad}
              onError={handleError}
            >
              <source src={url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      );
    }

    if (contentType === 'video') {
      return (
        <div className="flex-1 flex items-center justify-center bg-black p-4">
          <video
            controls
            className="max-w-full max-h-full rounded-lg"
            onLoadedData={handleLoad}
            onError={handleError}
          >
            <source src={url} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // Default: iframe for web content
    return (
      <iframe
        src={getEmbedUrl()}
        className="flex-1 w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        title={title}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] modal-overlay">
      <div
        ref={containerRef}
        className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 modal-content modal-responsive ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-[95vw] h-[90vh] max-w-6xl'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-white ${
          isFullscreen ? 'absolute top-0 left-0 right-0 z-10 bg-opacity-95 backdrop-blur-sm' : ''
        }`}>
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${getTypeColor()}`}>
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate" dir="ltr">{title}</h2>
              <p className="text-sm text-gray-600 truncate" dir="ltr">{url}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>

            {/* External Link */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Open in New Tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`flex flex-col ${isFullscreen ? 'h-full pt-16' : 'h-full'}`}>
          {renderContent()}
        </div>

        {/* Fullscreen Controls Overlay */}
        {isFullscreen && (
          <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg transition-all duration-200"
              title="Exit Fullscreen"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg transition-all duration-200"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}