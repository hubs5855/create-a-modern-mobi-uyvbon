
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import { supabase } from '@/app/integrations/supabase/client';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('LocationTracking: Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (!location) {
      console.log('LocationTracking: No location data received');
      return;
    }

    console.log('LocationTracking: Background location update:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(location.timestamp).toISOString(),
    });

    try {
      // Get the active session ID from storage
      const sessionId = await getActiveSessionId();
      
      if (!sessionId) {
        console.log('LocationTracking: No active session ID found');
        return;
      }

      // Get battery level
      const batteryLevelValue = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevelValue * 100);

      // Calculate speed in km/h
      const speedKmh = location.coords.speed ? location.coords.speed * 3.6 : 0;

      console.log('LocationTracking: Inserting location to Supabase for session:', sessionId);

      // Insert location to Supabase
      const { error: insertError } = await supabase
        .from('locations')
        .insert({
          session_id: sessionId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: speedKmh,
          battery_level: batteryPercentage,
        });

      if (insertError) {
        console.error('LocationTracking: Error inserting location:', insertError);
      } else {
        console.log('LocationTracking: Location inserted successfully');
      }
    } catch (error) {
      console.error('LocationTracking: Exception in background task:', error);
    }
  }
});

// Helper to store active session ID
export async function setActiveSessionId(sessionId: string | null) {
  try {
    if (sessionId) {
      console.log('LocationTracking: Storing active session ID:', sessionId);
      // Store in a global variable that persists across app states
      (global as any).__ACTIVE_SESSION_ID__ = sessionId;
    } else {
      console.log('LocationTracking: Clearing active session ID');
      (global as any).__ACTIVE_SESSION_ID__ = null;
    }
  } catch (error) {
    console.error('LocationTracking: Error setting active session ID:', error);
  }
}

// Helper to get active session ID
export async function getActiveSessionId(): Promise<string | null> {
  try {
    const sessionId = (global as any).__ACTIVE_SESSION_ID__ || null;
    console.log('LocationTracking: Retrieved active session ID:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('LocationTracking: Error getting active session ID:', error);
    return null;
  }
}

// Start foreground location tracking
export async function startForegroundLocationTracking(sessionId: string): Promise<boolean> {
  console.log('LocationTracking: Starting foreground location tracking for session:', sessionId);

  try {
    // Request foreground permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.log('LocationTracking: Foreground location permission denied');
      return false;
    }

    console.log('LocationTracking: Foreground location permission granted');

    // Request background permissions
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      console.log('LocationTracking: Background location permission denied, will use foreground only');
    } else {
      console.log('LocationTracking: Background location permission granted');
    }

    // Store the session ID
    await setActiveSessionId(sessionId);

    // Check if task is already registered
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    console.log('LocationTracking: Task defined:', isTaskDefined);

    // Start location updates with high accuracy
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Update every 5 seconds
      distanceInterval: 10, // Or when moved 10 meters
      foregroundService: {
        notificationTitle: 'TrackMe LK',
        notificationBody: 'Live location tracking is active',
        notificationColor: '#00D4FF',
      },
      pausesUpdatesAutomatically: false, // Keep tracking even when stationary
      showsBackgroundLocationIndicator: true, // Show blue bar on iOS
    });

    console.log('LocationTracking: Foreground location tracking started successfully');
    return true;
  } catch (error) {
    console.error('LocationTracking: Error starting foreground location tracking:', error);
    return false;
  }
}

// Stop foreground location tracking
export async function stopForegroundLocationTracking(): Promise<void> {
  console.log('LocationTracking: Stopping foreground location tracking');

  try {
    // Check if task is running
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    if (hasStarted) {
      console.log('LocationTracking: Stopping location updates task');
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } else {
      console.log('LocationTracking: Location updates task was not running');
    }

    // Clear the session ID
    await setActiveSessionId(null);

    console.log('LocationTracking: Foreground location tracking stopped successfully');
  } catch (error) {
    console.error('LocationTracking: Error stopping foreground location tracking:', error);
  }
}

// Check if location tracking is active
export async function isLocationTrackingActive(): Promise<boolean> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('LocationTracking: Is tracking active:', hasStarted);
    return hasStarted;
  } catch (error) {
    console.error('LocationTracking: Error checking if tracking is active:', error);
    return false;
  }
}
