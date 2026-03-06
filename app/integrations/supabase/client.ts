
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';

// Log environment variable status for debugging
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// මෙතන URL එක සහ KEY එක ලියන්න
const SUPABASE_URL = "https://ඔයාගේ_ප්‍රොජෙක්ට්_එකේ_URL_එක.supabase.co";
const SUPABASE_ANON_KEY = "ඔයාගේ_සැබෑ_ANON_KEY_එක_මෙහි_ලියන්න";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
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

// Validate environment variables and create client
let supabaseClient;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ CRITICAL ERROR: Supabase environment variables are missing!');
  console.error('Please ensure .env file exists with:');
  console.error({
    EXPO_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key'
  });
  
  // Create a dummy client that will fail gracefully
  const dummyStorage = new InMemoryStorage();
  supabaseClient = createClient<Database>(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        storage: dummyStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
  
  // Log error but don't throw immediately to prevent React state update warning
  console.error('⚠️ Supabase client created with placeholder values. App functionality will be limited.');
} else {
  // Create Supabase client with proper configuration
  supabaseClient = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
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
  console.log('📍 Project URL:', SUPABASE_URL);
}

export const supabase = supabaseClient;
export default supabase;
