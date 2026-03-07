
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from '@/components/Map';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { t } from '@/utils/i18n';

interface TrackingData {
  sessionType: string;
  status: string;
  expiresAt?: string;
  orderId?: string;
  customerName?: string;
  deliveryStatus?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationAddress?: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    speed?: number;
    batteryLevel?: number;
    timestamp: string;
  };
  locationHistory: {
    latitude: number;
    longitude: number;
    timestamp: string;
  }[];
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to calculate ETA
function calculateETA(distance: number, averageSpeed: number): string {
  if (averageSpeed <= 0) {
    return 'N/A';
  }
  const hours = distance / averageSpeed;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  }
}

export default function PublicTrackingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('PublicTrackingScreen: Tracking code:', code);

  const fetchTrackingData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Fetching tracking data for code:', code);

      // Fetch session data
      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('tracking_code', code)
        .single();

      if (sessionError || !session) {
        console.error('Session not found:', sessionError);
        setError(t('session_not_found'));
        setLoading(false);
        return;
      }

      console.log('Session found:', session);

      // Fetch location history
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
      }

      const locationHistory = locations || [];
      const lastLocation = locationHistory[0];

      const data: TrackingData = {
        sessionType: session.mode || 'unknown',
        status: session.status || 'unknown',
        expiresAt: session.expiry_time || undefined,
        orderId: session.order_id || undefined,
        customerName: session.customer_name || undefined,
        deliveryStatus: session.delivery_status || undefined,
        destinationLatitude: session.destination_latitude || undefined,
        destinationLongitude: session.destination_longitude || undefined,
        destinationAddress: session.destination_address || undefined,
        lastLocation: lastLocation ? {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          speed: lastLocation.speed || undefined,
          batteryLevel: lastLocation.battery_level || undefined,
          timestamp: lastLocation.timestamp || lastLocation.created_at || '',
        } : undefined,
        locationHistory: locationHistory.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp || loc.created_at || '',
        })),
      };

      console.log('Tracking data loaded:', data);
      setTrackingData(data);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setError(t('error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    fetchTrackingData();
    
    // Set up Supabase Realtime subscription for live updates
    let channel: any = null;
    
    const setupRealtimeSubscription = async () => {
      try {
        // First get the session ID from the tracking code
        const { data: session } = await supabase
          .from('tracking_sessions')
          .select('id')
          .eq('tracking_code', code)
          .single();

        if (session) {
          console.log('PublicTrackingScreen: Setting up realtime subscription for session:', session.id);
          
          // Subscribe to location updates for this session
          channel = supabase
            .channel(`locations:session_id=eq.${session.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'locations',
                filter: `session_id=eq.${session.id}`,
              },
              (payload) => {
                console.log('PublicTrackingScreen: New location received via realtime:', payload.new);
                // Refresh data when new location is inserted
                fetchTrackingData(true);
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error('PublicTrackingScreen: Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Fallback: Auto-refresh every 10 seconds (less frequent since we have realtime)
    const interval = setInterval(() => {
      fetchTrackingData(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      if (channel) {
        console.log('PublicTrackingScreen: Unsubscribing from realtime channel');
        supabase.removeChannel(channel);
      }
    };
  }, [fetchTrackingData, code]);

  // Real-time countdown timer - updates every second
  useEffect(() => {
    if (!trackingData?.expiresAt) {
      console.log('PublicTrackingScreen: No expiry time, clearing countdown');
      setTimeRemaining(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    console.log('PublicTrackingScreen: Starting countdown timer for expiry:', trackingData.expiresAt);

    const calculateTimeRemaining = () => {
      const expiryTime = new Date(trackingData.expiresAt!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        console.log('PublicTrackingScreen: Timer expired, stopping countdown');
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Then update every second
    countdownIntervalRef.current = setInterval(calculateTimeRemaining, 1000);

    // Cleanup on unmount or when expiresAt changes
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [trackingData?.expiresAt]);

  const onRefresh = () => {
    console.log('User pulled to refresh');
    setRefreshing(true);
    fetchTrackingData();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      const secondsText = `${diffSecs} ${t('seconds_ago')}`;
      return secondsText;
    } else if (diffMins < 60) {
      const minutesText = `${diffMins} ${t('minutes_ago')}`;
      return minutesText;
    } else {
      const timeText = date.toLocaleTimeString();
      return timeText;
    }
  };

  const formatCountdown = (ms: number | null): string => {
    if (ms === null || ms <= 0) {
      return t('expired');
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'stopped':
      case 'completed':
        return colors.textSecondary;
      case 'sos_triggered':
        return colors.danger;
      case 'pending':
        return colors.warning;
      case 'on_the_way':
        return colors.primary;
      case 'delivered':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const statusColor = trackingData ? getStatusColor(trackingData.status) : colors.textSecondary;
  const lastUpdateText = trackingData?.lastLocation?.timestamp 
    ? formatTimestamp(trackingData.lastLocation.timestamp)
    : t('no_updates');
  const speedText = trackingData?.lastLocation?.speed 
    ? `${trackingData.lastLocation.speed.toFixed(1)} km/h`
    : 'N/A';
  const batteryText = trackingData?.lastLocation?.batteryLevel 
    ? `${trackingData.lastLocation.batteryLevel}%`
    : 'N/A';
  const countdownText = formatCountdown(timeRemaining);

  // Calculate distance and ETA
  let distanceText = 'N/A';
  let etaText = 'N/A';
  if (trackingData?.lastLocation && trackingData?.destinationLatitude && trackingData?.destinationLongitude) {
    const distance = calculateDistance(
      trackingData.lastLocation.latitude,
      trackingData.lastLocation.longitude,
      trackingData.destinationLatitude,
      trackingData.destinationLongitude
    );
    distanceText = `${distance.toFixed(1)} km`;
    
    // Calculate average speed from recent locations
    const recentLocations = trackingData.locationHistory.slice(0, 10);
    const speeds = recentLocations
      .map((_, idx) => {
        if (idx === recentLocations.length - 1) return null;
        const loc1 = recentLocations[idx];
        const loc2 = recentLocations[idx + 1];
        const dist = calculateDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude);
        const time1 = new Date(loc1.timestamp).getTime();
        const time2 = new Date(loc2.timestamp).getTime();
        const timeDiff = Math.abs(time1 - time2) / 1000 / 3600; // hours
        return timeDiff > 0 ? dist / timeDiff : 0;
      })
      .filter(s => s !== null && s > 0) as number[];
    
    const averageSpeed = speeds.length > 0 
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length 
      : trackingData.lastLocation.speed || 30; // Default to 30 km/h if no speed data
    
    etaText = calculateETA(distance, averageSpeed);
  }

  // Prepare map markers with types
  const mapMarkers = [];
  if (trackingData?.lastLocation) {
    mapMarkers.push({
      id: 'driver',
      latitude: trackingData.lastLocation.latitude,
      longitude: trackingData.lastLocation.longitude,
      title: trackingData.sessionType === 'delivery' ? t('driver_location') : t('current_location'),
      type: 'driver' as const,
    });
  }
  if (trackingData?.destinationLatitude && trackingData?.destinationLongitude) {
    mapMarkers.push({
      id: 'destination',
      latitude: trackingData.destinationLatitude,
      longitude: trackingData.destinationLongitude,
      title: t('destination'),
      type: 'destination' as const,
    });
  }

  // Prepare route coordinates (last 50 locations)
  const routeCoordinates = trackingData?.locationHistory.slice(0, 50).reverse().map(loc => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
  })) || [];

  const sessionTypeText = trackingData?.sessionType === 'personal_safety' 
    ? t('personal_safety_type') 
    : t('delivery_type');
  const statusText = trackingData?.status.toUpperCase() || '';
  const locationUpdatesText = `${trackingData?.locationHistory.length || 0} ${t('location_updates')}`;

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('live_tracking'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      
      {loading && !trackingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t('loading_tracking')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={48}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>{t('check_code')}</Text>
        </View>
      ) : trackingData ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {/* Map */}
          {mapMarkers.length > 0 && (
            <View style={styles.mapContainer}>
              <Map
                markers={mapMarkers}
                routeCoordinates={routeCoordinates}
                initialRegion={{
                  latitude: trackingData.lastLocation?.latitude || mapMarkers[0].latitude,
                  longitude: trackingData.lastLocation?.longitude || mapMarkers[0].longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                style={styles.map}
                centerOnMarkers={true}
              />
            </View>
          )}

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
            <Text style={styles.lastUpdateText}>{t('last_updated')}: {lastUpdateText}</Text>
          </View>

          {/* Session Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('session_information')}</Text>
            
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.infoLabel}>{t('type')}</Text>
              <Text style={styles.infoValue}>{sessionTypeText}</Text>
            </View>

            {trackingData.expiresAt && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={20}
                  color={timeRemaining && timeRemaining > 0 ? colors.accent : colors.danger}
                />
                <Text style={styles.infoLabel}>{t('time_remaining')}</Text>
                <Text style={[
                  styles.infoValue,
                  timeRemaining && timeRemaining <= 0 && { color: colors.danger }
                ]}>
                  {countdownText}
                </Text>
              </View>
            )}

            {trackingData.orderId && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="number"
                  android_material_icon_name="tag"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>{t('order_id')}</Text>
                <Text style={styles.infoValue}>{trackingData.orderId}</Text>
              </View>
            )}

            {trackingData.customerName && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>{t('customer')}</Text>
                <Text style={styles.infoValue}>{trackingData.customerName}</Text>
              </View>
            )}

            {trackingData.deliveryStatus && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="shippingbox.fill"
                  android_material_icon_name="local-shipping"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>{t('delivery_status')}</Text>
                <Text style={styles.infoValue}>{trackingData.deliveryStatus}</Text>
              </View>
            )}

            {trackingData.destinationAddress && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="mappin.circle.fill"
                  android_material_icon_name="place"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>{t('destination')}</Text>
                <Text style={styles.infoValue}>{trackingData.destinationAddress}</Text>
              </View>
            )}
          </View>

          {/* Live Stats */}
          {trackingData.lastLocation && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>{t('live_stats')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="speedometer"
                    android_material_icon_name="speed"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.statLabel}>{t('speed')}</Text>
                  <Text style={styles.statValue}>{speedText}</Text>
                </View>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="battery.100"
                    android_material_icon_name="battery-full"
                    size={24}
                    color={colors.accent}
                  />
                  <Text style={styles.statLabel}>{t('battery')}</Text>
                  <Text style={styles.statValue}>{batteryText}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Distance and ETA */}
          {trackingData?.destinationLatitude && trackingData?.destinationLongitude && trackingData?.lastLocation && (
            <View style={styles.etaCard}>
              <Text style={styles.etaTitle}>Delivery Information</Text>
              <View style={styles.etaGrid}>
                <View style={styles.etaItem}>
                  <IconSymbol
                    ios_icon_name="arrow.right.circle.fill"
                    android_material_icon_name="navigation"
                    size={24}
                    color={colors.accent}
                  />
                  <Text style={styles.etaLabel}>Distance</Text>
                  <Text style={styles.etaValue}>{distanceText}</Text>
                </View>
                <View style={styles.etaItem}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.etaLabel}>ETA</Text>
                  <Text style={styles.etaValue}>{etaText}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Location History Count */}
          <View style={styles.historyCard}>
            <IconSymbol
              ios_icon_name="map.fill"
              android_material_icon_name="map"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.historyText}>{locationUpdatesText}</Text>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  lastUpdateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  historyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  etaCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  etaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  etaItem: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  etaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
});
