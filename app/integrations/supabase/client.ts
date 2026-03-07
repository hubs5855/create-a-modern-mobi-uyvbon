
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './types';

// Read Supabase credentials from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║  ❌ SUPABASE CONFIGURATION ERROR                               ║
╠════════════════════════════════════════════════════════════════╣
║  Missing required environment variables:                       ║
║  - EXPO_PUBLIC_SUPABASE_URL                                    ║
║  - EXPO_PUBLIC_SUPABASE_ANON_KEY                               ║
║                                                                 ║
║  Please ensure your .env file exists with these variables.     ║
╚════════════════════════════════════════════════════════════════╝
  `;
  console.error(errorMessage);
  
  if (__DEV__) {
    throw new Error('Supabase credentials missing. Check your .env file and restart the app.');
  }
}

// Define a simple in-memory storage for fallback
class InMemoryStorage {
  private data: { [key: string]: string } = {};

  async getItem(key: string): Promise<string | null> {
    return this.data[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.data[key];
  }
}

// Determine which storage to use based on platform
const getStorageAdapter = () => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      return {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
      };
    } else if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      // Use AsyncStorage for native
      return AsyncStorage;
    } else {
      // Fallback to in-memory storage
      console.warn('⚠️ AsyncStorage not available, using in-memory storage. Sessions will not persist.');
      return new InMemoryStorage();
    }
  } catch (error) {
    console.warn('⚠️ Error detecting storage adapter:', error);
    return new InMemoryStorage();
  }
};

// Create and export the Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_ANON_KEY || '', 
  {
    auth: {
      storage: getStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

console.log('✅ Supabase client initialized successfully');

export default supabase;
