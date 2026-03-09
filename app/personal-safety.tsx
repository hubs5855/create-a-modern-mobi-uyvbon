
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import Constants from 'expo-constants';
import {
  startForegroundLocationTracking,
  stopForegroundLocationTracking,
  isLocationTrackingActive,
} from '@/utils/locationTracking';

interface Favorite {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Helper function to get the tracking URL based on environment
function getTrackingUrl(trackingCode: string): string {
  // In production, use your custom domain
  // In development, use the Expo dev server URL
  if (__DEV__) {
    // For development, use the current app URL
    const expoUrl = Constants.expoConfig?.hostUri;
    if (expoUrl) {
      return `exp://${expoUrl}/track/${trackingCode}`;
    }
  }
  
  // Production URL - replace with your actual domain when deployed
  return `https://trackme.lk/track/${trackingCode}`;
}

export default function PersonalSafetyScreen() {
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState(3);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  console.log('PersonalSafetyScreen: Rendering, isTracking:', isTracking, 'sessionId:', sessionId);

  useEffect(() => {
    console.log('PersonalSafetyScreen: Component mounted, initializing...');
    checkAuth();
    const getBatteryLevel = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        const percentage = Math.round(level * 100);
        setBatteryLevel(percentage);
        console.log('PersonalSafetyScreen: Battery level:', percentage);
      } catch (error) {
        console.error('PersonalSafetyScreen: Error getting battery level:', error);
      }
    };
    getBatteryLevel();
    fetchFavorites();
    checkExistingTracking();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('PersonalSafetyScreen: User not authenticated');
        setUserId(null);
      } else {
        console.log('PersonalSafetyScreen: User authenticated:', user.id);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('PersonalSafetyScreen: Error checking auth:', error);
      setUserId(null);
    }
  };

  const checkExistingTracking = async () => {
    try {
      const isActive = await isLocationTrackingActive();
      console.log('PersonalSafetyScreen: Checking existing tracking, active:', isActive);
      
      if (isActive) {
        console.log('PersonalSafetyScreen: Found active tracking session');
        // You could restore the session state here if needed
      }
    } catch (error) {
      console.error('PersonalSafetyScreen: Error checking existing tracking:', error);
    }
  };

  // Real-time countdown timer - updates every second
  useEffect(() => {
    if (!expiresAt) {
      console.log('PersonalSafetyScreen: No expiry time, clearing countdown');
      setTimeRemaining(null);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      return;
    }

    console.log('PersonalSafetyScreen: Starting countdown timer for expiry:', expiresAt);

    const calculateTimeRemaining = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      
      console.log('PersonalSafetyScreen: Time remaining (ms):', remaining);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        console.log('PersonalSafetyScreen: Timer expired, stopping countdown');
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Then update every second
    countdownInterval.current = setInterval(calculateTimeRemaining, 1000);

    // Cleanup on unmount or when expiresAt changes
    return () => {
      console.log('PersonalSafetyScreen: Cleaning up countdown timer');
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [expiresAt]);

  const fetchFavorites = async () => {
    console.log('PersonalSafetyScreen: Fetching favorites from Supabase...');
    setLoadingFavorites(true);

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('PersonalSafetyScreen: Error fetching favorites:', error);
      } else {
        console.log('PersonalSafetyScreen: Favorites fetched successfully:', data?.length || 0, 'items');
        setFavorites(data || []);
      }
    } catch (error) {
      console.error('PersonalSafetyScreen: Exception fetching favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SAF';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('PersonalSafetyScreen: Generated tracking code:', code);
    return code;
  };

  const startTracking = async () => {
    console.log('PersonalSafetyScreen: User tapped Start Safe Tracking button');
    setLoading(true);

    try {
      console.log('PersonalSafetyScreen: Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('PersonalSafetyScreen: Current location:', location.coords.latitude, location.coords.longitude);

      const newTrackingCode = generateTrackingCode();
      const expiryTime = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      console.log('PersonalSafetyScreen: Creating personal safety session in Supabase...');
      console.log('PersonalSafetyScreen: Expiry time:', expiryTime.toISOString());

      // Build the insert object conditionally
      const insertData: any = {
        session_type: 'personal_safety',
        status: 'active',
        tracking_code: newTrackingCode,
        expiry_time: expiryTime.toISOString(),
      };

      // Only add user_id if authenticated
      if (userId) {
        insertData.user_id = userId;
        console.log('PersonalSafetyScreen: Adding user_id to session:', userId);
      } else {
        console.log('PersonalSafetyScreen: Creating anonymous session (no user_id)');
      }

      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .insert(insertData)
        .select()
        .single();

      if (sessionError) {
        console.error('PersonalSafetyScreen: Error creating session:', sessionError);
        Alert.alert('Error', 'Failed to start tracking: ' + sessionError.message);
        setLoading(false);
        return;
      }

      console.log('PersonalSafetyScreen: Session created successfully:', session.id);

      const batteryLevelValue = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevelValue * 100);
      setBatteryLevel(batteryPercentage);

      console.log('PersonalSafetyScreen: Inserting initial location...');
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          session_id: session.id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed ? location.coords.speed * 3.6 : null,
          battery_level: batteryPercentage,
        });

      if (locationError) {
        console.error('PersonalSafetyScreen: Error inserting initial location:', locationError);
      } else {
        console.log('PersonalSafetyScreen: Initial location inserted successfully');
      }

      setSessionId(session.id);
      setTrackingCode(newTrackingCode);
      setExpiresAt(expiryTime.toISOString());
      setIsTracking(true);

      console.log('PersonalSafetyScreen: Tracking started successfully!');
      console.log('PersonalSafetyScreen: Session ID:', session.id);
      console.log('PersonalSafetyScreen: Tracking Code:', newTrackingCode);
      console.log('PersonalSafetyScreen: Expires At:', expiryTime.toISOString());

      // Start foreground location tracking
      const trackingStarted = await startForegroundLocationTracking(session.id);
      
      if (!trackingStarted) {
        console.error('PersonalSafetyScreen: Failed to start foreground location tracking');
        Alert.alert(
          'Warning',
          'Location tracking may not work in the background. Please keep the app open for best results.'
        );
      } else {
        console.log('PersonalSafetyScreen: Foreground location tracking started successfully');
        Alert.alert(
          'Tracking Started',
          'Your location will continue to be tracked even when you navigate to other apps or Google Maps.'
        );
      }
    } catch (error) {
      console.error('PersonalSafetyScreen: Exception starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking');
    } finally {
      setLoading(false);
    }
  };

  const stopTracking = async () => {
    console.log('PersonalSafetyScreen: User tapped Stop Tracking button');
    
    // Stop foreground location tracking
    await stopForegroundLocationTracking();

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
      console.log('PersonalSafetyScreen: Countdown timer stopped');
    }

    if (sessionId) {
      try {
        console.log('PersonalSafetyScreen: Marking session as stopped in database...');
        const updateData: any = {
          status: 'stopped',
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('tracking_sessions')
          .update(updateData)
          .eq('id', sessionId);
        
        if (error) {
          console.error('PersonalSafetyScreen: Error stopping session:', error);
        } else {
          console.log('PersonalSafetyScreen: Session marked as stopped successfully');
        }
      } catch (error) {
        console.error('PersonalSafetyScreen: Exception stopping session:', error);
      }
    }
    
    setIsTracking(false);
    setSessionId(null);
    setTrackingCode(null);
    setExpiresAt(null);
    setTimeRemaining(null);
    console.log('PersonalSafetyScreen: Tracking stopped, state reset');
  };

  const handleSOS = async () => {
    console.log('PersonalSafetyScreen: User tapped Emergency SOS button');
    
    if (!sessionId) {
      console.log('PersonalSafetyScreen: No active session for SOS');
      return;
    }

    try {
      console.log('PersonalSafetyScreen: Getting current location for SOS...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('PersonalSafetyScreen: Inserting SOS location...');
      await supabase
        .from('locations')
        .insert({
          session_id: sessionId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed ? location.coords.speed * 3.6 : null,
          battery_level: batteryLevel,
        });

      console.log('PersonalSafetyScreen: Updating session status to SOS...');
      await supabase
        .from('tracking_sessions')
        .update({
          status: 'sos_triggered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      console.log('PersonalSafetyScreen: SOS triggered successfully');
      Alert.alert('Emergency SOS', 'Emergency SOS sent! Your emergency contacts have been notified.');
    } catch (error) {
      console.error('PersonalSafetyScreen: Error triggering SOS:', error);
      Alert.alert('Error', 'Failed to send SOS. Please try again.');
    }
  };

  const shareTrackingLink = async () => {
    if (!trackingCode) {
      console.log('PersonalSafetyScreen: No tracking code to share');
      return;
    }
    
    const trackingUrl = getTrackingUrl(trackingCode);
    console.log('PersonalSafetyScreen: User tapped Share button, sharing:', trackingUrl);

    try {
      await Share.share({
        message: `Track my live location:\n\nTracking Code: ${trackingCode}\n\n${trackingUrl}`,
        title: 'Track My Location',
      });
      console.log('PersonalSafetyScreen: Share sheet opened successfully');
    } catch (error) {
      console.error('PersonalSafetyScreen: Error sharing:', error);
    }
  };

  const shareViaWhatsApp = () => {
    if (!trackingCode) {
      console.log('PersonalSafetyScreen: No tracking code to share via WhatsApp');
      return;
    }
    
    const trackingUrl = getTrackingUrl(trackingCode);
    const message = `Track my live location:\n\nTracking Code: ${trackingCode}\n\n${trackingUrl}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    console.log('PersonalSafetyScreen: User tapped WhatsApp share button');
    Linking.openURL(whatsappUrl).catch(() => {
      console.log('PersonalSafetyScreen: WhatsApp not installed');
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  const handleNavigateToFavorite = (favorite: Favorite) => {
    console.log('PersonalSafetyScreen: User tapped favorite location:', favorite.label);
    
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${favorite.latitude},${favorite.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${favorite.latitude},${favorite.longitude}&mode=d`,
    });

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${favorite.latitude},${favorite.longitude}`;

    console.log('PersonalSafetyScreen: Opening Google Maps for navigation to:', favorite.label);

    Linking.canOpenURL(googleMapsUrl || fallbackUrl).then((supported) => {
      if (supported && googleMapsUrl) {
        Linking.openURL(googleMapsUrl);
      } else {
        Linking.openURL(fallbackUrl);
      }
    }).catch(() => {
      Linking.openURL(fallbackUrl);
    });
  };

  const handleManageFavorites = () => {
    console.log('PersonalSafetyScreen: User tapped Manage Favorites button');
    router.push('/favorites');
  };

  const formatCountdown = (ms: number | null): string => {
    if (ms === null || ms <= 0) {
      return 'Expired';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const timeRemainingText = formatCountdown(timeRemaining);
  const batteryText = batteryLevel !== null ? `${batteryLevel}%` : 'N/A';

  console.log('PersonalSafetyScreen: Rendering UI, favorites count:', favorites.length);

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Personal Safety',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isTracking ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Start Safe Tracking</Text>
              <Text style={styles.cardDescription}>
                Share your live location with trusted contacts. Tracking continues even when you navigate to Google Maps or other apps.
              </Text>

              <View style={styles.expiryOptions}>
                <TouchableOpacity
                  style={[styles.expiryButton, expiryHours === 1 && styles.expiryButtonActive]}
                  onPress={() => {
                    console.log('PersonalSafetyScreen: User selected 1 hour expiry');
                    setExpiryHours(1);
                  }}
                >
                  <Text style={[styles.expiryButtonText, expiryHours === 1 && styles.expiryButtonTextActive]}>
                    1 Hour
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.expiryButton, expiryHours === 3 && styles.expiryButtonActive]}
                  onPress={() => {
                    console.log('PersonalSafetyScreen: User selected 3 hours expiry');
                    setExpiryHours(3);
                  }}
                >
                  <Text style={[styles.expiryButtonText, expiryHours === 3 && styles.expiryButtonTextActive]}>
                    3 Hours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.expiryButton, expiryHours === 6 && styles.expiryButtonActive]}
                  onPress={() => {
                    console.log('PersonalSafetyScreen: User selected 6 hours expiry');
                    setExpiryHours(6);
                  }}
                >
                  <Text style={[styles.expiryButtonText, expiryHours === 6 && styles.expiryButtonTextActive]}>
                    6 Hours
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={startTracking}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="shield.fill"
                        android_material_icon_name="security"
                        size={24}
                        color={colors.text}
                      />
                      <Text style={styles.startButtonText}>Start Safe Tracking</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Favorite Locations */}
            <View style={styles.favoritesCard}>
              <View style={styles.favoritesHeader}>
                <Text style={styles.favoritesTitle}>Favorite Locations</Text>
                <TouchableOpacity onPress={handleManageFavorites}>
                  <Text style={styles.manageText}>Manage</Text>
                </TouchableOpacity>
              </View>

              {loadingFavorites ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
              ) : favorites.length === 0 ? (
                <View style={styles.noFavorites}>
                  <Text style={styles.noFavoritesText}>No favorite locations saved</Text>
                  <TouchableOpacity onPress={handleManageFavorites}>
                    <Text style={styles.addFavoriteLink}>Add your first favorite</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.favoritesList}>
                  {favorites.map((favorite) => (
                    <TouchableOpacity
                      key={favorite.id}
                      style={styles.favoriteItem}
                      onPress={() => handleNavigateToFavorite(favorite)}
                    >
                      <View style={styles.favoriteIcon}>
                        <IconSymbol
                          ios_icon_name="star.fill"
                          android_material_icon_name="star"
                          size={20}
                          color={colors.accent}
                        />
                      </View>
                      <View style={styles.favoriteInfo}>
                        <Text style={styles.favoriteLabel}>{favorite.label}</Text>
                        <Text style={styles.favoriteAddress}>{favorite.address}</Text>
                      </View>
                      <IconSymbol
                        ios_icon_name="arrow.right"
                        android_material_icon_name="navigation"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>Features</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Continuous GPS tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="battery.100"
                    android_material_icon_name="battery-full"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Battery percentage sharing</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Emergency SOS button</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Auto-expiry timer</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={styles.pulseContainer}>
                  <View style={styles.pulse} />
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={32}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.activeTitle}>Tracking Active</Text>
                <Text style={styles.activeSubtitle}>Continues in background</Text>
              </View>

              <View style={styles.trackingCodeCard}>
                <Text style={styles.trackingCodeLabel}>Tracking Code</Text>
                <Text style={styles.trackingCode}>{trackingCode}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={timeRemaining && timeRemaining > 0 ? colors.primary : colors.danger}
                  />
                  <Text style={styles.statLabel}>Time Left</Text>
                  <Text style={[
                    styles.statValue,
                    timeRemaining && timeRemaining <= 0 && { color: colors.danger }
                  ]}>
                    {timeRemainingText}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="battery.100"
                    android_material_icon_name="battery-full"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.statLabel}>Battery</Text>
                  <Text style={styles.statValue}>{batteryText}</Text>
                </View>
              </View>

              <View style={styles.shareButtons}>
                <TouchableOpacity style={styles.shareButton} onPress={shareTrackingLink}>
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.shareButtonText}>Share Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.whatsappButton} onPress={shareViaWhatsApp}>
                  <IconSymbol
                    ios_icon_name="message.fill"
                    android_material_icon_name="message"
                    size={20}
                    color={colors.background}
                  />
                  <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                <LinearGradient
                  colors={[colors.danger, '#CC0000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sosButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={24}
                    color={colors.text}
                  />
                  <Text style={styles.sosButtonText}>Emergency SOS</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
                <Text style={styles.stopButtonText}>Stop Tracking</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  expiryOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  expiryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  expiryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expiryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  expiryButtonTextActive: {
    color: colors.text,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  favoritesCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  favoritesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  noFavorites: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFavoritesText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  addFavoriteLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  favoritesList: {
    gap: 8,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  favoriteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  favoriteAddress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    opacity: 0.3,
    top: -14,
    left: -14,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  activeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  trackingCodeCard: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  trackingCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trackingCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  sosButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sosButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  stopButton: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
