import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Calendar, 
  Plus, 
  Save, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  Users, 
  BookOpen,
  ArrowLeft,
  Download,
  Share2
} from 'lucide-react';
import { ActivityLibrary } from './ActivityLibrary';
import { LessonPlannerCalendar } from './LessonPlannerCalendar';
import { LessonDropZone } from './LessonDropZone';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export function LessonPlanBuilder() {
  const { currentSheetInfo } = useData();
  const [currentView, setCurrentView] = useState<'calendar' | 'library' | 'builder'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Load lesson plans from localStorage
  useEffect(() => {
    const savedPlans = localStorage.getItem('lesson-plans');
    if (savedPlans) {
      const plans = JSON.parse(savedPlans).map((plan: any) => ({
        ...plan,
        date: new Date(plan.date),
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
      }));
      setLessonPlans(plans);
    }
  }, []);

  // Save lesson plans to localStorage
  const saveLessonPlans = (plans: LessonPlan[]) => {
    localStorage.setItem('lesson-plans', JSON.stringify(plans));
    setLessonPlans(plans);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const existingPlan = lessonPlans.find(plan => 
      plan.date.toDateString() === date.toDateString() && 
      plan.className === currentSheetInfo.sheet
    );
    
    if (existingPlan) {
      setCurrentLessonPlan(existingPlan);
      setCurrentView('builder');
    }
  };

  const handleCreateLessonPlan = (date: Date) => {
    const weekNumber = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 
      (7 * 24 * 60 * 60 * 1000)
    );

    const newPlan: LessonPlan = {
      id: `plan-${Date.now()}`,
      date,
      week: weekNumber,
      className: currentSheetInfo.sheet,
      activities: [],
      duration: 0,
      notes: '',
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentLessonPlan(newPlan);
    setIsEditing(true);
    setCurrentView('builder');
  };

  const handleUpdateLessonPlan = (updatedPlan: LessonPlan) => {
    const updatedPlans = lessonPlans.map(plan => 
      plan.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date() } : plan
    );
    
    if (!lessonPlans.find(plan => plan.id === updatedPlan.id)) {
      updatedPlans.push({ ...updatedPlan, updatedAt: new Date() });
    }
    
    saveLessonPlans(updatedPlans);
    setCurrentLessonPlan(updatedPlan);
  };

  const handleActivityAdd = (activity: Activity) => {
    if (currentLessonPlan) {
      const updatedPlan = {
        ...currentLessonPlan,
        activities: [...currentLessonPlan.activities, activity],
        duration: currentLessonPlan.duration + activity.time,
      };
      setCurrentLessonPlan(updatedPlan);
    }
  };

  const handleActivityRemove = (activityIndex: number) => {
    if (currentLessonPlan) {
      const removedActivity = currentLessonPlan.activities[activityIndex];
      const updatedPlan = {
        ...currentLessonPlan,
        activities: currentLessonPlan.activities.filter((_, index) => index !== activityIndex),
        duration: currentLessonPlan.duration - removedActivity.time,
      };
      setCurrentLessonPlan(updatedPlan);
    }
  };

  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    if (currentLessonPlan) {
      const draggedActivity = currentLessonPlan.activities[dragIndex];
      const newActivities = [...currentLessonPlan.activities];
      newActivities.splice(dragIndex, 1);
      newActivities.splice(hoverIndex, 0, draggedActivity);
      
      setCurrentLessonPlan({
        ...currentLessonPlan,
        activities: newActivities,
      });
    }
  };

  const handleSaveLessonPlan = () => {
    if (currentLessonPlan) {
      handleUpdateLessonPlan(currentLessonPlan);
      setIsEditing(false);
    }
  };

  const handleExportLessonPlan = () => {
    if (currentLessonPlan) {
      // Create a simple text export
      const exportData = {
        date: currentLessonPlan.date.toLocaleDateString(),
        week: currentLessonPlan.week,
        className: currentLessonPlan.className,
        duration: currentLessonPlan.duration,
        activities: currentLessonPlan.activities.map(activity => ({
          name: activity.activity,
          category: activity.category,
          time: activity.time,
          description: activity.description,
          level: activity.level,
        })),
        notes: currentLessonPlan.notes,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson-plan-${currentLessonPlan.date.toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Lesson Plan Builder</h1>
                  <p className="text-gray-600 text-lg">
                    {currentSheetInfo.display} • Create and manage your lesson plans
                  </p>
                </div>
              </div>

              {currentView === 'builder' && currentLessonPlan && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportLessonPlan}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  
                  {isEditing ? (
                    <button
                      onClick={handleSaveLessonPlan}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Plan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Plan</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* View Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  currentView === 'calendar' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setCurrentView('library')}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  currentView === 'library' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Activity Library</span>
              </button>
              {currentLessonPlan && (
                <button
                  onClick={() => setCurrentView('builder')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 ${
                    currentView === 'builder' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Plan Builder</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          {currentView === 'calendar' && (
            <LessonPlannerCalendar
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              lessonPlans={lessonPlans}
              onUpdateLessonPlan={handleUpdateLessonPlan}
              onCreateLessonPlan={handleCreateLessonPlan}
              className={currentSheetInfo.sheet}
            />
          )}

          {currentView === 'library' && (
            <ActivityLibrary
              onActivitySelect={handleActivityAdd}
              selectedActivities={currentLessonPlan?.activities || []}
              className={currentSheetInfo.sheet}
            />
          )}

          {currentView === 'builder' && currentLessonPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lesson Plan Details */}
              <div className="lg:col-span-2">
                <LessonDropZone
                  lessonPlan={currentLessonPlan}
                  onActivityAdd={handleActivityAdd}
                  onActivityRemove={handleActivityRemove}
                  onActivityReorder={handleActivityReorder}
                  onNotesUpdate={(notes) => setCurrentLessonPlan(prev => prev ? { ...prev, notes } : null)}
                  isEditing={isEditing}
                />
              </div>

              {/* Quick Activity Library */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <h3 className="text-lg font-semibold">Quick Add Activities</h3>
                    <p className="text-purple-100 text-sm">Drag activities to your lesson plan</p>
                  </div>
                  
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <ActivityLibrary
                      onActivitySelect={handleActivityAdd}
                      selectedActivities={currentLessonPlan.activities}
                      className={currentSheetInfo.sheet}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}