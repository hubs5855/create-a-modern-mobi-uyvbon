
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Client Initialization');
console.log('SUPABASE_URL:', SUPABASE_URL ? 'Set ✅' : 'Missing ❌');
console.log('SUPABASE_PUBLISHABLE_KEY:', SUPABASE_PUBLISHABLE_KEY ? 'Set ✅' : 'Missing ❌');

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ CRITICAL ERROR: Supabase environment variables are missing!');
  console.error('Please ensure .env file exists with:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

// In-memory storage fallback for when AsyncStorage is unavailable
class InMemoryStorage {
  private data: { [key: string]: string } = {};

  async getItem(key: string): Promise<string | null> {
    console.log('InMemoryStorage: getItem', key);
    return this.data[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    console.log('InMemoryStorage: setItem', key);
    this.data[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    console.log('InMemoryStorage: removeItem', key);
    delete this.data[key];
  }
}

// Determine which storage to use based on platform and AsyncStorage availability
let storageAdapter: any;

try {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    storageAdapter = {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
    console.log('✅ Supabase: Using localStorage for web');
  } else {
    // For native platforms, test AsyncStorage before using it
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      // Wrap AsyncStorage with error handling
      storageAdapter = {
        getItem: async (key: string) => {
          try {
            return await AsyncStorage.getItem(key);
          } catch (error) {
            console.warn('AsyncStorage getItem error:', error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await AsyncStorage.setItem(key, value);
          } catch (error) {
            console.warn('AsyncStorage setItem error:', error);
          }
        },
        removeItem: async (key: string) => {
          try {
            await AsyncStorage.removeItem(key);
          } catch (error) {
            console.warn('AsyncStorage removeItem error:', error);
          }
        },
      };
      console.log('✅ Supabase: Using AsyncStorage for native (with error handling)');
    } else {
      // Fallback to in-memory storage if AsyncStorage is null or not functional
      console.warn('⚠️ AsyncStorage is null or not functional, falling back to in-memory storage for Supabase client. Sessions will not persist across app restarts.');
      storageAdapter = new InMemoryStorage();
    }
  }
} catch (error) {
  // If any error occurs during storage detection, use in-memory storage
  console.warn('⚠️ Error detecting storage adapter, falling back to in-memory storage:', error);
  storageAdapter = new InMemoryStorage();
}

// Create Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

console.log('✅ Supabase client initialized successfully');

export default supabase;
