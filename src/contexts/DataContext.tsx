import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { activitiesApi, lessonsApi, eyfsApi } from '../config/api';

export interface Activity {
  _id?: string;
  activity: string;
  description: string;
  activityText?: string; // New field for activity text
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

// Interface for user-created lesson plans
export interface LessonPlan {
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
  unitId?: string;
  unitName?: string;
  lessonNumber?: string;
  createdAt: Date;
  updatedAt: Date;
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
  updateLessonTitle: (lessonNumber: string, title: string) => void;
  userCreatedLessonPlans: LessonPlan[];
  addOrUpdateUserLessonPlan: (lessonPlan: LessonPlan) => void;
  deleteUserLessonPlan: (lessonPlanId: string) => void;
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
  'Teaching Units',
  'Kodaly Rhythms',
  'Kodaly Games',
  'IWB Games'
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

// Convert LessonPlan to LessonData
const convertLessonPlanToLessonData = (lessonPlan: LessonPlan): LessonData => {
  // Group activities by category
  const grouped: Record<string, Activity[]> = {};
  const categoriesInLesson = new Set<string>();
  let totalTime = 0;

  lessonPlan.activities.forEach(activity => {
    if (!grouped[activity.category]) {
      grouped[activity.category] = [];
    }
    grouped[activity.category].push(activity);
    categoriesInLesson.add(activity.category);
    totalTime += activity.time || 0;
  });

  // Sort categories according to the predefined order
  const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));

  return {
    grouped,
    categoryOrder,
    totalTime,
    title: lessonPlan.title || `Lesson ${lessonPlan.lessonNumber || ''}`,
    eyfsStatements: []
  };
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
  const [userCreatedLessonPlans, setUserCreatedLessonPlans] = useState<LessonPlan[]>([]);

  useEffect(() => {
    loadData();
    // Load EYFS statements
    loadEyfsStatements();
    // Load user-created lesson plans
    loadUserCreatedLessonPlans();
  }, [currentSheetInfo]);

  const loadUserCreatedLessonPlans = () => {
    try {
      const savedPlans = localStorage.getItem('lesson-plans');
      if (savedPlans) {
        const plans = JSON.parse(savedPlans).map((plan: any) => ({
          ...plan,
          date: new Date(plan.date),
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt),
        }));
        setUserCreatedLessonPlans(plans);
      }
    } catch (error) {
      console.error('Failed to load user-created lesson plans:', error);
      setUserCreatedLessonPlans([]);
    }
  };

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
      
      // Step 1: Load Excel-based lesson data
      let excelLessonsData: Record<string, LessonData> = {};
      let excelLessonNumbers: string[] = [];
      let excelTeachingUnits: string[] = [];
      let excelEyfsStatements: Record<string, string[]> = {};
      
      // Try to load from server
      try {
        const lessonData = await lessonsApi.getBySheet(currentSheetInfo.sheet);
        if (lessonData && Object.keys(lessonData).length > 0) {
          excelLessonsData = lessonData.allLessonsData || {};
          excelLessonNumbers = lessonData.lessonNumbers || [];
          excelTeachingUnits = lessonData.teachingUnits || [];
          excelEyfsStatements = lessonData.eyfsStatements || {};
          console.log(`Loaded ${currentSheetInfo.sheet} data from server`);
        }
      } catch (error) {
        console.warn(`Server data fetch failed for ${currentSheetInfo.sheet}, trying localStorage:`, error);
        
        // Try to load from localStorage as fallback
        const savedData = localStorage.getItem(`lesson-data-${currentSheetInfo.sheet}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          excelLessonsData = parsedData.allLessonsData || {};
          excelLessonNumbers = parsedData.lessonNumbers || [];
          excelTeachingUnits = parsedData.teachingUnits || [];
          excelEyfsStatements = parsedData.eyfsStatements || {};
          console.log(`Loaded ${currentSheetInfo.sheet} data from localStorage`);
        } else {
          // If no saved data, load sample data
          await loadSampleData();
          return;
        }
      }
      
      // Step 2: Process user-created lesson plans
      const userLessonData: Record<string, LessonData> = {};
      const userLessonNumbers: string[] = [];
      
      // Filter lesson plans for the current class
      const relevantLessonPlans = userCreatedLessonPlans.filter(
        plan => plan.className === currentSheetInfo.sheet && plan.lessonNumber
      );
      
      // Convert each lesson plan to lesson data
      relevantLessonPlans.forEach(plan => {
        if (plan.lessonNumber) {
          userLessonData[plan.lessonNumber] = convertLessonPlanToLessonData(plan);
          if (!userLessonNumbers.includes(plan.lessonNumber)) {
            userLessonNumbers.push(plan.lessonNumber);
          }
        }
      });
      
      // Step 3: Merge Excel-based and user-created lesson data
      const mergedLessonsData = { ...excelLessonsData, ...userLessonData };
      
      // Merge lesson numbers and sort them
      const mergedLessonNumbers = [...new Set([...excelLessonNumbers, ...userLessonNumbers])]
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      // Update state with merged data
      setAllLessonsData(mergedLessonsData);
      setLessonNumbers(mergedLessonNumbers);
      setTeachingUnits(excelTeachingUnits);
      setEyfsStatements(excelEyfsStatements);
      
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
        const processedData = processSheetDataHelper(sheetData);
        
        setLessonNumbers(processedData.lessonNumbers);
        setTeachingUnits(processedData.teachingUnits);
        setAllLessonsData(processedData.lessonsData);
        setEyfsStatements(processedData.eyfsStatementsMap);
        
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

  const processSheetDataHelper = (sheetData: string[][]) => {
    if (!sheetData || sheetData.length === 0) {
      throw new Error(`No sheet data provided for ${currentSheetInfo.sheet}`);
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
    }

    console.log(`Processed ${currentSheetInfo.sheet} activities:`, activities.length);
    console.log(`${currentSheetInfo.sheet} lesson numbers found:`, Array.from(lessonNumbersSet));
    console.log(`${currentSheetInfo.sheet} categories found:`, Array.from(categoriesSet));

    // Set lesson numbers and teaching units
    const sortedLessonNumbers = Array.from(lessonNumbersSet)
      .filter(num => num && !isNaN(parseInt(num)))
      .sort((a, b) => parseInt(a) - parseInt(b));
    
    const sortedCategories = Array.from(categoriesSet).sort();

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

    // Set EYFS statements for each lesson
    const eyfsStatementsMap: Record<string, string[]> = {};
    sortedLessonNumbers.forEach(lessonNum => {
      eyfsStatementsMap[lessonNum] = [];
    });

    return {
      lessonsData,
      lessonNumbers: sortedLessonNumbers,
      teachingUnits: sortedCategories,
      eyfsStatementsMap
    };
  };

  const processSheetData = async (sheetData: string[][]) => {
    try {
      const processedData = processSheetDataHelper(sheetData);
      
      setLessonNumbers(processedData.lessonNumbers);
      setTeachingUnits(processedData.teachingUnits);
      setAllLessonsData(processedData.lessonsData);
      setEyfsStatements(processedData.eyfsStatementsMap);

      // Save data to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        processedData.lessonsData, 
        processedData.lessonNumbers, 
        processedData.teachingUnits, 
        processedData.eyfsStatementsMap
      );
      
      // Then try to save to server (this might fail, but we already have local backup)
      try {
        await saveDataToServer(
          processedData.lessonsData, 
          processedData.lessonNumbers, 
          processedData.teachingUnits, 
          processedData.eyfsStatementsMap
        );
      } catch (error) {
        console.warn(`Failed to save ${currentSheetInfo.sheet} data to server, but data is saved locally:`, error);
      }

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
      
      // Save minimal data to localStorage
      saveDataToLocalStorage(
        {
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
        },
        ['1'],
        ['Welcome', 'Goodbye'],
        {}
      );
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
      return true;
    } catch (error) {
      console.warn(`Failed to save ${currentSheetInfo.sheet} data to server:`, error);
      // Don't throw the error, just return false to indicate failure
      return false;
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
    return true;
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
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Try to save to server, but don't block the UI
      saveDataToServer(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      ).catch(error => console.warn('Failed to save EYFS statements to server:', error));
      
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
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Try to save to server, but don't block the UI
      saveDataToServer(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      ).catch(error => console.warn('Failed to save EYFS statements to server:', error));
      
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
    
    // Save to localStorage first
    localStorage.setItem(`eyfs-statements-flat-${currentSheetInfo.sheet}`, JSON.stringify(statements));
    localStorage.setItem(`eyfs-standards-${currentSheetInfo.sheet}`, JSON.stringify(structureEyfsStatements(statements)));
    
    // Try to save to server, but don't block the UI
    try {
      eyfsApi.updateSheet(currentSheetInfo.sheet, {
        allStatements: statements,
        structuredStatements: structureEyfsStatements(statements)
      }).catch(error => console.warn('Failed to save EYFS statements to server:', error));
    } catch (error) {
      console.error('Failed to save EYFS statements to server:', error);
    }
  };

  // Update lesson title
  const updateLessonTitle = (lessonNumber: string, title: string) => {
    // First check if this is a user-created lesson
    const userLessonPlan = userCreatedLessonPlans.find(
      plan => plan.lessonNumber === lessonNumber && plan.className === currentSheetInfo.sheet
    );
    
    if (userLessonPlan) {
      // Update the user-created lesson plan
      const updatedPlan = {
        ...userLessonPlan,
        title,
        updatedAt: new Date()
      };
      addOrUpdateUserLessonPlan(updatedPlan);
    } else {
      // Update the Excel-based lesson
      setAllLessonsData(prev => {
        const updatedLessonsData = { ...prev };
        if (updatedLessonsData[lessonNumber]) {
          updatedLessonsData[lessonNumber] = {
            ...updatedLessonsData[lessonNumber],
            title
          };
          
          // Save to localStorage first (this is guaranteed to work)
          saveDataToLocalStorage(
            updatedLessonsData,
            lessonNumbers,
            teachingUnits,
            eyfsStatements
          );
          
          // Try to save to server, but don't block the UI
          saveDataToServer(
            updatedLessonsData,
            lessonNumbers,
            teachingUnits,
            eyfsStatements
          ).catch(error => console.warn('Failed to save lesson title to server:', error));
        }
        return updatedLessonsData;
      });
    }
  };

  // Add or update a user-created lesson plan
  const addOrUpdateUserLessonPlan = (lessonPlan: LessonPlan) => {
    setUserCreatedLessonPlans(prev => {
      // Check if the plan already exists
      const existingPlanIndex = prev.findIndex(plan => plan.id === lessonPlan.id);
      
      let updatedPlans;
      if (existingPlanIndex >= 0) {
        // Update existing plan
        updatedPlans = [...prev];
        updatedPlans[existingPlanIndex] = {
          ...lessonPlan,
          updatedAt: new Date()
        };
      } else {
        // Add new plan
        updatedPlans = [...prev, {
          ...lessonPlan,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }
      
      // Save to localStorage
      localStorage.setItem('lesson-plans', JSON.stringify(updatedPlans));
      
      return updatedPlans;
    });
    
    // Reload data to update allLessonsData with the new/updated lesson plan
    loadData();
  };

  // Delete a user-created lesson plan
  const deleteUserLessonPlan = (lessonPlanId: string) => {
    setUserCreatedLessonPlans(prev => {
      const updatedPlans = prev.filter(plan => plan.id !== lessonPlanId);
      
      // Save to localStorage
      localStorage.setItem('lesson-plans', JSON.stringify(updatedPlans));
      
      return updatedPlans;
    });
    
    // Reload data to update allLessonsData without the deleted lesson plan
    loadData();
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
    updateLessonTitle,
    userCreatedLessonPlans,
    addOrUpdateUserLessonPlan,
    deleteUserLessonPlan
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}