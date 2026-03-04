
import React, { useState, useEffect } from 'react';
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
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
}

export default function PublicTrackingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('PublicTrackingScreen: Tracking code:', code);

  useEffect(() => {
    fetchTrackingData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchTrackingData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [code]);

  const fetchTrackingData = async (silent = false) => {
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
        setError('Tracking session not found');
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
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      return `${diffSecs} seconds ago`;
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
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
    : 'No updates yet';
  const timeRemainingText = trackingData?.expiresAt 
    ? getTimeRemaining(trackingData.expiresAt)
    : null;
  const speedText = trackingData?.lastLocation?.speed 
    ? `${trackingData.lastLocation.speed.toFixed(1)} km/h`
    : 'N/A';
  const batteryText = trackingData?.lastLocation?.batteryLevel 
    ? `${trackingData.lastLocation.batteryLevel}%`
    : 'N/A';

  // Prepare map markers
  const mapMarkers = [];
  if (trackingData?.lastLocation) {
    mapMarkers.push({
      id: 'current',
      latitude: trackingData.lastLocation.latitude,
      longitude: trackingData.lastLocation.longitude,
      title: 'Current Location',
    });
  }
  if (trackingData?.destinationLatitude && trackingData?.destinationLongitude) {
    mapMarkers.push({
      id: 'destination',
      latitude: trackingData.destinationLatitude,
      longitude: trackingData.destinationLongitude,
      title: 'Destination',
    });
  }

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Live Tracking',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      
      {loading && !trackingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading tracking data...</Text>
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
          <Text style={styles.errorSubtext}>Please check the tracking code and try again</Text>
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
                initialRegion={{
                  latitude: trackingData.lastLocation?.latitude || mapMarkers[0].latitude,
                  longitude: trackingData.lastLocation?.longitude || mapMarkers[0].longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                style={styles.map}
              />
            </View>
          )}

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{trackingData.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.lastUpdateText}>Last updated: {lastUpdateText}</Text>
          </View>

          {/* Session Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Session Information</Text>
            
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {trackingData.sessionType === 'personal_safety' ? 'Personal Safety' : 'Delivery'}
              </Text>
            </View>

            {trackingData.orderId && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="number"
                  android_material_icon_name="tag"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>Order ID</Text>
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
                <Text style={styles.infoLabel}>Customer</Text>
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
                <Text style={styles.infoLabel}>Delivery Status</Text>
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
                <Text style={styles.infoLabel}>Destination</Text>
                <Text style={styles.infoValue}>{trackingData.destinationAddress}</Text>
              </View>
            )}

            {timeRemainingText && (
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>Time Remaining</Text>
                <Text style={styles.infoValue}>{timeRemainingText}</Text>
              </View>
            )}
          </View>

          {/* Live Stats */}
          {trackingData.lastLocation && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Live Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="speedometer"
                    android_material_icon_name="speed"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.statLabel}>Speed</Text>
                  <Text style={styles.statValue}>{speedText}</Text>
                </View>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="battery.100"
                    android_material_icon_name="battery-full"
                    size={24}
                    color={colors.accent}
                  />
                  <Text style={styles.statLabel}>Battery</Text>
                  <Text style={styles.statValue}>{batteryText}</Text>
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
            <Text style={styles.historyText}>
              {trackingData.locationHistory.length} location updates recorded
            </Text>
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
});
