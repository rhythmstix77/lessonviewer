import React from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';

interface CategoryListProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function CategoryList({ selectedCategory, onCategoryChange, className = '' }: CategoryListProps) {
  const { allLessonsData } = useData();
  const { categories, getCategoryColor } = useSettings();
  
  // Extract all categories from all lessons
  const availableCategories = React.useMemo(() => {
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
        
        {categories.map(category => {
          // Only show categories that are actually used in lessons
          if (!availableCategories.includes(category.name)) return null;
          
          return (
            <button
              key={category.name}
              onClick={() => onCategoryChange(category.name === selectedCategory ? 'all' : category.name)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200`}
              style={{
                backgroundColor: category.name === selectedCategory 
                  ? category.color
                  : 'transparent',
                color: category.name === selectedCategory ? 'white' : 'inherit',
                borderLeft: `4px solid ${category.color}`
              }}
            >
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}