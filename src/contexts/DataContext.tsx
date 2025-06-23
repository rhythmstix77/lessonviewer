import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchGoogleSheetData } from '../config/api';

export interface Activity {
  activity: string;
  description: string;
  htmlDescription?: string;
  time: number;
  videoLink: string;
  musicLink: string;
  backingLink: string;
  resourceLink: string;
  link: string;
  vocalsLink: string;
  imageLink: string;
  teachingUnit: string;
  category: string;
  level: string;
  unitName: string;
  lessonNumber: string;
  eyfsStandards?: string[];
}

export interface LessonData {
  grouped: Record<string, Activity[]>;
  categoryOrder: string[];
  totalTime: number;
  eyfsStatements?: string[];
}

export interface SheetInfo {
  sheet: string;
  display: string;
  eyfs: string;
}

interface DataContextType {
  currentSheetInfo: SheetInfo;
  setCurrentSheetInfo: (info: SheetInfo) => void;
  lessonNumbers: string[];
  teachingUnits: string[];
  allLessonsData: Record<string, LessonData>;
  eyfsStatements: Record<string, string[]>;
  allEyfsStatements: string[];
  loading: boolean;
  refreshData: () => Promise<void>;
  uploadExcelFile: (file: File) => Promise<void>;
  addEyfsToLesson: (lessonNumber: string, eyfsStatement: string) => void;
  removeEyfsFromLesson: (lessonNumber: string, eyfsStatement: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

// Define the preferred category order
const CATEGORY_ORDER = [
  'Welcome',
  'Kodaly Songs',
  'Kodaly Action Songs',
  'Action/Games Songs',
  'Rhythm Sticks',
  'Scarf Songs',
  'General Game',
  'Core Songs',
  'Parachute Games',
  'Percussion Games',
  'Goodbye',
  'Teaching Units'
];

// EYFS statements for each age group
const DEFAULT_EYFS_STATEMENTS = {
  'LKG': [
    'Communication and Language: Listening and attention',
    'Communication and Language: Understanding',
    'Communication and Language: Speaking',
    'Physical Development: Moving and handling',
    'Physical Development: Health and self-care',
    'Personal, Social and Emotional Development: Self-confidence and self-awareness',
    'Personal, Social and Emotional Development: Managing feelings and behaviour',
    'Personal, Social and Emotional Development: Making relationships'
  ],
  'UKG': [
    'Literacy: Reading',
    'Literacy: Writing',
    'Mathematics: Numbers',
    'Mathematics: Shape, space and measures',
    'Understanding the World: People and communities',
    'Understanding the World: The world',
    'Understanding the World: Technology',
    'Expressive Arts and Design: Exploring and using media and materials',
    'Expressive Arts and Design: Being imaginative'
  ],
  'Reception': [
    'Communication and Language: Listening, Attention and Understanding',
    'Communication and Language: Speaking',
    'Personal, Social and Emotional Development: Self-Regulation',
    'Personal, Social and Emotional Development: Managing Self',
    'Personal, Social and Emotional Development: Building Relationships',
    'Physical Development: Gross Motor Skills',
    'Physical Development: Fine Motor Skills',
    'Literacy: Comprehension',
    'Literacy: Word Reading',
    'Literacy: Writing',
    'Mathematics: Number',
    'Mathematics: Numerical Patterns',
    'Understanding the World: Past and Present',
    'Understanding the World: People, Culture and Communities',
    'Understanding the World: The Natural World',
    'Expressive Arts and Design: Creating with Materials',
    'Expressive Arts and Design: Being Imaginative and Expressive'
  ]
};

export function DataProvider({ children }: DataProviderProps) {
  const [currentSheetInfo, setCurrentSheetInfo] = useState<SheetInfo>({
    sheet: 'LKG',
    display: 'Lower Kindergarten',
    eyfs: 'LKG Statements'
  });
  
  const [lessonNumbers, setLessonNumbers] = useState<string[]>([]);
  const [teachingUnits, setTeachingUnits] = useState<string[]>([]);
  const [allLessonsData, setAllLessonsData] = useState<Record<string, LessonData>>({});
  const [eyfsStatements, setEyfsStatements] = useState<Record<string, string[]>>({});
  const [allEyfsStatements, setAllEyfsStatements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Set all EYFS statements based on current sheet
    setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS[currentSheetInfo.sheet as keyof typeof DEFAULT_EYFS_STATEMENTS] || []);
  }, [currentSheetInfo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // First try to load from Google Sheets for the specific class
      console.log(`Loading data for ${currentSheetInfo.sheet}...`);
      
      try {
        await loadFromGoogleSheets();
        console.log(`Successfully loaded ${currentSheetInfo.sheet} data from Google Sheets`);
      } catch (googleError) {
        console.warn(`Google Sheets failed for ${currentSheetInfo.sheet}, using fallback data:`, googleError);
        await loadFromLocalData();
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
      // Load minimal fallback data
      await loadFromLocalData();
    } finally {
      setLoading(false);
    }
  };

  const loadFromGoogleSheets = async () => {
    try {
      // Fetch data for the specific sheet type (LKG, UKG, or Reception)
      const sheetData = await fetchGoogleSheetData(currentSheetInfo.sheet as 'LKG' | 'UKG' | 'Reception');
      
      if (!sheetData || sheetData.length === 0) {
        throw new Error(`No data received from Google Sheets for ${currentSheetInfo.sheet}`);
      }
      
      console.log(`Raw Google Sheets data for ${currentSheetInfo.sheet}:`, sheetData.slice(0, 5)); // Log first 5 rows
      
      // Process the sheet data
      processSheetData(sheetData);
    } catch (error) {
      console.error(`Google Sheets loading failed for ${currentSheetInfo.sheet}:`, error);
      throw error;
    }
  };

  const loadFromLocalData = async () => {
    // This is the issue! We need to use your actual Google Sheets data, not fallback data
    // The system should be pulling from the different tabs in your spreadsheet
    
    console.log(`Loading from Google Sheets for ${currentSheetInfo.sheet} (fallback disabled)`);
    
    // Try Google Sheets one more time with better error handling
    try {
      const sheetData = await fetchGoogleSheetData(currentSheetInfo.sheet as 'LKG' | 'UKG' | 'Reception');
      
      if (sheetData && sheetData.length > 0) {
        console.log(`Successfully loaded ${currentSheetInfo.sheet} from Google Sheets on retry`);
        processSheetData(sheetData);
        return;
      }
    } catch (retryError) {
      console.warn(`Google Sheets retry failed for ${currentSheetInfo.sheet}:`, retryError);
    }
    
    // Only use minimal fallback if Google Sheets completely fails
    console.warn(`Using minimal fallback data for ${currentSheetInfo.sheet} - this should not happen in production`);
    
    const minimalFallback = [
      ['Lesson Number', 'Category', 'Activity Name', 'Description', 'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'],
      ['1', 'Welcome', 'Data Loading...', `Loading ${currentSheetInfo.display} lesson data from Google Sheets. Please refresh if this persists.`, currentSheetInfo.sheet, '0', '', '', '', '', ''],
      ['1', 'Goodbye', 'Please Refresh', 'Click the refresh button in the header to reload data from your Google Sheets.', currentSheetInfo.sheet, '0', '', '', '', '', '']
    ];
    
    processSheetData(minimalFallback);
  };

  const sortCategoriesByOrder = (categories: string[]): string[] => {
    // Sort categories according to the predefined order
    return categories.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      
      // If both categories are in the predefined order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one category is in the predefined order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither category is in the predefined order, sort alphabetically
      return a.localeCompare(b);
    });
  };

  const processSheetData = (sheetData: string[][]) => {
    try {
      if (!sheetData || sheetData.length === 0) {
        console.warn(`No sheet data provided for ${currentSheetInfo.sheet}`);
        return;
      }
      
      console.log(`Processing ${currentSheetInfo.sheet} sheet data, rows:`, sheetData.length);
      
      const headers = sheetData[0];
      console.log('Headers:', headers);
      
      const activities: Activity[] = [];
      const lessonNumbersSet = new Set<string>();
      const categoriesSet = new Set<string>();
      let currentLessonNumber = '';

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length < 3) continue; // Skip empty or incomplete rows

        // Safely extract data with fallbacks
        const lessonNumber = (row[0] || '').toString().trim();
        const category = (row[1] || '').toString().trim();
        const activityName = (row[2] || '').toString().trim();
        const description = (row[3] || '').toString().trim();
        const level = (row[4] || '').toString().trim();
        const timeStr = (row[5] || '0').toString().trim();
        const video = (row[6] || '').toString().trim();
        const music = (row[7] || '').toString().trim();
        const backing = (row[8] || '').toString().trim();
        const resource = (row[9] || '').toString().trim();
        const unitName = (row[10] || '').toString().trim();

        // Skip rows without category or activity name
        if (!category || !activityName) continue;

        // Handle lesson number logic - if empty, use the last seen lesson number
        if (lessonNumber) {
          currentLessonNumber = lessonNumber;
          lessonNumbersSet.add(lessonNumber);
        }

        categoriesSet.add(category);

        // Parse time safely
        let time = 0;
        try {
          const parsedTime = parseInt(timeStr);
          if (!isNaN(parsedTime) && parsedTime >= 0) {
            time = parsedTime;
          }
        } catch (e) {
          console.warn('Invalid time value:', timeStr);
        }

        const activity: Activity = {
          activity: activityName,
          description: description.replace(/"/g, ''),
          time,
          videoLink: video,
          musicLink: music,
          backingLink: backing,
          resourceLink: resource,
          link: '',
          vocalsLink: '',
          imageLink: '',
          teachingUnit: category,
          category,
          level,
          unitName,
          lessonNumber: currentLessonNumber || '1', // Default to lesson 1 if no lesson number
          eyfsStandards: []
        };

        activities.push(activity);
      }

      console.log(`Processed ${currentSheetInfo.sheet} activities:`, activities.length);
      console.log(`${currentSheetInfo.sheet} lesson numbers found:`, Array.from(lessonNumbersSet));
      console.log(`${currentSheetInfo.sheet} categories found:`, Array.from(categoriesSet));

      // Set lesson numbers and teaching units
      const sortedLessonNumbers = Array.from(lessonNumbersSet)
        .filter(num => num && !isNaN(parseInt(num)))
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      setLessonNumbers(sortedLessonNumbers);
      setTeachingUnits(Array.from(categoriesSet).sort());

      // Group activities by lesson
      const lessonsData: Record<string, LessonData> = {};
      
      sortedLessonNumbers.forEach(lessonNum => {
        const lessonActivities = activities.filter(activity => activity.lessonNumber === lessonNum);

        const grouped: Record<string, Activity[]> = {};
        const categoriesInLesson = new Set<string>();
        let totalTime = 0;

        lessonActivities.forEach(activity => {
          if (!grouped[activity.category]) {
            grouped[activity.category] = [];
          }
          grouped[activity.category].push(activity);
          categoriesInLesson.add(activity.category);
          totalTime += activity.time;
        });

        // Sort categories according to the predefined order
        const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));

        lessonsData[lessonNum] = {
          grouped,
          categoryOrder,
          totalTime,
          eyfsStatements: []
        };
      });

      console.log(`${currentSheetInfo.sheet} lessons data structure:`, Object.keys(lessonsData));
      console.log(`Sample ${currentSheetInfo.sheet} lesson category order:`, lessonsData[sortedLessonNumbers[0]]?.categoryOrder);
      setAllLessonsData(lessonsData);

      // Set EYFS statements for each lesson
      const eyfsStatementsMap: Record<string, string[]> = {};
      sortedLessonNumbers.forEach(lessonNum => {
        eyfsStatementsMap[lessonNum] = [];
      });
      setEyfsStatements(eyfsStatementsMap);

    } catch (error) {
      console.error(`Error processing ${currentSheetInfo.sheet} sheet data:`, error);
      // Set minimal fallback data
      setLessonNumbers(['1']);
      setTeachingUnits(['Welcome', 'Goodbye']);
      setAllLessonsData({
        '1': {
          grouped: {
            'Welcome': [{
              activity: 'Data Loading Error',
              description: `Failed to load ${currentSheetInfo.sheet} data. Please refresh the page.`,
              time: 0,
              videoLink: '',
              musicLink: '',
              backingLink: '',
              resourceLink: '',
              link: '',
              vocalsLink: '',
              imageLink: '',
              teachingUnit: 'Welcome',
              category: 'Welcome',
              level: currentSheetInfo.sheet,
              unitName: '',
              lessonNumber: '1'
            }]
          },
          categoryOrder: ['Welcome'],
          totalTime: 0,
          eyfsStatements: []
        }
      });
      setEyfsStatements({});
    }
  };

  const uploadExcelFile = async (file: File) => {
    try {
      setLoading(true);
      
      // For now, we'll simulate Excel processing
      // In production, you'd send this to a backend service
      console.log('Excel file upload simulated:', file.name);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, reload current data
      await loadData();
      
    } catch (error) {
      console.error('Excel upload failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  // Add EYFS statement to a lesson
  const addEyfsToLesson = (lessonNumber: string, eyfsStatement: string) => {
    setEyfsStatements(prev => {
      const updatedStatements = { ...prev };
      if (!updatedStatements[lessonNumber]) {
        updatedStatements[lessonNumber] = [];
      }
      if (!updatedStatements[lessonNumber].includes(eyfsStatement)) {
        updatedStatements[lessonNumber] = [...updatedStatements[lessonNumber], eyfsStatement];
      }
      return updatedStatements;
    });

    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber]) {
        const currentStatements = updatedLessonsData[lessonNumber].eyfsStatements || [];
        if (!currentStatements.includes(eyfsStatement)) {
          updatedLessonsData[lessonNumber] = {
            ...updatedLessonsData[lessonNumber],
            eyfsStatements: [...currentStatements, eyfsStatement]
          };
        }
      }
      return updatedLessonsData;
    });
  };

  // Remove EYFS statement from a lesson
  const removeEyfsFromLesson = (lessonNumber: string, eyfsStatement: string) => {
    setEyfsStatements(prev => {
      const updatedStatements = { ...prev };
      if (updatedStatements[lessonNumber]) {
        updatedStatements[lessonNumber] = updatedStatements[lessonNumber].filter(
          statement => statement !== eyfsStatement
        );
      }
      return updatedStatements;
    });

    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber] && updatedLessonsData[lessonNumber].eyfsStatements) {
        updatedLessonsData[lessonNumber] = {
          ...updatedLessonsData[lessonNumber],
          eyfsStatements: updatedLessonsData[lessonNumber].eyfsStatements!.filter(
            statement => statement !== eyfsStatement
          )
        };
      }
      return updatedLessonsData;
    });
  };

  const value = {
    currentSheetInfo,
    setCurrentSheetInfo,
    lessonNumbers,
    teachingUnits,
    allLessonsData,
    eyfsStatements,
    allEyfsStatements,
    loading,
    refreshData,
    uploadExcelFile,
    addEyfsToLesson,
    removeEyfsFromLesson
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}