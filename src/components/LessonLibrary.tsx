import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  BookOpen, 
  Clock, 
  Tag,
  SortAsc,
  SortDesc,
  Eye,
  MoreVertical,
  Edit3,
  Download,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { LessonLibraryCard } from './LessonLibraryCard';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonExporter } from './LessonExporter';

interface LessonLibraryProps {
  onLessonSelect?: (lessonNumber: string) => void;
  className?: string;
}

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

// Map lesson numbers to half-terms
const LESSON_TO_HALF_TERM: Record<string, string> = {
  '1': 'A1', '2': 'A1', '3': 'A1', '4': 'A1', '5': 'A1', '6': 'A1',
  '7': 'A2', '8': 'A2', '9': 'A2', '10': 'A2', '11': 'A2', '12': 'A2',
  '13': 'SP1', '14': 'SP1', '15': 'SP1', '16': 'SP1', '17': 'SP1', '18': 'SP1',
  '19': 'SP2', '20': 'SP2', '21': 'SP2', '22': 'SP2', '23': 'SP2', '24': 'SP2',
  '25': 'SM1', '26': 'SM1', '27': 'SM1', '28': 'SM1', '29': 'SM1', '30': 'SM1',
  '31': 'SM2', '32': 'SM2', '33': 'SM2', '34': 'SM2', '35': 'SM2', '36': 'SM2',
};

export function LessonLibrary({ onLessonSelect, className = '' }: LessonLibraryProps) {
  const { lessonNumbers, allLessonsData, currentSheetInfo } = useData();
  const { getThemeForClass } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string>('all');
  const [dominantCategory, setDominantCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number' | 'title' | 'activities' | 'time'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [showExporter, setShowExporter] = useState(false);

  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Get unique categories across all lessons
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.values(allLessonsData).forEach(lessonData => {
      lessonData.categoryOrder.forEach(category => {
        categories.add(category);
      });
    });
    return Array.from(categories).sort();
  }, [allLessonsData]);

  // Determine dominant category for each lesson
  const getDominantCategory = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (!lessonData) return '';
    
    // Count activities per category
    const categoryCounts: Record<string, number> = {};
    Object.entries(lessonData.grouped).forEach(([category, activities]) => {
      categoryCounts[category] = activities.length;
    });
    
    // Find category with most activities
    let maxCount = 0;
    let dominantCat = '';
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantCat = category;
      }
    });
    
    return dominantCat;
  };

  // Filter and sort lessons
  const filteredAndSortedLessons = useMemo(() => {
    let filtered = lessonNumbers.filter(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return false;
      
      // Filter by search query
      if (searchQuery) {
        const matchesSearch = 
          lessonNum.includes(searchQuery) || 
          (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          Object.values(lessonData.grouped).some(activities => 
            activities.some(activity => 
              activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
              activity.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        
        if (!matchesSearch) return false;
      }
      
      // Filter by half-term
      if (selectedHalfTerm !== 'all') {
        const lessonTerm = LESSON_TO_HALF_TERM[lessonNum] || 'A1';
        if (lessonTerm !== selectedHalfTerm) return false;
      }
      
      // Filter by dominant category
      if (dominantCategory !== 'all') {
        const dominant = getDominantCategory(lessonNum);
        if (dominant !== dominantCategory) return false;
      }
      
      return true;
    });

    // Sort lessons
    filtered.sort((a, b) => {
      const lessonA = allLessonsData[a];
      const lessonB = allLessonsData[b];
      
      if (!lessonA || !lessonB) return 0;
      
      let comparison = 0;
      
      switch (sortBy) {
        case 'number':
          comparison = parseInt(a) - parseInt(b);
          break;
        case 'title':
          comparison = (lessonA.title || `Lesson ${a}`).localeCompare(lessonB.title || `Lesson ${b}`);
          break;
        case 'activities':
          const activitiesA = Object.values(lessonA.grouped).reduce((sum, acts) => sum + acts.length, 0);
          const activitiesB = Object.values(lessonB.grouped).reduce((sum, acts) => sum + acts.length, 0);
          comparison = activitiesA - activitiesB;
          break;
        case 'time':
          comparison = lessonA.totalTime - lessonB.totalTime;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [lessonNumbers, allLessonsData, searchQuery, selectedHalfTerm, dominantCategory, sortBy, sortOrder]);

  const toggleSort = (field: 'number' | 'title' | 'activities' | 'time') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleLessonClick = (lessonNumber: string) => {
    if (onLessonSelect) {
      onLessonSelect(lessonNumber);
    } else {
      setSelectedLesson(lessonNumber);
      setShowExporter(true);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Lesson Library</h2>
              <p className="text-green-100 text-sm">
                {filteredAndSortedLessons.length} of {lessonNumbers.length} lessons
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'compact' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-300" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-green-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
              dir="ltr"
            />
          </div>
          
          <select
            value={selectedHalfTerm}
            onChange={(e) => setSelectedHalfTerm(e.target.value)}
            className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
            dir="ltr"
          >
            <option value="all" className="text-gray-900">All Half-Terms</option>
            {HALF_TERMS.map(term => (
              <option key={term.id} value={term.id} className="text-gray-900">
                {term.name} ({term.months})
              </option>
            ))}
          </select>
          
          <select
            value={dominantCategory}
            onChange={(e) => setDominantCategory(e.target.value)}
            className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
            dir="ltr"
          >
            <option value="all" className="text-gray-900">All Categories</option>
            {allCategories.map(category => (
              <option key={category} value={category} className="text-gray-900">
                {category}
              </option>
            ))}
          </select>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleSort('number')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'number' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-sm">#</span>
              {sortBy === 'number' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'time' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Clock className="h-4 w-4" />
              {sortBy === 'time' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('activities')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'activities' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Tag className="h-4 w-4" />
              {sortBy === 'activities' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Grid */}
      <div className="p-6">
        {filteredAndSortedLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedHalfTerm !== 'all' || dominantCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No lessons available in the library'
              }
            </p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
              viewMode === 'list' ? 'space-y-4' :
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            }
          `}>
            {filteredAndSortedLessons.map((lessonNum) => {
              const lessonData = allLessonsData[lessonNum];
              if (!lessonData) return null;
              
              return (
                <LessonLibraryCard
                  key={lessonNum}
                  lessonNumber={lessonNum}
                  lessonData={lessonData}
                  viewMode={viewMode}
                  onClick={() => handleLessonClick(lessonNum)}
                  theme={theme}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Lesson Exporter Modal */}
      {selectedLesson && showExporter && (
        <LessonExporter
          lessonNumber={selectedLesson}
          onClose={() => {
            setShowExporter(false);
            setSelectedLesson(null);
          }}
        />
      )}
    </div>
  );
}