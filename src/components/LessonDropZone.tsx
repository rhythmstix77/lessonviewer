import React, { useRef, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { 
  Plus, 
  Clock, 
  Users, 
  Calendar, 
  FileText, 
  GripVertical, 
  Trash2,
  Edit3,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Tag
} from 'lucide-react';
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
  status: 'planned' | 'completed' | 'cancelled';
}

interface LessonDropZoneProps {
  lessonPlan: LessonPlan;
  onActivityAdd: (activity: Activity) => void;
  onActivityRemove: (index: number) => void;
  onActivityReorder: (dragIndex: number, hoverIndex: number) => void;
  onNotesUpdate: (notes: string) => void;
  isEditing: boolean;
}

interface DraggableActivityProps {
  activity: Activity;
  index: number;
  onRemove: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  isEditing: boolean;
  onActivityClick?: (activity: Activity) => void;
}

function DraggableActivity({ activity, index, onRemove, onReorder, isEditing, onActivityClick }: DraggableActivityProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

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
    'Goodbye': '#14B8A6'
  };

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
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="bg-white rounded-lg border-2 border-gray-200 p-4 transition-all duration-200 hover:shadow-md group"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {isEditing && (
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
              <h4 className="font-semibold text-gray-900 text-base leading-tight">
                {activity.activity}
              </h4>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-600">{activity.category}</span>
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
  isEditing
}: LessonDropZoneProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'activity',
    drop: (item: { activity: Activity }) => {
      onActivityAdd(item.activity);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const [isRichTextEditing, setIsRichTextEditing] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (notesRef.current) {
      const updatedContent = notesRef.current.innerHTML;
      onNotesUpdate(updatedContent);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">
                Lesson Plan - Week {lessonPlan.week}
              </h2>
              <p className="text-green-100 text-sm">
                {lessonPlan.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-4 text-green-100">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{lessonPlan.duration} mins</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{lessonPlan.activities.length} activities</span>
              </div>
            </div>
            <p className="text-sm text-green-200 mt-1">{lessonPlan.className}</p>
          </div>
        </div>
      </div>

      {/* EYFS Standards Selector */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <EyfsStandardsSelector lessonNumber={lessonPlan.id} />
      </div>

      {/* Drop Zone */}
      <div
        ref={drop}
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
                : 'Drag activities from the library to build your lesson plan'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessonPlan.activities.map((activity, index) => (
              <DraggableActivity
                key={`${activity.activity}-${index}`}
                activity={activity}
                index={index}
                onRemove={() => onActivityRemove(index)}
                onReorder={onActivityReorder}
                isEditing={isEditing}
              />
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
        
        {isEditing ? (
          <div>
            {isRichTextEditing ? (
              <div>
                {/* Rich Text Toolbar */}
                <div className="flex items-center space-x-1 mb-2 p-2 bg-white rounded-lg border border-gray-200">
                  <button
                    onClick={() => execCommand('bold')}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => execCommand('italic')}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => execCommand('underline')}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                </div>
                
                <div
                  ref={notesRef}
                  contentEditable
                  className="min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
                  dangerouslySetInnerHTML={{ __html: lessonPlan.notes }}
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    onNotesUpdate(target.innerHTML);
                  }}
                />
                
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setIsRichTextEditing(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Switch to plain text
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  value={lessonPlan.notes.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '')}
                  onChange={(e) => onNotesUpdate(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Add notes about this lesson plan..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setIsRichTextEditing(true)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Use rich text editor
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-700">
            {lessonPlan.notes ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: lessonPlan.notes }}
              />
            ) : (
              <p className="text-gray-500 italic">No notes added yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}