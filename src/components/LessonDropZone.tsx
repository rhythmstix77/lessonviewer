import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { 
  Plus, 
  Clock, 
  Users, 
  FileText, 
  GripVertical, 
  Trash2,
  Save,
  X,
  Edit3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RichTextEditor } from './RichTextEditor';
import type { Activity } from '../contexts/DataContext';
import { EyfsStandardsSelector } from './EyfsStandardsSelector';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled' | 'draft';
  title?: string;
  term?: string;
}

interface LessonDropZoneProps {
  lessonPlan: LessonPlan;
  onActivityAdd: (activity: Activity) => void;
  onActivityRemove: (index: number) => void;
  onActivityReorder: (dragIndex: number, hoverIndex: number) => void;
  onNotesUpdate: (notes: string) => void;
  isEditing: boolean;
  onActivityClick?: (activity: Activity) => void;
  onSave?: () => void;
  onSaveAndCreate?: () => void;
}

interface ActivityItemProps {
  activity: Activity;
  index: number;
  onRemove: () => void;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
  isEditing: boolean;
  onActivityClick?: (activity: Activity) => void;
  isDraggable?: boolean;
}

const categoryColors: Record<string, string> = {
  'Welcome': '#F59E0B',
  'Kodaly Songs': '#8B5CF6',
  'Kodaly Action Songs': '#F97316',
  'Action/Games Songs': '#F97316',
  'Rhythm Sticks': '#D97706',
  'Scarf Songs': '#10B981',
  'General Game': '#3B82F6',
  'Core Songs': '#84CC16',
  'Parachute Games': '#EF4444',
  'Percussion Games': '#06B6D4',
  'Teaching Units': '#6366F1',
  'Goodbye': '#14B8A6',
  'Kodaly Rhythms': '#9333EA',
  'Kodaly Games': '#F59E0B',
  'IWB Games': '#FBBF24'
};

function ActivityItem({ 
  activity, 
  index, 
  onRemove, 
  onReorder, 
  isEditing, 
  onActivityClick,
  isDraggable = true
}: ActivityItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Only set up drag and drop if draggable is true
  let dragDropProps = {};
  
  if (isDraggable && onReorder) {
    const [{ handlerId }, drop] = useDrop({
      accept: 'lesson-activity',
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
        };
      },
      hover(item: { index: number }, monitor) {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        if (dragIndex === hoverIndex) {
          return;
        }

        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        onReorder(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });

    const [{ isDragging }, drag] = useDrag({
      type: 'lesson-activity',
      item: () => {
        return { index };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    dragDropProps = {
      ref: (node: HTMLDivElement) => drag(drop(node)),
      style: { opacity: isDragging ? 0.4 : 1 },
      'data-handler-id': handlerId,
    };
  }

  const categoryColor = categoryColors[activity.category] || '#6B7280';

  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    
    // If already HTML, return as is
    if (text.includes('<')) {
      return text;
    }
    
    // Replace newlines with <br> tags
    return text.replace(/\n/g, '<br>');
  };

  const handleClick = () => {
    if (onActivityClick && !isEditing) {
      onActivityClick(activity);
    }
  };

  return (
    <div
      ref={isDraggable ? ref : undefined}
      {...dragDropProps}
      className="bg-white rounded-lg border-2 border-gray-200 p-4 transition-all duration-200 hover:shadow-md group"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {isEditing && isDraggable && (
          <div className="flex flex-col space-y-1 pt-1">
            <div className="cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="h-5 w-5" />
            </div>
          </div>
        )}
        
        <div 
          className="w-1 h-full rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor, minHeight: '60px' }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base leading-tight" dir="ltr">
                {activity.activity}
              </h4>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-600" dir="ltr">{activity.category}</span>
                {activity.level && (
                  <span 
                    className="px-2 py-1 text-white text-xs font-medium rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {activity.level}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              {activity.time > 0 && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{activity.time}m</span>
                </div>
              )}
              
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {activity.description && (
            <div 
              className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatDescription(activity.description) }}
              dir="ltr"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function LessonDropZone({
  lessonPlan,
  onActivityAdd,
  onActivityRemove,
  onActivityReorder,
  onNotesUpdate,
  isEditing,
  onActivityClick,
  onSave,
  onSaveAndCreate
}: LessonDropZoneProps) {
  // Fix: Use the correct drag type 'activity' to match ActivityCard
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['activity', 'lesson'],
    drop: (item: any) => {
      if (item.activity) {
        onActivityAdd(item.activity);
      } else if (item.lessonNumber) {
        // Handle dropped lesson - this would be implemented in the parent component
        console.log('Lesson dropped:', item.lessonNumber);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Group activities by category for side-by-side display
  const groupedActivities: Record<string, Activity[]> = React.useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    
    lessonPlan.activities.forEach(activity => {
      if (!grouped[activity.category]) {
        grouped[activity.category] = [];
      }
      grouped[activity.category].push(activity);
    });
    
    return grouped;
  }, [lessonPlan.activities]);

  // Get all categories in the lesson plan
  const categories = Object.keys(groupedActivities).sort();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* New Header Design */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="bg-green-500 p-3 rounded-lg shadow-md">
              <Edit3 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={lessonPlan.title || ''}
                onChange={(e) => {
                  const updatedPlan = { ...lessonPlan, title: e.target.value };
                  onNotesUpdate(updatedPlan.notes); // Trigger update to mark changes
                }}
                placeholder="Lesson Name"
                className="w-full text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-green-500 focus:outline-none bg-transparent"
                dir="ltr"
              />
              <div className="flex items-center flex-wrap gap-3 mt-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <span>{lessonPlan.className}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <span>Week</span>
                    <input
                      type="number"
                      value={lessonPlan.week}
                      onChange={(e) => {
                        const updatedPlan = { ...lessonPlan, week: parseInt(e.target.value) || 1 };
                        onNotesUpdate(updatedPlan.notes); // Trigger update to mark changes
                      }}
                      className="w-12 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                      min="1"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Term:</label>
                  <select
                    value={lessonPlan.term || 'A1'}
                    onChange={(e) => {
                      const updatedPlan = { ...lessonPlan, term: e.target.value };
                      onNotesUpdate(updatedPlan.notes); // Trigger update to mark changes
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    dir="ltr"
                  >
                    <option value="A1">Autumn 1 (Sep-Oct)</option>
                    <option value="A2">Autumn 2 (Nov-Dec)</option>
                    <option value="SP1">Spring 1 (Jan-Feb)</option>
                    <option value="SP2">Spring 2 (Mar-Apr)</option>
                    <option value="SM1">Summer 1 (Apr-May)</option>
                    <option value="SM2">Summer 2 (Jun-Jul)</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{lessonPlan.duration} minutes</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{lessonPlan.activities.length} activities</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save buttons */}
          <div className="flex items-center space-x-3">
            {onSave && (
              <button
                onClick={onSave}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Plan</span>
              </button>
            )}
            
            {onSaveAndCreate && (
              <button
                onClick={onSaveAndCreate}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save & New</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EYFS Standards Selector */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <EyfsStandardsSelector lessonNumber={lessonPlan.id} />
      </div>

      {/* Drop Zone */}
      <div
        ref={isEditing ? drop : undefined}
        className={`p-6 min-h-[400px] transition-colors duration-200 ${
          isOver ? 'bg-blue-50 border-blue-300' : ''
        }`}
      >
        {lessonPlan.activities.length === 0 ? (
          <div className="text-center py-16">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${
              isOver ? 'bg-blue-200' : 'bg-gray-100'
            }`}>
              <Plus className={`h-12 w-12 transition-colors duration-200 ${
                isOver ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isOver ? 'Drop activity here' : 'No activities planned'}
            </h3>
            <p className="text-gray-600">
              {isOver 
                ? 'Release to add this activity to your lesson plan'
                : 'Select activities from the panel to build your lesson plan'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activities organized by category */}
            {categories.map(category => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200" dir="ltr">
                  {category}
                </h3>
                
                {/* Grid layout for activities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedActivities[category].map((activity, index) => {
                    // Find the global index of this activity in the full activities array
                    const globalIndex = lessonPlan.activities.findIndex(
                      a => a._uniqueId === activity._uniqueId
                    );
                    
                    return (
                      <ActivityItem
                        key={`${activity._uniqueId || `${activity.activity}-${index}`}`}
                        activity={activity}
                        index={globalIndex}
                        onRemove={() => onActivityRemove(globalIndex)}
                        onReorder={isEditing ? onActivityReorder : undefined}
                        isEditing={isEditing}
                        onActivityClick={onActivityClick}
                        isDraggable={isEditing}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <Plus className={`h-8 w-8 mx-auto mb-2 transition-colors duration-200 ${
                  isOver ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <p className={`font-medium transition-colors duration-200 ${
                  isOver ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {isOver ? 'Drop to add activity' : 'Drag more activities here'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Lesson Notes</h3>
        </div>
        
        <div>
          {isEditing ? (
            <RichTextEditor
              value={lessonPlan.notes}
              onChange={onNotesUpdate}
              placeholder="Add notes about this lesson plan..."
              minHeight="100px"
            />
          ) : (
            <div 
              className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200"
              dangerouslySetInnerHTML={{ __html: lessonPlan.notes || '<p class="text-gray-500 italic">No notes added yet</p>' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}