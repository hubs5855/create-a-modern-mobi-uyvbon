
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_SESSION_KEY = '@trackme_active_session';

export interface ActiveSessionInfo {
  id: string;
  type: 'delivery' | 'personal_safety';
  trackingCode: string;
  startedAt: string;
}

/**
 * Save the active tracking session to local storage
 */
export async function setActiveTrackingSession(session: ActiveSessionInfo): Promise<void> {
  try {
    console.log('TrackingSessionManager: Saving active session:', session.id, session.type);
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    console.log('TrackingSessionManager: Active session saved successfully');
  } catch (error) {
    console.error('TrackingSessionManager: Error saving active session:', error);
    throw error;
  }
}

/**
 * Get the active tracking session from local storage
 */
export async function getActiveTrackingSession(): Promise<ActiveSessionInfo | null> {
  try {
    console.log('TrackingSessionManager: Retrieving active session...');
    const sessionString = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
    
    if (!sessionString) {
      console.log('TrackingSessionManager: No active session found');
      return null;
    }
    
    const session = JSON.parse(sessionString) as ActiveSessionInfo;
    console.log('TrackingSessionManager: Active session found:', session.id, session.type);
    return session;
  } catch (error) {
    console.error('TrackingSessionManager: Error retrieving active session:', error);
    return null;
  }
}

/**
 * Clear the active tracking session from local storage
 */
export async function clearActiveTrackingSession(): Promise<void> {
  try {
    console.log('TrackingSessionManager: Clearing active session...');
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    console.log('TrackingSessionManager: Active session cleared successfully');
  } catch (error) {
    console.error('TrackingSessionManager: Error clearing active session:', error);
    throw error;
  }
}
