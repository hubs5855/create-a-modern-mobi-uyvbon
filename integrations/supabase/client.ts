
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://dnigrhbebdlwiicjnxnf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaWdyaGJlYmRsd2lpY2pueG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODE4MzIsImV4cCI6MjA4ODU1NzgzMn0.TE1d8qY2ewfUC7jRzm7_XSdNWjkFnWzk3tkHTM8iRDY";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Supabase client initializing with URL:', SUPABASE_URL);

// Create a safe storage adapter that handles AsyncStorage errors gracefully
const SafeAsyncStorage = {
  getItem: async (key: string) => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        console.warn('Supabase: AsyncStorage not available');
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Supabase: Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.setItem !== 'function') {
        console.warn('Supabase: AsyncStorage not available');
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Supabase: Error writing to AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== 'function') {
        console.warn('Supabase: AsyncStorage not available');
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Supabase: Error removing from AsyncStorage:', error);
    }
  },
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: SafeAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
