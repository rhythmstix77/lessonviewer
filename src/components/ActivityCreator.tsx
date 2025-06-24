import React, { useState, useRef, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Save, 
  X, 
  Edit3, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Type,
  Palette,
  Link,
  Image,
  Upload,
  Clock,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  Volume2
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ActivityCreatorProps {
  onClose: () => void;
  onSave: (activity: any) => void;
  categories: string[];
  levels: string[];
}

export function ActivityCreator({ onClose, onSave, categories, levels }: ActivityCreatorProps) {
  const { categories: allCategories } = useSettings();
  const [activity, setActivity] = useState({
    activity: '',
    description: '',
    activityText: '', // New field for activity text
    time: 0,
    videoLink: '',
    musicLink: '',
    backingLink: '',
    resourceLink: '',
    link: '',
    vocalsLink: '',
    imageLink: '',
    category: '',
    level: '',
    unitName: '',
    lessonNumber: '',
    teachingUnit: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const descriptionRef = useRef<HTMLDivElement>(null);
  const activityTextRef = useRef<HTMLDivElement>(null); // New ref for activity text
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [descriptionActiveButtons, setDescriptionActiveButtons] = useState<string[]>([]);
  const [activityTextActiveButtons, setActivityTextActiveButtons] = useState<string[]>([]);

  // Simplified level options - just the core options without duplicates
  const simplifiedLevels = ['All', 'EYFS L', 'UKG', 'Reception'];

  // Set up event listeners for selection changes to update active buttons for description
  useEffect(() => {
    if (descriptionRef.current) {
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
  }, []);

  // Set up event listeners for selection changes to update active buttons for activity text
  useEffect(() => {
    if (activityTextRef.current) {
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setActivity(prev => ({ ...prev, time: isNaN(value) ? 0 : value }));
  };

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
      setActivity(prev => ({ ...prev, description: updatedContent }));
      
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
      setActivity(prev => ({ ...prev, activityText: updatedContent }));
      
      // Restore focus to the editor
      activityTextRef.current.focus();
      
      // Restore selection if possible
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setActivity(prev => ({
        ...prev,
        imageLink: imageUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!activity.activity.trim()) {
      newErrors.activity = 'Activity name is required';
    }
    
    if (!activity.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Set teachingUnit to match category if not specified
      const newActivity = {
        ...activity,
        teachingUnit: activity.teachingUnit || activity.category
      };
      
      onSave(newActivity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <Tag className="h-6 w-6" />
            <h2 className="text-xl font-bold">Create New Activity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="activity"
                  value={activity.activity}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.activity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="Enter activity name"
                />
                {errors.activity && (
                  <p className="mt-1 text-sm text-red-500">{errors.activity}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={activity.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  <option value="">Select a category</option>
                  {allCategories.map(category => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              {/* Level - Simplified */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={activity.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a level</option>
                  <option value="All">All</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="Reception">Reception</option>
                  {simplifiedLevels.filter(level => !['All', 'LKG', 'UKG', 'Reception', 'EYFS U'].includes(level)).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="time"
                  value={activity.time}
                  onChange={handleTimeChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter duration in minutes"
                />
              </div>

              {/* Unit Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name
                </label>
                <input
                  type="text"
                  name="unitName"
                  value={activity.unitName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter unit name (optional)"
                />
              </div>
            </div>

            {/* Activity Text - NEW FIELD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity
              </label>
              
              {/* Rich Text Toolbar for Activity Text */}
              <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => execActivityTextCommand('bold')}
                  className={`p-1 rounded ${activityTextActiveButtons.includes('bold') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execActivityTextCommand('italic')}
                  className={`p-1 rounded ${activityTextActiveButtons.includes('italic') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execActivityTextCommand('underline')}
                  className={`p-1 rounded ${activityTextActiveButtons.includes('underline') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => execActivityTextCommand('insertUnorderedList')}
                  className={`p-1 rounded ${activityTextActiveButtons.includes('insertUnorderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
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
                className="min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                onInput={(e) => {
                  const target = e.target as HTMLDivElement;
                  setActivity(prev => ({ ...prev, activityText: target.innerHTML }));
                }}
                onKeyDown={(e) => {
                  // Prevent default behavior for Tab key to avoid losing focus
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                  }
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              
              {/* Rich Text Toolbar */}
              <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => execDescriptionCommand('bold')}
                  className={`p-1 rounded ${descriptionActiveButtons.includes('bold') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execDescriptionCommand('italic')}
                  className={`p-1 rounded ${descriptionActiveButtons.includes('italic') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execDescriptionCommand('underline')}
                  className={`p-1 rounded ${descriptionActiveButtons.includes('underline') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => execDescriptionCommand('insertUnorderedList')}
                  className={`p-1 rounded ${descriptionActiveButtons.includes('insertUnorderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
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
                className="min-h-[150px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                onInput={(e) => {
                  const target = e.target as HTMLDivElement;
                  setActivity(prev => ({ ...prev, description: target.innerHTML }));
                }}
                onKeyDown={(e) => {
                  // Prevent default behavior for Tab key to avoid losing focus
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                  }
                }}
              />
            </div>

            {/* Activity Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Image
              </label>
              <div className="flex items-center space-x-4">
                {activity.imageLink ? (
                  <div className="relative">
                    <img 
                      src={activity.imageLink} 
                      alt="Activity" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setActivity(prev => ({ ...prev, imageLink: '' }))}
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
                      type="button"
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
                      name="imageLink"
                      value={activity.imageLink}
                      onChange={handleChange}
                      placeholder="Or paste image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
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
                      name={key}
                      value={activity[key as keyof typeof activity] as string}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Create Activity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}