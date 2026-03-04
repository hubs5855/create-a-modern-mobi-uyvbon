
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './types';

const SUPABASE_URL = "https://dnweopctkrhuuepfadij.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud2VvcGN0a3JodXVlcGZhZGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI2OTIsImV4cCI6MjA4ODEwODY5Mn0.rN0NviHd3Xm6kGtYvxyEUuhJVrP7600Q0CrMvvIYI4g";

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
    console.log('Supabase: Using localStorage for web');
  } else if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
    // Use AsyncStorage for native if available and functional
    storageAdapter = AsyncStorage;
    console.log('Supabase: Using AsyncStorage for native');
  } else {
    // Fallback to in-memory storage if AsyncStorage is null or not functional
    console.warn('AsyncStorage is null or not functional, falling back to in-memory storage for Supabase client. Sessions will not persist across app restarts.');
    storageAdapter = new InMemoryStorage();
  }
} catch (error) {
  // If any error occurs during storage detection, use in-memory storage
  console.warn('Error detecting storage adapter, falling back to in-memory storage:', error);
  storageAdapter = new InMemoryStorage();
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
