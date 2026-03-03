
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Map } from '@/components/Map';

interface TrackingData {
  sessionType: string;
  status: string;
  expiresAt?: string;
  orderId?: string;
  customerName?: string;
  deliveryStatus?: string;
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

  console.log('PublicTrackingScreen: Viewing tracking code:', code);

  const fetchTrackingData = async () => {
    try {
      setError(null);
      // TODO: Backend Integration - GET /api/tracking/public/:trackingCode → { sessionType, status, expiresAt?, orderId?, customerName?, deliveryStatus?, lastLocation?, locationHistory }
      
      // Mock data for now
      const mockData: TrackingData = {
        sessionType: 'personal',
        status: 'active',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        lastLocation: {
          latitude: 6.9271,
          longitude: 79.8612,
          speed: 45,
          batteryLevel: 78,
          timestamp: new Date().toISOString(),
        },
        locationHistory: [
          {
            latitude: 6.9271,
            longitude: 79.8612,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setTrackingData(mockData);
      console.log('Tracking data loaded:', mockData);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 5000);

    return () => clearInterval(interval);
  }, [code]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackingData();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'stopped':
        return colors.textSecondary;
      case 'expired':
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
  const timeRemaining = trackingData?.expiresAt ? getTimeRemaining(trackingData.expiresAt) : null;
  const lastUpdateTime = trackingData?.lastLocation?.timestamp 
    ? formatTimestamp(trackingData.lastLocation.timestamp) 
    : 'N/A';

  if (loading) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trackingData) {
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
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={48}
            color={colors.danger}
          />
          <Text style={styles.errorTitle}>Tracking Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'This tracking code is invalid or has expired.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPersonalSafety = trackingData.sessionType === 'personal';
  const isDelivery = trackingData.sessionType === 'delivery';

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isPersonalSafety ? 'Personal Safety Tracking' : 'Delivery Tracking',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Map */}
        {trackingData.lastLocation && (
          <View style={styles.mapContainer}>
            <Map
              initialRegion={{
                latitude: trackingData.lastLocation.latitude,
                longitude: trackingData.lastLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              markers={[
                {
                  latitude: trackingData.lastLocation.latitude,
                  longitude: trackingData.lastLocation.longitude,
                  title: isPersonalSafety ? 'Current Location' : 'Delivery Location',
                },
              ]}
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
          
          {isDelivery && trackingData.orderId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{trackingData.orderId}</Text>
            </View>
          )}

          {isDelivery && trackingData.customerName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{trackingData.customerName}</Text>
            </View>
          )}

          {isDelivery && trackingData.deliveryStatus && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery Status</Text>
              <Text style={styles.infoValue}>{trackingData.deliveryStatus}</Text>
            </View>
          )}

          {isPersonalSafety && timeRemaining && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time Remaining</Text>
              <Text style={styles.infoValue}>{timeRemaining}</Text>
            </View>
          )}
        </View>

        {/* Location Info */}
        {trackingData.lastLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Current Location</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.statLabel}>Coordinates</Text>
                <Text style={styles.statValue}>
                  {trackingData.lastLocation.latitude.toFixed(4)}, {trackingData.lastLocation.longitude.toFixed(4)}
                </Text>
              </View>

              {trackingData.lastLocation.speed !== undefined && (
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="speedometer"
                    android_material_icon_name="speed"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.statLabel}>Speed</Text>
                  <Text style={styles.statValue}>{trackingData.lastLocation.speed.toFixed(0)} km/h</Text>
                </View>
              )}

              {trackingData.lastLocation.batteryLevel !== undefined && (
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="battery.100"
                    android_material_icon_name="battery-full"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.statLabel}>Battery</Text>
                  <Text style={styles.statValue}>{trackingData.lastLocation.batteryLevel}%</Text>
                </View>
              )}

              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.statLabel}>Last Update</Text>
                <Text style={styles.statValue}>{lastUpdateTime}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Auto-refresh indicator */}
        <View style={styles.refreshIndicator}>
          <IconSymbol
            ios_icon_name="arrow.clockwise"
            android_material_icon_name="refresh"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.refreshText}>Auto-refreshing every 5 seconds</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  mapContainer: {
    height: 400,
    backgroundColor: colors.card,
  },
  map: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  locationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
  },
  refreshText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
