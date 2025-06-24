import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { activitiesApi, lessonsApi, eyfsApi } from '../config/api';

export interface Activity {
  _id?: string;
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
  _uniqueId?: string; // Added for drag and drop uniqueness
}

export interface LessonData {
  grouped: Record<string, Activity[]>;
  categoryOrder: string[];
  totalTime: number;
  eyfsStatements?: string[];
  title?: string; // Added title field for lessons
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
  updateAllEyfsStatements: (statements: string[]) => void;
  updateLessonTitle: (lessonNumber: string, title: string) => void; // New function to update lesson title
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

// EYFS statements for all age groups
const DEFAULT_EYFS_STATEMENTS = [
  "Communication and Language: 🎧 Listens carefully to rhymes and songs",
  "Communication and Language: 🎧 Enjoys singing and making sounds",
  "Communication and Language: 🎧 Joins in with familiar songs and rhymes",
  "Communication and Language: 🎧 Understands and responds to simple questions or instructions",
  "Communication and Language: 🗣️ Uses talk to express ideas and feelings",
  "Listening, Attention and Understanding: 🎧 Listens with increased attention to sounds",
  "Listening, Attention and Understanding: 🎧 Responds to what they hear with relevant actions",
  "Listening, Attention and Understanding: 🎧 Follows directions with two or more steps",
  "Listening, Attention and Understanding: 🎧 Understands simple concepts such as in, on, under",
  "Speaking: 🗣️ Begins to use longer sentences",
  "Speaking: 🗣️ Retells events or experiences in sequence",
  "Speaking: 🗣️ Uses new vocabulary in different contexts",
  "Speaking: 🗣️ Talks about what they are doing or making",
  "Personal, Social and Emotional Development: 🧠 Shows confidence to try new activities",
  "Personal, Social and Emotional Development: 🧠 Takes turns and shares with others",
  "Personal, Social and Emotional Development: 🧠 Expresses own feelings and considers others'",
  "Personal, Social and Emotional Development: 🧠 Shows resilience and perseverance",
  "Physical Development: 🕺 Moves energetically, e.g., running, jumping, dancing",
  "Physical Development: 🕺 Uses large and small motor skills for coordinated movement",
  "Physical Development: 🕺 Moves with control and coordination",
  "Physical Development: 🕺 Shows strength, balance and coordination",
  "Expressive Arts and Design: 🎨 Creates collaboratively, sharing ideas and resources",
  "Expressive Arts and Design: 🎨 Explores the sounds of instruments",
  "Expressive Arts and Design: 🎨 Sings a range of well-known nursery rhymes and songs",
  "Expressive Arts and Design: 🎨 Performs songs, rhymes, poems and stories with others",
  "Expressive Arts and Design: 🎨 Responds imaginatively to music and dance",
  "Expressive Arts and Design: 🎨 Develops storylines in pretend play"
];

// Sample data for initial load
const SAMPLE_DATA = {
  'LKG': [
    ['Lesson Number', 'Category', 'Activity Name', 'Description', 'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'],
    ['1', 'Welcome', 'Hello Everyone', "Hello Everyone Hello Everyone Hello Everyone It's time for music now!", 'All', '3', 'https://example.com/video', '', '', '', ''],
    ['1', 'Kodaly Songs', 'Cobbler Cobbler', "Sol/Mi - Song and Game. Children sit in a circle, sing Cobbler Cobbler Mend My Shoe. Keep the beat by tapping shoes with hands or rhythm sticks.", 'All', '5', '', 'https://example.com/music', '', '', ''],
    ['1', 'Goodbye', 'Goodbye Song', "Goodbye everyone, goodbye everyone, we'll see you next time.", 'All', '2', '', 'https://example.com/goodbye', '', '', ''],
    ['2', 'Welcome', 'Hello Friends', "Welcome song for class", 'All', '3', '', 'https://example.com/hello', '', '', ''],
    ['2', 'Core Songs', 'I am a Robot', "Robot movement activity with sounds", 'EYFS U', '4', '', 'https://example.com/robot', '', '', 'Robot Unit'],
    ['2', 'Goodbye', 'See You Soon', "Goodbye song with actions", 'All', '2', '', 'https://example.com/goodbye', '', '', ''],
    ['3', 'Welcome', 'Good Morning', "Morning greeting song with actions", 'All', '3', '', 'https://example.com/morning', '', '', ''],
    ['3', 'Action/Games Songs', 'Bounce High Bounce Low', "Movement game with ball", 'All', '4', '', 'https://example.com/bounce', '', '', ''],
    ['3', 'Goodbye', 'Time to Go', "Farewell song with waves", 'All', '2', '', 'https://example.com/farewell', '', '', '']
  ],
  'UKG': [
    ['Lesson Number', 'Category', 'Activity Name', 'Description', 'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'],
    ['1', 'Welcome', 'Hello Friends', "Welcome song for UKG class", 'All', '3', '', 'https://example.com/hello', '', '', ''],
    ['1', 'Core Songs', 'I am a Robot', "Robot movement activity with sounds", 'EYFS U', '4', '', 'https://example.com/robot', '', '', 'Robot Unit'],
    ['1', 'Goodbye', 'See You Soon', "Goodbye song with actions", 'All', '2', '', 'https://example.com/goodbye', '', '', ''],
    ['2', 'Welcome', 'Morning Circle', "Circle time greeting", 'All', '3', '', 'https://example.com/circle', '', '', ''],
    ['2', 'Rhythm Sticks', 'Tap and Stop', "Rhythm game with sticks", 'EYFS U', '5', '', 'https://example.com/rhythm', '', '', ''],
    ['2', 'Goodbye', 'Wave Goodbye', "Farewell with waving", 'All', '2', '', 'https://example.com/wave', '', '', '']
  ],
  'Reception': [
    ['Lesson Number', 'Category', 'Activity Name', 'Description', 'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'],
    ['1', 'Welcome', 'Good Morning', "Morning greeting song with actions", 'All', '3', '', 'https://example.com/morning', '', '', ''],
    ['1', 'Action/Games Songs', 'Bounce High Bounce Low', "Movement game with ball", 'All', '4', '', 'https://example.com/bounce', '', '', ''],
    ['1', 'Goodbye', 'Time to Go', "Farewell song with waves", 'All', '2', '', 'https://example.com/farewell', '', '', ''],
    ['2', 'Welcome', 'Hello Circle', "Circle time greeting", 'All', '3', '', 'https://example.com/hello-circle', '', '', ''],
    ['2', 'Percussion Games', 'Beat Makers', "Creating rhythms with percussion", 'Reception', '6', '', 'https://example.com/percussion', '', '', ''],
    ['2', 'Goodbye', 'Goodbye Friends', "Farewell song", 'All', '2', '', 'https://example.com/goodbye-friends', '', '', '']
  ]
};

// Default lesson titles based on categories
const generateDefaultLessonTitle = (lessonData: LessonData): string => {
  // Get the main categories in this lesson
  const categories = lessonData.categoryOrder;
  
  if (categories.length === 0) return "Untitled Lesson";
  
  // If it has Welcome and Goodbye, it's a standard lesson
  if (categories.includes('Welcome') && categories.includes('Goodbye')) {
    // Find the main content category (not Welcome or Goodbye)
    const mainCategories = categories.filter(cat => cat !== 'Welcome' && cat !== 'Goodbye');
    if (mainCategories.length > 0) {
      return `${mainCategories[0]} Lesson`;
    }
    return "Standard Lesson";
  }
  
  // If it has a specific focus
  if (categories.includes('Kodaly Songs')) return "Kodaly Lesson";
  if (categories.includes('Rhythm Sticks')) return "Rhythm Sticks Lesson";
  if (categories.includes('Percussion Games')) return "Percussion Lesson";
  if (categories.includes('Scarf Songs')) return "Movement with Scarves";
  if (categories.includes('Parachute Games')) return "Parachute Activities";
  if (categories.includes('Action/Games Songs')) return "Action Games Lesson";
  
  // Default to the first category
  return `${categories[0]} Lesson`;
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
  const [allEyfsStatements, setAllEyfsStatements] = useState<string[]>(DEFAULT_EYFS_STATEMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Load EYFS statements
    loadEyfsStatements();
  }, [currentSheetInfo]);

  const loadEyfsStatements = async () => {
    try {
      // Try to load from server
      try {
        const response = await eyfsApi.getBySheet(currentSheetInfo.sheet);
        if (response && response.allStatements) {
          setAllEyfsStatements(response.allStatements);
          return;
        }
      } catch (serverError) {
        console.warn('Failed to load EYFS statements from server:', serverError);
      }
      
      // Fallback to localStorage
      const savedStandards = localStorage.getItem(`eyfs-standards-${currentSheetInfo.sheet}`);
      if (savedStandards) {
        try {
          const parsedStandards = JSON.parse(savedStandards);
          // Convert from object format to flat array
          const flatStandards: string[] = [];
          Object.entries(parsedStandards).forEach(([area, details]) => {
            (details as string[]).forEach(detail => {
              flatStandards.push(`${area}: ${detail}`);
            });
          });
          setAllEyfsStatements(flatStandards.length > 0 ? flatStandards : DEFAULT_EYFS_STATEMENTS);
        } catch (error) {
          console.error('Error parsing saved EYFS standards:', error);
          setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
        }
      } else {
        // Use default standards if none saved
        setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
      }
    } catch (error) {
      console.error('Error loading EYFS statements:', error);
      setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to load from server
      try {
        const lessonData = await lessonsApi.getBySheet(currentSheetInfo.sheet);
        if (lessonData && Object.keys(lessonData).length > 0) {
          setAllLessonsData(lessonData.allLessonsData || {});
          setLessonNumbers(lessonData.lessonNumbers || []);
          setTeachingUnits(lessonData.teachingUnits || []);
          setEyfsStatements(lessonData.eyfsStatements || {});
          console.log(`Loaded ${currentSheetInfo.sheet} data from server`);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn(`Server data fetch failed for ${currentSheetInfo.sheet}, trying localStorage:`, error);
      }
      
      // Try to load from localStorage as fallback
      const savedData = localStorage.getItem(`lesson-data-${currentSheetInfo.sheet}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAllLessonsData(parsedData.allLessonsData || {});
        setLessonNumbers(parsedData.lessonNumbers || []);
        setTeachingUnits(parsedData.teachingUnits || []);
        setEyfsStatements(parsedData.eyfsStatements || {});
        console.log(`Loaded ${currentSheetInfo.sheet} data from localStorage`);
        
        // Save to server for future use
        try {
          await lessonsApi.updateSheet(currentSheetInfo.sheet, parsedData);
          console.log(`Migrated ${currentSheetInfo.sheet} data to server`);
        } catch (serverError) {
          console.warn(`Failed to migrate ${currentSheetInfo.sheet} data to server:`, serverError);
        }
      } else {
        // If no saved data, load sample data
        await loadSampleData();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Load sample data as fallback
      await loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      console.log(`Loading sample data for ${currentSheetInfo.sheet}`);
      const sheetData = SAMPLE_DATA[currentSheetInfo.sheet as keyof typeof SAMPLE_DATA];
      
      if (sheetData && sheetData.length > 0) {
        await processSheetData(sheetData);
        console.log(`Successfully loaded sample data for ${currentSheetInfo.sheet}`);
      } else {
        throw new Error(`No sample data available for ${currentSheetInfo.sheet}`);
      }
    } catch (error) {
      console.error(`Sample data loading failed for ${currentSheetInfo.sheet}:`, error);
      
      // Set minimal fallback data
      setLessonNumbers(['1']);
      setTeachingUnits(['Welcome', 'Goodbye']);
      setAllLessonsData({
        '1': {
          grouped: {
            'Welcome': [{
              activity: 'Sample Activity',
              description: `This is a sample activity for ${currentSheetInfo.display}.`,
              time: 5,
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
          totalTime: 5,
          eyfsStatements: [],
          title: 'Sample Lesson'
        }
      });
      setEyfsStatements({});
    }
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

  const processSheetData = async (sheetData: string[][]) => {
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
          _id: `${currentSheetInfo.sheet}-${activityName}-${category}-${Date.now()}`,
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
        
        // Also add to server
        try {
          await activitiesApi.create(activity);
        } catch (error) {
          console.warn('Failed to add activity to server:', error);
        }
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

        // Generate a title for the lesson based on its content
        const title = generateDefaultLessonTitle({
          grouped,
          categoryOrder,
          totalTime,
          eyfsStatements: []
        });

        lessonsData[lessonNum] = {
          grouped,
          categoryOrder,
          totalTime,
          eyfsStatements: [],
          title // Add the generated title
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

      // Save data to server and localStorage
      await saveDataToServer(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), eyfsStatementsMap);
      saveDataToLocalStorage(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), eyfsStatementsMap);

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
          eyfsStatements: [],
          title: 'Error Loading Lesson'
        }
      });
      setEyfsStatements({});
    }
  };

  const saveDataToServer = async (
    lessonsData: Record<string, LessonData>, 
    lessonNums: string[], 
    categories: string[],
    eyfsStatementsData: Record<string, string[]>
  ) => {
    const dataToSave = {
      allLessonsData: lessonsData,
      lessonNumbers: lessonNums,
      teachingUnits: categories,
      eyfsStatements: eyfsStatementsData
    };
    
    try {
      await lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave);
      console.log(`Saved ${currentSheetInfo.sheet} data to server`);
    } catch (error) {
      console.error(`Failed to save ${currentSheetInfo.sheet} data to server:`, error);
    }
  };

  const saveDataToLocalStorage = (
    lessonsData: Record<string, LessonData>, 
    lessonNums: string[], 
    categories: string[],
    eyfsStatementsData: Record<string, string[]>
  ) => {
    const dataToSave = {
      allLessonsData: lessonsData,
      lessonNumbers: lessonNums,
      teachingUnits: categories,
      eyfsStatements: eyfsStatementsData
    };
    
    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
    console.log(`Saved ${currentSheetInfo.sheet} data to localStorage (backup)`);
  };

  const uploadExcelFile = async (file: File) => {
    try {
      setLoading(true);
      
      // Read the Excel file
      const data = await readExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in the file.');
      }
      
      console.log('Excel data loaded:', data.slice(0, 5)); // Log first 5 rows
      
      // Process the data
      await processSheetData(data);
      
      return true;
    } catch (error) {
      console.error('Excel upload failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file.'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          resolve(jsonData as string[][]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file.'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const refreshData = async () => {
    await loadData();
  };

  // Add EYFS statement to a lesson
  const addEyfsToLesson = async (lessonNumber: string, eyfsStatement: string) => {
    setEyfsStatements(prev => {
      const updatedStatements = { ...prev };
      if (!updatedStatements[lessonNumber]) {
        updatedStatements[lessonNumber] = [];
      }
      if (!updatedStatements[lessonNumber].includes(eyfsStatement)) {
        updatedStatements[lessonNumber] = [...updatedStatements[lessonNumber], eyfsStatement];
      }
      
      // Save to server
      saveDataToServer(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Save to localStorage as backup
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
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
  const removeEyfsFromLesson = async (lessonNumber: string, eyfsStatement: string) => {
    setEyfsStatements(prev => {
      const updatedStatements = { ...prev };
      if (updatedStatements[lessonNumber]) {
        updatedStatements[lessonNumber] = updatedStatements[lessonNumber].filter(
          statement => statement !== eyfsStatement
        );
      }
      
      // Save to server
      saveDataToServer(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Save to localStorage as backup
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
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

  // Update all EYFS statements
  const updateAllEyfsStatements = async (statements: string[]) => {
    setAllEyfsStatements(statements);
    
    // Save to server
    try {
      await eyfsApi.updateSheet(currentSheetInfo.sheet, {
        allStatements: statements,
        structuredStatements: structureEyfsStatements(statements)
      });
    } catch (error) {
      console.error('Failed to save EYFS statements to server:', error);
    }
    
    // Save to localStorage as backup
    localStorage.setItem(`eyfs-statements-flat-${currentSheetInfo.sheet}`, JSON.stringify(statements));
    localStorage.setItem(`eyfs-standards-${currentSheetInfo.sheet}`, JSON.stringify(structureEyfsStatements(statements)));
  };

  // Update lesson title
  const updateLessonTitle = (lessonNumber: string, title: string) => {
    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber]) {
        updatedLessonsData[lessonNumber] = {
          ...updatedLessonsData[lessonNumber],
          title
        };
        
        // Save to server and localStorage
        saveDataToServer(
          updatedLessonsData,
          lessonNumbers,
          teachingUnits,
          eyfsStatements
        );
        
        saveDataToLocalStorage(
          updatedLessonsData,
          lessonNumbers,
          teachingUnits,
          eyfsStatements
        );
      }
      return updatedLessonsData;
    });
  };

  // Helper to structure EYFS statements by area
  const structureEyfsStatements = (statements: string[]) => {
    const structuredStatements: Record<string, string[]> = {};
    statements.forEach(statement => {
      const parts = statement.split(':');
      const area = parts[0].trim();
      const detail = parts.length > 1 ? parts[1].trim() : statement;
      
      if (!structuredStatements[area]) {
        structuredStatements[area] = [];
      }
      
      structuredStatements[area].push(detail);
    });
    return structuredStatements;
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
    removeEyfsFromLesson,
    updateAllEyfsStatements,
    updateLessonTitle
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}