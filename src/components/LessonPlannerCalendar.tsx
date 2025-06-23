import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock,
  Users,
  BookOpen,
  Save,
  X,
  FolderOpen,
  Tag
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { useDrop } from 'react-dnd';
import type { Activity } from '../contexts/DataContext';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: any[]; // Activity IDs or objects
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled';
  unitId?: string;
  unitName?: string;
  lessonNumber?: string;
}

interface LessonPlannerCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  lessonPlans: LessonPlan[];
  onUpdateLessonPlan: (plan: LessonPlan) => void;
  onCreateLessonPlan: (date: Date) => void;
  className: string;
}

export function LessonPlannerCalendar({
  onDateSelect,
  selectedDate,
  lessonPlans,
  onUpdateLessonPlan,
  onCreateLessonPlan,
  className
}: LessonPlannerCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>('all');

  // Get unique units from lesson plans
  const units = React.useMemo(() => {
    const unitMap = new Map<string, { id: string, name: string }>();
    
    lessonPlans.forEach(plan => {
      if (plan.unitId && plan.unitName) {
        unitMap.set(plan.unitId, { id: plan.unitId, name: plan.unitName });
      }
    });
    
    return Array.from(unitMap.values());
  }, [lessonPlans]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDay = getDay(monthStart);
  
  // Calculate days from previous month to show
  const daysFromPrevMonth = startDay;
  const prevMonthDays = Array.from({ length: daysFromPrevMonth }, (_, i) => 
    addDays(monthStart, -daysFromPrevMonth + i)
  );
  
  // Current month days
  const currentMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate days from next month to show (to complete the grid)
  const totalDaysShown = Math.ceil((daysFromPrevMonth + currentMonthDays.length) / 7) * 7;
  const daysFromNextMonth = totalDaysShown - (daysFromPrevMonth + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: daysFromNextMonth }, (_, i) => 
    addDays(addDays(monthEnd, 1), i)
  );
  
  // Combine all days
  const calendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter lesson plans based on unit filter
  const filteredLessonPlans = React.useMemo(() => {
    if (unitFilter === 'all') {
      return lessonPlans;
    } else if (unitFilter === 'none') {
      return lessonPlans.filter(plan => !plan.unitId);
    } else {
      return lessonPlans.filter(plan => plan.unitId === unitFilter);
    }
  }, [lessonPlans, unitFilter]);

  const getLessonPlanForDate = (date: Date) => {
    // Get all plans for this date
    const plansForDate = filteredLessonPlans.filter(plan => 
      isSameDay(new Date(plan.date), date) && plan.className === className
    );
    
    // Return the first plan if there's only one
    if (plansForDate.length === 1) {
      return plansForDate[0];
    }
    
    // If there are multiple plans, return them all
    if (plansForDate.length > 1) {
      return plansForDate;
    }
    
    // No plans for this date
    return null;
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    const existingPlan = getLessonPlanForDate(date);
    if (!existingPlan) {
      onCreateLessonPlan(date);
    }
  };

  const handleEditPlan = (plan: LessonPlan) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      onUpdateLessonPlan(editingPlan);
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this lesson plan?')) {
      // Filter out the plan to delete
      const updatedPlans = lessonPlans.filter(plan => plan.id !== planId);
      
      // Save the updated plans
      localStorage.setItem('lesson-plans', JSON.stringify(updatedPlans));
      
      // Update the state in the parent component
      onUpdateLessonPlan({ ...lessonPlans.find(plan => plan.id === planId)!, id: 'deleted' });
    }
  };

  const renderCalendarDay = (date: Date, isCurrentMonth: boolean = true) => {
    const plansForDate = getLessonPlanForDate(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());
    
    // Handle multiple plans for the same day
    const hasMultiplePlans = Array.isArray(plansForDate) && plansForDate.length > 1;
    const singlePlan = !hasMultiplePlans ? plansForDate as LessonPlan | null : null;
    const multiplePlans = hasMultiplePlans ? plansForDate as LessonPlan[] : [];

    // Set up drop target for activities
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'activity',
      drop: (item: { activity: Activity }) => {
        // If there's already a plan for this date, add the activity to it
        if (singlePlan) {
          const updatedPlan = {
            ...singlePlan,
            activities: [...singlePlan.activities, item.activity],
            duration: singlePlan.duration + (item.activity.time || 0)
          };
          onUpdateLessonPlan(updatedPlan);
        } else {
          // Otherwise create a new plan with this activity
          const weekNumber = Math.ceil(
            (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 
            (7 * 24 * 60 * 60 * 1000)
          );
          
          const newPlan = {
            id: `plan-${Date.now()}`,
            date,
            week: weekNumber,
            className,
            activities: [item.activity],
            duration: item.activity.time || 0,
            notes: '',
            status: 'planned',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          onUpdateLessonPlan(newPlan);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    }), [singlePlan, onUpdateLessonPlan]);

    return (
      <div
        ref={drop}
        key={date.toISOString()}
        onClick={() => handleDateClick(date)}
        className={`
          relative w-full h-24 p-2 border border-gray-200 hover:bg-blue-50 transition-colors duration-200 group
          ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
          ${isToday ? 'ring-2 ring-blue-400' : ''}
          ${singlePlan ? 'bg-green-50' : ''}
          ${!isCurrentMonth ? 'opacity-40' : ''}
          ${isOver ? 'bg-blue-100 border-blue-300' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {format(date, 'd')}
          </span>
          
          {singlePlan && (
            <div className="flex-1 mt-1">
              <div className={`
                text-xs px-2 py-1 rounded-full text-white font-medium
                ${singlePlan.status === 'completed' ? 'bg-green-500' : 
                  singlePlan.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}
              `}>
                Week {singlePlan.week}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {singlePlan.activities.length} activities
              </div>
              {singlePlan.unitName && (
                <div className="flex items-center mt-1">
                  <Tag className="h-3 w-3 text-indigo-500 mr-1" />
                  <span className="text-xs text-indigo-600 truncate">{singlePlan.unitName}</span>
                </div>
              )}
            </div>
          )}
          
          {hasMultiplePlans && (
            <div className="flex-1 mt-1">
              <div className="text-xs px-2 py-1 rounded-full bg-purple-500 text-white font-medium">
                {multiplePlans.length} Plans
              </div>
              {multiplePlans.some(plan => plan.unitName) && (
                <div className="flex items-center mt-1">
                  <FolderOpen className="h-3 w-3 text-indigo-500 mr-1" />
                  <span className="text-xs text-indigo-600 truncate">Unit Plans</span>
                </div>
              )}
            </div>
          )}
          
          {!singlePlan && !hasMultiplePlans && (
            <div className="flex-1 flex items-center justify-center">
              <Plus className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
        {weekDays.map(date => (
          <div key={date.toISOString()} className="min-h-[200px]">
            {renderCalendarDay(date)}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
        {calendarDays.map((date, i) => {
          const isCurrentMonth = i >= daysFromPrevMonth && i < (daysFromPrevMonth + currentMonthDays.length);
          return renderCalendarDay(date, isCurrentMonth);
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Lesson Planner</h2>
              <p className="text-blue-100 text-sm">{className} - {format(currentDate, 'MMMM yyyy')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {viewMode === 'month' ? 'Week View' : 'Month View'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(viewMode === 'month' ? subWeeks(currentDate, 4) : subWeeks(currentDate, 1))}
            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h3 className="text-lg font-semibold">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(weekStart, 'MMM d, yyyy')}`
            }
          </h3>
          
          <button
            onClick={() => setCurrentDate(viewMode === 'month' ? addWeeks(currentDate, 4) : addWeeks(currentDate, 1))}
            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Unit Filter */}
      {units.length > 0 && (
        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">
              Filter by Unit:
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">All Plans</option>
              <option value="none">No Unit</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="p-6">
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Planned</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Cancelled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Multiple Plans</span>
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Lesson Plan</h3>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Number
                </label>
                <input
                  type="number"
                  value={editingPlan.week}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, week: parseInt(e.target.value) } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingPlan.status}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Unit Information (if part of a unit) */}
              {editingPlan.unitName && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-900">Unit: {editingPlan.unitName}</span>
                  </div>
                  {editingPlan.lessonNumber && (
                    <p className="text-sm text-indigo-700">
                      Lesson {editingPlan.lessonNumber} from this unit
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editingPlan.notes}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  placeholder="Add notes about this lesson..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}