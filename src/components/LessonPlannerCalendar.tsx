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
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { useDrop } from 'react-dnd';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
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
  title?: string;
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
  const { allLessonsData } = useData();
  const { getThemeForClass, getCategoryColor } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [selectedDateWithPlans, setSelectedDateWithPlans] = useState<{date: Date, plans: LessonPlan[]} | null>(null);
  const [isLessonSummaryOpen, setIsLessonSummaryOpen] = useState(false);

  // Get theme colors
  const theme = getThemeForClass(className);

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

  const getLessonPlansForDate = (date: Date): LessonPlan[] => {
    // Get all plans for this date
    return filteredLessonPlans.filter(plan => 
      isSameDay(new Date(plan.date), date) && plan.className === className
    );
  };

  const handleDateClick = (date: Date) => {
    const plansForDate = getLessonPlansForDate(date);
    
    if (plansForDate.length > 0) {
      setSelectedDateWithPlans({date, plans: plansForDate});
      setIsLessonSummaryOpen(true);
    } else {
      // If no plans exist, create a new one
      onDateSelect(date);
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
      
      // Clear selected plan if it was deleted
      if (selectedPlan && selectedPlan.id === planId) {
        setSelectedPlan(null);
      }
      
      // Close the lesson summary if all plans for the date are deleted
      if (selectedDateWithPlans) {
        const remainingPlans = updatedPlans.filter(plan => 
          isSameDay(new Date(plan.date), selectedDateWithPlans.date) && plan.className === className
        );
        
        if (remainingPlans.length === 0) {
          setIsLessonSummaryOpen(false);
          setSelectedDateWithPlans(null);
        } else {
          setSelectedDateWithPlans({...selectedDateWithPlans, plans: remainingPlans});
        }
      }
    }
  };

  const renderCalendarDay = (date: Date, isCurrentMonth: boolean = true) => {
    const plansForDate = getLessonPlansForDate(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());
    const isSelectedWithPlans = selectedDateWithPlans && isSameDay(date, selectedDateWithPlans.date);
    
    // Check if there are plans for this date
    const hasPlans = plansForDate.length > 0;
    const hasMultiplePlans = plansForDate.length > 1;
    const singlePlan = plansForDate.length === 1 ? plansForDate[0] : null;

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
          relative w-full h-16 p-1 border border-gray-200 hover:bg-blue-50 transition-colors duration-200 group cursor-pointer
          ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
          ${isToday ? 'ring-2 ring-blue-400' : ''}
          ${hasPlans ? 'bg-green-50' : ''}
          ${!isCurrentMonth ? 'opacity-40' : ''}
          ${isOver ? 'bg-blue-100 border-blue-300' : ''}
          ${isSelectedWithPlans && isLessonSummaryOpen ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {format(date, 'd')}
          </span>
          
          {hasPlans && (
            <div className="flex-1 mt-1 flex flex-wrap gap-1">
              {plansForDate.slice(0, 2).map((plan, index) => (
                <div 
                  key={index}
                  className={`
                    h-2 w-2 rounded-full
                    ${plan.status === 'completed' ? 'bg-green-500' : 
                      plan.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}
                  `}
                  title={plan.title || `Week ${plan.week} Lesson`}
                ></div>
              ))}
              {plansForDate.length > 2 && (
                <div className="h-2 w-2 rounded-full bg-purple-500" title={`+${plansForDate.length - 2} more plans`}></div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-700 py-1 text-xs">
            {day}
          </div>
        ))}
        {weekDays.map(date => (
          <div key={date.toISOString()}>
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
          <div key={day} className="text-center font-medium text-gray-700 py-1 text-xs">
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

  // Get lesson details if a lesson number is associated with the plan
  const getLessonDetails = (lessonNumber?: string) => {
    if (!lessonNumber || !allLessonsData[lessonNumber]) return null;
    
    const lessonData = allLessonsData[lessonNumber];
    return {
      totalTime: lessonData.totalTime,
      totalActivities: Object.values(lessonData.grouped).reduce(
        (sum, activities) => sum + activities.length, 0
      ),
      categories: lessonData.categoryOrder
    };
  };

  // Render the lesson summary box
  const renderLessonSummary = () => {
    if (!selectedDateWithPlans || !isLessonSummaryOpen) return null;
    
    const { date, plans } = selectedDateWithPlans;
    
    return (
      <div className="absolute left-1/2 transform -translate-x-1/2 top-32 z-10 w-[90%] max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div 
            className="p-4 text-white relative"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {format(date, 'MMMM d, yyyy')}
                </h2>
                <p className="text-white text-opacity-90 text-sm">
                  {plans.length} {plans.length === 1 ? 'lesson' : 'lessons'} planned
                </p>
              </div>
              <button
                onClick={() => setIsLessonSummaryOpen(false)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Lesson Plans */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Plan Header */}
                  <div 
                    className="p-4 border-b border-gray-200"
                    style={{ 
                      background: plan.unitId 
                        ? `linear-gradient(to right, ${theme.primary}15, ${theme.primary}05)` 
                        : `linear-gradient(to right, ${theme.secondary}15, ${theme.secondary}05)`,
                      borderLeft: `4px solid ${plan.unitId ? theme.primary : theme.secondary}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {plan.title || (plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : `Week ${plan.week} Lesson`)}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>Week {plan.week}</span>
                          {plan.unitName && (
                            <>
                              <span>•</span>
                              <span>{plan.unitName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDateSelect(date);
                            setIsLessonSummaryOpen(false);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit Lesson"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlan(plan.id);
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete Lesson"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Plan Content */}
                  <div className="p-4">
                    {/* Stats */}
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{plan.duration} mins</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{plan.activities.length} activities</span>
                      </div>
                    </div>
                    
                    {/* Categories or Activities */}
                    {plan.lessonNumber && getLessonDetails(plan.lessonNumber) ? (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Categories
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {getLessonDetails(plan.lessonNumber)!.categories.slice(0, 4).map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${getCategoryColor(category)}20`,
                                color: getCategoryColor(category)
                              }}
                            >
                              {category}
                            </span>
                          ))}
                          {getLessonDetails(plan.lessonNumber)!.categories.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              +{getLessonDetails(plan.lessonNumber)!.categories.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : plan.activities.length > 0 ? (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Activities
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {plan.activities.slice(0, 3).map((activity, index) => (
                            <div 
                              key={index}
                              className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{activity.activity}</span>
                                {activity.time > 0 && (
                                  <span className="text-xs text-gray-500">{activity.time}m</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-600">{activity.category}</span>
                            </div>
                          ))}
                          {plan.activities.length > 3 && (
                            <div className="text-center text-xs text-blue-600 py-1">
                              +{plan.activities.length - 3} more activities
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        No activities added yet
                      </div>
                    )}
                    
                    {/* Notes Preview */}
                    {plan.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Notes
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {plan.notes.replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                    )}
                    
                    {/* View Button */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect(date);
                          setIsLessonSummaryOpen(false);
                        }}
                        className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Lesson</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Lesson Card */}
              <div 
                className="bg-white rounded-xl shadow-md border-2 border-dashed border-gray-300 hover:border-blue-400 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center p-6 cursor-pointer"
                onClick={() => {
                  onDateSelect(selectedDateWithPlans.date);
                  onCreateLessonPlan(selectedDateWithPlans.date);
                  setIsLessonSummaryOpen(false);
                }}
              >
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Add New Lesson</h3>
                <p className="text-sm text-gray-600 text-center">
                  Create a new lesson plan for {format(selectedDateWithPlans.date, 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header - THINNER */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <h2 className="text-lg font-bold">Lesson Planner</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
              className="px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-xs font-medium transition-colors duration-200"
            >
              {viewMode === 'month' ? 'Week View' : 'Month View'}
            </button>
            
            <div className="flex items-center">
              <button
                onClick={() => setCurrentDate(viewMode === 'month' ? subWeeks(currentDate, 4) : subWeeks(currentDate, 1))}
                className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <h3 className="text-base font-medium mx-2">
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy')
                  : `Week of ${format(weekStart, 'MMM d, yyyy')}`
                }
              </h3>
              
              <button
                onClick={() => setCurrentDate(viewMode === 'month' ? addWeeks(currentDate, 4) : addWeeks(currentDate, 1))}
                className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Filter */}
      {units.length > 0 && (
        <div className="p-2 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-medium text-gray-700">
              Filter by Unit:
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
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
      <div className="p-4">
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Planned</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Cancelled</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Multiple</span>
          </div>
        </div>
      </div>

      {/* Lesson Summary Box */}
      {renderLessonSummary()}

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