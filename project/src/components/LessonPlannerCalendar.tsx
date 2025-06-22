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
  X
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: string[]; // Activity IDs
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled';
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getLessonPlanForDate = (date: Date) => {
    return lessonPlans.find(plan => 
      isSameDay(plan.date, date) && plan.className === className
    );
  };

  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
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
      // Implementation would depend on your data management
      console.log('Delete plan:', planId);
    }
  };

  const renderCalendarDay = (date: Date) => {
    const lessonPlan = getLessonPlanForDate(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());

    return (
      <button
        key={date.toISOString()}
        onClick={() => handleDateClick(date)}
        className={`
          relative w-full h-24 p-2 border border-gray-200 hover:bg-blue-50 transition-colors duration-200
          ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
          ${isToday ? 'ring-2 ring-blue-400' : ''}
          ${lessonPlan ? 'bg-green-50' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {format(date, 'd')}
          </span>
          
          {lessonPlan && (
            <div className="flex-1 mt-1">
              <div className={`
                text-xs px-2 py-1 rounded-full text-white font-medium
                ${lessonPlan.status === 'completed' ? 'bg-green-500' : 
                  lessonPlan.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}
              `}>
                Week {lessonPlan.week}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {lessonPlan.activities.length} activities
              </div>
            </div>
          )}
          
          {!lessonPlan && (
            <div className="flex-1 flex items-center justify-center">
              <Plus className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </button>
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
        {calendarDays.map(date => renderCalendarDay(date))}
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