
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@/types/supabase';

// Supabase project credentials
const SUPABASE_URL = 'https://dnweopctkrhuuepfadij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud2VvcGN0a3JodXVlcGZhZGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI2OTIsImV4cCI6MjA4ODEwODY5Mn0.rN0NviHd3Xm6kGtYvxyEUuhJVrP7600Q0CrMvvIYI4g';

// In-memory storage fallback for when AsyncStorage is unavailable
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

// Create storage adapter function
function createSupabaseStorage() {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      return {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
      };
    } else {
      // For native platforms, test AsyncStorage before using it
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        // Wrap AsyncStorage with error handling
        return {
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
      } else {
        // Fallback to in-memory storage if AsyncStorage is null or not functional
        console.warn('⚠️ AsyncStorage unavailable, using in-memory storage. Sessions will not persist.');
        return new InMemoryStorage();
      }
    }
  } catch (error) {
    // If any error occurs during storage detection, use in-memory storage
    console.warn('⚠️ Error creating storage adapter, using in-memory storage:', error);
    return new InMemoryStorage();
  }
}

// Create Supabase client with proper configuration
const supabaseClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: createSupabaseStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

console.log('✅ Supabase client initialized successfully');

export const supabase = supabaseClient;
export default supabase;
