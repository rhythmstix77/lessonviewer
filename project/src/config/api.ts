// API Configuration for Excel/Google Sheets Integration
export const API_CONFIG = {
  // Google Sheets API Configuration
  GOOGLE_SHEETS: {
    // Using your specific spreadsheet ID
    SPREADSHEET_ID: '1okYlUMh247SKXtdkot1swOs2BCYlZMEN-3E08-zit2U',
    // Different GIDs for each class
    SHEET_GIDS: {
      'LKG': '1944781789',      // Lower Kindergarten sheet
      'UKG': '0',               // Upper Kindergarten sheet (usually first sheet)
      'Reception': '123456789'   // Reception sheet - you'll need to provide the actual GID
    },
    // Public access - no API key needed for public sheets
    RANGE: 'A:K', // Adjust based on your sheet structure
  },
  
  // WordPress API Configuration
  WORDPRESS: {
    BASE_URL: import.meta.env.VITE_WORDPRESS_URL || 'https://your-wordpress-site.com',
    API_ENDPOINT: '/wp-json/wp/v2',
    AUTH_ENDPOINT: '/wp-json/jwt-auth/v1/token',
    VALIDATE_ENDPOINT: '/wp-json/jwt-auth/v1/token/validate',
  },
  
  // Alternative: Direct Excel file processing
  EXCEL: {
    UPLOAD_ENDPOINT: '/api/upload-excel',
    PROCESS_ENDPOINT: '/api/process-excel',
  }
};

// Create a timeout signal that's compatible with all browsers
const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

// Multiple CORS proxy services for better reliability
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Google Sheets CSV export helper (for public sheets) - NOW SUPPORTS DIFFERENT TABS
export const fetchGoogleSheetData = async (sheetType: 'LKG' | 'UKG' | 'Reception' = 'LKG') => {
  const { SPREADSHEET_ID, SHEET_GIDS } = API_CONFIG.GOOGLE_SHEETS;
  
  // Get the correct GID for the selected sheet type
  const gid = SHEET_GIDS[sheetType];
  
  console.log(`Fetching data for ${sheetType} sheet with GID: ${gid}`);
  
  // Use CSV export URL for the specific sheet tab
  const directCsvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  
  let lastError: Error | null = null;
  
  // Try each CORS proxy service
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    let corsProxyUrl: string;
    
    // Different proxies have different URL formats
    if (proxy.includes('allorigins.win')) {
      corsProxyUrl = `${proxy}${encodeURIComponent(directCsvUrl)}`;
    } else if (proxy.includes('codetabs.com')) {
      corsProxyUrl = `${proxy}${encodeURIComponent(directCsvUrl)}`;
    } else {
      corsProxyUrl = `${proxy}${directCsvUrl}`;
    }
    
    try {
      console.log(`Attempting to fetch ${sheetType} data from proxy ${i + 1}/${CORS_PROXIES.length}:`, proxy);
      
      const response = await fetch(corsProxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,application/json,text/plain,*/*',
        },
        // Add timeout to prevent hanging
        signal: createTimeoutSignal(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let csvText: string;
      
      // Handle different response formats from different proxies
      if (proxy.includes('allorigins.win')) {
        const jsonResponse = await response.json();
        if (!jsonResponse.contents) {
          throw new Error('No data received from proxy');
        }
        csvText = jsonResponse.contents;
      } else {
        csvText = await response.text();
      }
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Empty response received');
      }
      
      console.log(`Successfully fetched ${sheetType} data using proxy ${i + 1}. CSV length:`, csvText.length);
      
      // Parse CSV into array format
      const lines = csvText.split('\n');
      const data = lines.map(line => parseCSVLine(line)).filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
      
      console.log(`Parsed ${sheetType} data rows:`, data.length);
      
      if (data.length === 0) {
        throw new Error(`No valid data rows found in ${sheetType} CSV`);
      }
      
      return data;
      
    } catch (error) {
      console.warn(`Proxy ${i + 1} failed for ${sheetType}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this isn't the last proxy, continue to the next one
      if (i < CORS_PROXIES.length - 1) {
        console.log(`Trying next proxy for ${sheetType}...`);
        continue;
      }
    }
  }
  
  // If all proxies failed, try direct access as a last resort
  try {
    console.log(`All proxies failed for ${sheetType}, attempting direct access...`);
    const response = await fetch(directCsvUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
      },
      signal: createTimeoutSignal(5000) // 5 second timeout for direct access
    });
    
    if (response.ok) {
      const csvText = await response.text();
      if (csvText && csvText.trim().length > 0) {
        console.log(`Direct access successful for ${sheetType}!`);
        const lines = csvText.split('\n');
        const data = lines.map(line => parseCSVLine(line)).filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
        return data;
      }
    }
  } catch (directError) {
    console.warn(`Direct access also failed for ${sheetType}:`, directError);
  }
  
  // All methods failed
  console.error(`All Google Sheets fetch methods failed for ${sheetType}. Last error:`, lastError);
  throw new Error(`Failed to fetch ${sheetType} Google Sheets data after trying ${CORS_PROXIES.length} different methods. Last error: ${lastError?.message || 'Unknown error'}`);
};

// Simple CSV parser that handles quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// WordPress API helper
export const wordpressAPI = {
  async authenticate(username: string, password: string) {
    const baseUrl = API_CONFIG.WORDPRESS.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${API_CONFIG.WORDPRESS.AUTH_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    return response.json();
  },
  
  async validateToken(token: string) {
    try {
      const baseUrl = API_CONFIG.WORDPRESS.BASE_URL;
      
      if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
        return false;
      }
      
      const response = await fetch(`${baseUrl}${API_CONFIG.WORDPRESS.VALIDATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
  
  async getUserInfo(token: string) {
    const baseUrl = API_CONFIG.WORDPRESS.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${API_CONFIG.WORDPRESS.API_ENDPOINT}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  }
};