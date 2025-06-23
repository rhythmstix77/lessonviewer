import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Save, 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Check,
  Clock,
  Users,
  Tag,
  ArrowUp,
  ArrowDown,
  FileText,
  Download
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term: string; // Added term field
  createdAt: Date;
  updatedAt: Date;
}

interface UnitManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCalendar?: (unit: Unit, startDate: Date) => void;
}

// Define terms
const TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function UnitManager({ isOpen, onClose, onAddToCalendar }: UnitManagerProps) {
  const { lessonNumbers, allLessonsData, currentSheetInfo } = useData();
  const { getThemeForClass } = useSettings();
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    name: '',
    description: '',
    lessonNumbers: [],
    color: getThemeForClass(currentSheetInfo.sheet).primary,
    term: 'A1' // Default to Autumn 1
  });
  const [isCreating, setIsCreating] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedUnitForCalendar, setSelectedUnitForCalendar] = useState<Unit | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load units from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits);
        // Convert date strings back to Date objects
        const unitsWithDates = parsedUnits.map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt),
          term: unit.term || 'A1' // Ensure term exists
        }));
        setUnits(unitsWithDates);
      } catch (error) {
        console.error('Failed to parse saved units:', error);
        setUnits([]);
      }
    }
  }, [isOpen, currentSheetInfo.sheet]);

  // Save units to localStorage
  const saveUnits = (updatedUnits: Unit[]) => {
    localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
    setUnits(updatedUnits);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleCreateUnit = () => {
    if (!newUnit.name || !newUnit.lessonNumbers?.length) {
      alert('Please provide a name and select at least one lesson');
      return;
    }

    const unit: Unit = {
      id: `unit-${Date.now()}`,
      name: newUnit.name || 'Unnamed Unit',
      description: newUnit.description || '',
      lessonNumbers: newUnit.lessonNumbers || [],
      color: newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary,
      term: newUnit.term || 'A1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUnits = [...units, unit];
    saveUnits(updatedUnits);
    
    // Reset form
    setNewUnit({
      name: '',
      description: '',
      lessonNumbers: [],
      color: getThemeForClass(currentSheetInfo.sheet).primary,
      term: 'A1'
    });
    setIsCreating(false);
  };

  const handleUpdateUnit = () => {
    if (!editingUnit) return;
    
    const updatedUnits = units.map(unit => 
      unit.id === editingUnit.id 
        ? { ...editingUnit, updatedAt: new Date() } 
        : unit
    );
    
    saveUnits(updatedUnits);
    setEditingUnit(null);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      const updatedUnits = units.filter(unit => unit.id !== unitId);
      saveUnits(updatedUnits);
      
      if (expandedUnit === unitId) {
        setExpandedUnit(null);
      }
    }
  };

  const toggleLessonSelection = (lessonNum: string) => {
    if (editingUnit) {
      // When editing an existing unit
      setEditingUnit(prev => {
        if (!prev) return prev;
        
        const updatedLessons = prev.lessonNumbers.includes(lessonNum)
          ? prev.lessonNumbers.filter(num => num !== lessonNum)
          : [...prev.lessonNumbers, lessonNum];
          
        return { ...prev, lessonNumbers: updatedLessons };
      });
    } else {
      // When creating a new unit
      setNewUnit(prev => {
        const currentLessons = prev.lessonNumbers || [];
        const updatedLessons = currentLessons.includes(lessonNum)
          ? currentLessons.filter(num => num !== lessonNum)
          : [...currentLessons, lessonNum];
          
        return { ...prev, lessonNumbers: updatedLessons };
      });
    }
  };

  const toggleExpandUnit = (unitId: string) => {
    setExpandedUnit(prev => prev === unitId ? null : unitId);
  };

  const handleAddToCalendar = () => {
    if (!selectedUnitForCalendar || !onAddToCalendar) return;
    
    const startDate = new Date(calendarDate);
    onAddToCalendar(selectedUnitForCalendar, startDate);
    setSelectedUnitForCalendar(null);
  };

  // Calculate total duration and activities for a unit
  const getUnitStats = (lessonNums: string[]) => {
    let totalDuration = 0;
    let totalActivities = 0;
    
    lessonNums.forEach(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (lessonData) {
        totalDuration += lessonData.totalTime || 0;
        
        // Count activities
        Object.values(lessonData.grouped).forEach(activities => {
          totalActivities += activities.length;
        });
      }
    });
    
    return { totalDuration, totalActivities };
  };

  // Move a lesson up or down in the unit order
  const moveLessonInUnit = (unitId: string, lessonNum: string, direction: 'up' | 'down') => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;
    
    const lessonIndex = unit.lessonNumbers.indexOf(lessonNum);
    if (lessonIndex === -1) return;
    
    // Can't move up if already at the top
    if (direction === 'up' && lessonIndex === 0) return;
    
    // Can't move down if already at the bottom
    if (direction === 'down' && lessonIndex === unit.lessonNumbers.length - 1) return;
    
    const newLessonNumbers = [...unit.lessonNumbers];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    
    // Swap positions
    [newLessonNumbers[lessonIndex], newLessonNumbers[targetIndex]] = 
    [newLessonNumbers[targetIndex], newLessonNumbers[lessonIndex]];
    
    // Update the unit
    const updatedUnits = units.map(u => 
      u.id === unitId 
        ? { ...u, lessonNumbers: newLessonNumbers, updatedAt: new Date() } 
        : u
    );
    
    saveUnits(updatedUnits);
  };

  // Export unit to PDF
  const exportUnitToPdf = (unit: Unit) => {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Unit: ${unit.name}`, 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Add term
    const term = TERMS.find(t => t.id === unit.term)?.name || unit.term;
    doc.setFontSize(14);
    doc.text(`Term: ${term}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Add description if available
    if (unit.description) {
      doc.setFontSize(12);
      doc.text('Description:', 14, yPos);
      yPos += 7;
      
      const descLines = doc.splitTextToSize(unit.description, 180);
      doc.text(descLines, 14, yPos);
      yPos += descLines.length * 7 + 10;
    }
    
    // Add lessons
    doc.setFontSize(16);
    doc.text('Lessons:', 14, yPos);
    yPos += 10;
    
    unit.lessonNumbers.forEach((lessonNum, index) => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Lesson header
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 150);
      doc.text(`Lesson ${lessonNum}`, 14, yPos);
      yPos += 7;
      doc.setTextColor(0, 0, 0);
      
      // Lesson details
      doc.setFontSize(12);
      doc.text(`Duration: ${lessonData.totalTime} minutes`, 20, yPos);
      yPos += 7;
      
      // Categories
      doc.text(`Categories: ${lessonData.categoryOrder.join(', ')}`, 20, yPos);
      yPos += 7;
      
      // Activities count
      let totalActivities = 0;
      Object.values(lessonData.grouped).forEach(activities => {
        totalActivities += activities.length;
      });
      doc.text(`Activities: ${totalActivities}`, 20, yPos);
      yPos += 15;
    });
    
    // Save the PDF
    doc.save(`${currentSheetInfo.sheet}_unit_${unit.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Export unit to Excel
  const exportUnitToExcel = (unit: Unit) => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create unit overview sheet
    const unitOverviewData = [
      ['Unit Name', unit.name],
      ['Term', TERMS.find(t => t.id === unit.term)?.name || unit.term],
      ['Description', unit.description],
      ['Lessons', unit.lessonNumbers.length.toString()],
      ['Color', unit.color]
    ];
    
    const unitWs = XLSX.utils.aoa_to_sheet(unitOverviewData);
    XLSX.utils.book_append_sheet(wb, unitWs, 'Unit Overview');
    
    // Create a sheet for each lesson
    unit.lessonNumbers.forEach(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return;
      
      // Create data for this lesson
      const data = [];
      
      // Add header row
      data.push(['Category', 'Activity', 'Time (mins)', 'Description', 'Level']);
      
      // Add activities
      lessonData.categoryOrder.forEach(category => {
        const activities = lessonData.grouped[category] || [];
        
        activities.forEach(activity => {
          data.push([
            category,
            activity.activity,
            activity.time.toString(),
            activity.description.replace(/<[^>]*>/g, ''),
            activity.level || ''
          ]);
        });
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Category
        { wch: 25 }, // Activity
        { wch: 10 }, // Time
        { wch: 50 }, // Description
        { wch: 15 }  // Level
      ];
      
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `Lesson ${lessonNum}`);
    });
    
    // Generate Excel file
    XLSX.writeFile(wb, `${currentSheetInfo.sheet}_unit_${unit.name.replace(/\s+/g, '_')}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Unit Manager</h2>
              <p className="text-indigo-100 text-sm">
                {currentSheetInfo.display} • Group lessons into units for easier planning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-100 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Unit Button */}
          {!isCreating && !editingUnit && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Unit</span>
            </button>
          )}

          {/* Save Status Message */}
          {saveStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-700">Unit saved successfully!</span>
            </div>
          )}

          {/* Create Unit Form */}
          {isCreating && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Unit</h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    value={newUnit.name || ''}
                    onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter unit name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term
                  </label>
                  <select
                    value={newUnit.term || 'A1'}
                    onChange={(e) => setNewUnit(prev => ({ ...prev, term: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {TERMS.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.name} ({term.months})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newUnit.description || ''}
                    onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24 resize-none"
                    placeholder="Enter unit description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary}
                      onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newUnit.color || getThemeForClass(currentSheetInfo.sheet).primary}
                      onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="#6366F1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Lessons
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2">
                      {lessonNumbers.map((lessonNum) => {
                        const isSelected = (newUnit.lessonNumbers || []).includes(lessonNum);
                        return (
                          <div
                            key={lessonNum}
                            onClick={() => toggleLessonSelection(lessonNum)}
                            className={`p-2 border rounded-lg cursor-pointer transition-colors duration-200 text-center ${
                              isSelected 
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-indigo-600' : 'bg-gray-200'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                            <span className="text-sm font-medium">Lesson {lessonNum}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Selected Lessons Summary */}
                  {(newUnit.lessonNumbers || []).length > 0 && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-900">
                          {(newUnit.lessonNumbers || []).length} lessons selected
                        </span>
                        <button
                          onClick={() => setNewUnit(prev => ({ ...prev, lessonNumbers: [] }))}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 px-2 py-1 hover:bg-indigo-100 rounded transition-colors duration-200"
                        >
                          <X className="h-3 w-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(newUnit.lessonNumbers || [])
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map((lessonNum) => (
                            <span
                              key={lessonNum}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-200 text-indigo-800 text-xs font-medium rounded-full"
                            >
                              <span>L{lessonNum}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLessonSelection(lessonNum);
                                }}
                                className="hover:text-indigo-900 p-0.5 hover:bg-indigo-300 rounded-full transition-colors duration-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUnit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Create Unit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Unit Form */}
          {editingUnit && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Unit</h3>
                <button
                  onClick={() => setEditingUnit(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    value={editingUnit.name}
                    onChange={(e) => setEditingUnit(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter unit name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term
                  </label>
                  <select
                    value={editingUnit.term || 'A1'}
                    onChange={(e) => setEditingUnit(prev => prev ? { ...prev, term: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TERMS.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.name} ({term.months})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingUnit.description}
                    onChange={(e) => setEditingUnit(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                    placeholder="Enter unit description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={editingUnit.color}
                      onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingUnit.color}
                      onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="#6366F1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manage Lessons
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {editingUnit.lessonNumbers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No lessons in this unit yet</p>
                      ) : (
                        editingUnit.lessonNumbers.map((lessonNum, index) => {
                          const lessonData = allLessonsData[lessonNum];
                          return (
                            <div 
                              key={lessonNum}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Lesson {lessonNum}</p>
                                  {lessonData && (
                                    <p className="text-xs text-gray-500">
                                      {lessonData.totalTime} mins • {Object.values(lessonData.grouped).reduce((sum, activities) => sum + activities.length, 0)} activities
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => moveLessonInUnit(editingUnit.id, lessonNum, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => moveLessonInUnit(editingUnit.id, lessonNum, 'down')}
                                  disabled={index === editingUnit.lessonNumbers.length - 1}
                                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => toggleLessonSelection(lessonNum)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Remove from Unit"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add More Lessons
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2">
                      {lessonNumbers
                        .filter(num => !editingUnit.lessonNumbers.includes(num))
                        .map((lessonNum) => (
                          <div
                            key={lessonNum}
                            onClick={() => toggleLessonSelection(lessonNum)}
                            className="p-2 border rounded-lg cursor-pointer transition-colors duration-200 text-center bg-gray-50 border-gray-200 hover:bg-gray-100"
                          >
                            <span className="text-sm font-medium">Lesson {lessonNum}</span>
                          </div>
                        ))}
                    </div>
                    
                    {lessonNumbers.filter(num => !editingUnit.lessonNumbers.includes(num)).length === 0 && (
                      <p className="text-gray-500 text-center py-2">All available lessons are already in this unit</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditingUnit(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUnit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Update Unit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Units List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Units</h3>
            
            {units.length === 0 && !isCreating && !editingUnit ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No units created yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first unit by grouping lessons together
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Unit</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {units.map((unit) => {
                  const isExpanded = expandedUnit === unit.id;
                  const { totalDuration, totalActivities } = getUnitStats(unit.lessonNumbers);
                  const term = TERMS.find(t => t.id === unit.term)?.name || unit.term;
                  
                  return (
                    <div 
                      key={unit.id} 
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                    >
                      {/* Unit Header */}
                      <div 
                        className="p-4 border-b border-gray-200 cursor-pointer"
                        onClick={() => toggleExpandUnit(unit.id)}
                        style={{ 
                          background: `linear-gradient(to right, ${unit.color}15, ${unit.color}05)`,
                          borderLeft: `4px solid ${unit.color}`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: unit.color }}
                            >
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                              <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <span>{term}</span>
                                <span>•</span>
                                <span>{unit.lessonNumbers.length} lessons</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnitForCalendar(unit);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="Add to Calendar"
                            >
                              <Calendar className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUnit(unit);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit Unit"
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(unit.id);
                              }}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete Unit"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Unit Details (when expanded) */}
                      {isExpanded && (
                        <div className="p-4">
                          {/* Description */}
                          {unit.description && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                              <p className="text-sm text-gray-600">{unit.description}</p>
                            </div>
                          )}
                          
                          {/* Export Options */}
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <h5 className="text-sm font-medium text-blue-800 mb-3">Export Unit</h5>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => exportUnitToPdf(unit)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2"
                              >
                                <FileText className="h-4 w-4" />
                                <span>Export to PDF</span>
                              </button>
                              <button
                                onClick={() => exportUnitToExcel(unit)}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Export to Excel</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Lessons in this unit */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Lessons in this Unit</h5>
                            <div className="space-y-3">
                              {unit.lessonNumbers.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No lessons in this unit yet</p>
                              ) : (
                                unit.lessonNumbers.map((lessonNum, index) => {
                                  const lessonData = allLessonsData[lessonNum];
                                  if (!lessonData) return null;
                                  
                                  return (
                                    <div 
                                      key={lessonNum}
                                      className="bg-gray-50 rounded-lg border border-gray-200 p-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-medium">
                                            {index + 1}
                                          </div>
                                          <div>
                                            <h6 className="font-medium text-gray-900">Lesson {lessonNum}</h6>
                                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                                              <span className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {lessonData.totalTime} mins
                                              </span>
                                              <span className="flex items-center">
                                                <Users className="h-3 w-3 mr-1" />
                                                {Object.values(lessonData.grouped).reduce((sum, activities) => sum + activities.length, 0)} activities
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => moveLessonInUnit(unit.id, lessonNum, 'up')}
                                            disabled={index === 0}
                                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-30"
                                            title="Move Up"
                                          >
                                            <ArrowUp className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => moveLessonInUnit(unit.id, lessonNum, 'down')}
                                            disabled={index === unit.lessonNumbers.length - 1}
                                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-30"
                                            title="Move Down"
                                          >
                                            <ArrowDown className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {lessonData.categoryOrder.slice(0, 3).map((category) => (
                                          <span
                                            key={category}
                                            className="px-2 py-0.5 bg-white text-xs font-medium rounded-full border border-gray-200"
                                          >
                                            {category}
                                          </span>
                                        ))}
                                        {lessonData.categoryOrder.length > 3 && (
                                          <span className="px-2 py-0.5 bg-white text-xs font-medium rounded-full border border-gray-200">
                                            +{lessonData.categoryOrder.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                          
                          {/* Unit Stats */}
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <div className="text-sm text-gray-500 mb-1">Lessons</div>
                                <div className="text-lg font-semibold text-gray-900">{unit.lessonNumbers.length}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-500 mb-1">Total Duration</div>
                                <div className="text-lg font-semibold text-gray-900">{totalDuration} mins</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-500 mb-1">Activities</div>
                                <div className="text-lg font-semibold text-gray-900">{totalActivities}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add to Calendar Modal */}
        {selectedUnitForCalendar && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Unit to Calendar</h3>
                <button
                  onClick={() => setSelectedUnitForCalendar(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: selectedUnitForCalendar.color }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedUnitForCalendar.name}</h4>
                        <p className="text-sm text-gray-600">{selectedUnitForCalendar.lessonNumbers.length} lessons</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lessons will be scheduled starting from this date
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedUnitForCalendar(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToCalendar}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Add to Calendar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}