import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Save, 
  RotateCcw,
  Check
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import type { CategorySettings } from '../contexts/SettingsContext';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { categories, updateCategories, resetCategoriesToDefaults } = useSettings();
  const [tempCategories, setTempCategories] = useState<CategorySettings[]>(categories);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update temp categories when categories change
  useEffect(() => {
    setTempCategories(categories);
  }, [categories]);

  const handleSave = () => {
    try {
      updateCategories(tempCategories);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      onClose();
    } catch (error) {
      console.error('Failed to save categories:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    setTempCategories(categories);
    onClose();
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    // Check if category already exists
    if (tempCategories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    
    // Add new category
    setTempCategories([
      ...tempCategories,
      {
        name: newCategoryName,
        color: newCategoryColor,
        position: tempCategories.length
      }
    ]);
    
    // Reset form
    setNewCategoryName('');
    setNewCategoryColor('#6B7280');
  };

  const handleUpdateCategory = (index: number, name: string, color: string) => {
    const updatedCategories = [...tempCategories];
    updatedCategories[index] = { ...updatedCategories[index], name, color };
    setTempCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (index: number) => {
    if (confirm('Are you sure you want to delete this category? This may affect existing activities.')) {
      const updatedCategories = tempCategories.filter((_, i) => i !== index);
      // Update positions
      updatedCategories.forEach((cat, i) => {
        cat.position = i;
      });
      setTempCategories(updatedCategories);
    }
  };

  const handleDragStart = (category: string) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;
    
    const draggedIndex = tempCategories.findIndex(cat => cat.name === draggedCategory);
    const targetIndex = tempCategories.findIndex(cat => cat.name === targetCategory);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder categories
    const newCategories = [...tempCategories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);
    
    // Update positions
    newCategories.forEach((cat, i) => {
      cat.position = i;
    });
    
    setTempCategories(newCategories);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleResetCategories = () => {
    if (confirm('Are you sure you want to reset categories to defaults? This cannot be undone.')) {
      resetCategoriesToDefaults();
      setTempCategories(categories);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <Palette className="h-6 w-6" />
            <h2 className="text-xl font-bold">Activity Categories</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-indigo-100 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Category */}
          <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Add New Category</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="w-24">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Category List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Manage Categories</h3>
              <button
                onClick={handleResetCategories}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop to reorder categories. Changes will affect how categories are displayed throughout the application.
            </p>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tempCategories.map((category, index) => (
                <div 
                  key={category.name}
                  draggable
                  onDragStart={() => handleDragStart(category.name)}
                  onDragOver={(e) => handleDragOver(e, category.name)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 bg-white border rounded-lg transition-all duration-200 ${
                    draggedCategory === category.name 
                      ? 'opacity-50 border-indigo-400 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {editingCategory === category.name ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 cursor-move">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => {
                            const updatedCategories = [...tempCategories];
                            updatedCategories[index].name = e.target.value;
                            setTempCategories(updatedCategories);
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        <input
                          type="color"
                          value={category.color}
                          onChange={(e) => {
                            const updatedCategories = [...tempCategories];
                            updatedCategories[index].color = e.target.value;
                            setTempCategories(updatedCategories);
                          }}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 cursor-move">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div className="flex-1 font-medium text-gray-900">{category.name}</div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingCategory(category.name)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              saveStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveStatus === 'success' ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Categories saved successfully!</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-600" />
                  <span>Failed to save categories. Please try again.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}