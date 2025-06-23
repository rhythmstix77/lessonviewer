import React from 'react';
import { useData } from '../contexts/DataContext';

interface CategoryListProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
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
  'Goodbye': '#14B8A6'
};

export function CategoryList({ selectedCategory, onCategoryChange, className = '' }: CategoryListProps) {
  const { allLessonsData } = useData();
  
  // Extract all categories from all lessons
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    
    Object.values(allLessonsData).forEach(lessonData => {
      Object.values(lessonData.grouped).forEach(categoryActivities => {
        categoryActivities.forEach(activity => {
          cats.add(activity.category);
        });
      });
    });
    
    return Array.from(cats).sort();
  }, [allLessonsData]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 overflow-x-auto ${className}`}>
      <div className="flex space-x-2 min-w-max">
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            selectedCategory === 'all' 
              ? 'bg-gray-800 text-white' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span>All Categories</span>
        </button>
        
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category === selectedCategory ? 'all' : category)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200`}
            style={{
              backgroundColor: category === selectedCategory 
                ? categoryColors[category] || '#6B7280'
                : 'transparent',
              color: category === selectedCategory ? 'white' : 'inherit',
              borderLeft: `4px solid ${categoryColors[category] || '#6B7280'}`
            }}
          >
            <span>{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}