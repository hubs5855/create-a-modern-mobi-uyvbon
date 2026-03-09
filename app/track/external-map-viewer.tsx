
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

interface ExternalMapData {
  title: string;
  mapUrl: string;
  expiresAt?: string;
  status: string;
}

export default function ExternalMapViewerScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [mapData, setMapData] = useState<ExternalMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  console.log('ExternalMapViewerScreen: Initializing with tracking code:', code);

  useEffect(() => {
    fetchMapData();
  }, [code]);

  useEffect(() => {
    if (!mapData?.expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const expiryTime = new Date(mapData.expiresAt!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [mapData?.expiresAt]);

  const fetchMapData = async () => {
    if (!code) {
      setError('No tracking code provided');
      setLoading(false);
      return;
    }

    try {
      console.log('ExternalMapViewerScreen: Fetching map data for code:', code);

      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('tracking_code', code)
        .eq('session_type', 'external_map')
        .single();

      if (sessionError || !session) {
        console.error('ExternalMapViewerScreen: Error fetching session:', sessionError);
        setError('Map not found. Please check your tracking code.');
        setLoading(false);
        return;
      }

      console.log('ExternalMapViewerScreen: Map data loaded successfully');

      const data: ExternalMapData = {
        title: session.destination_address || 'External Map',
        mapUrl: session.order_id || '',
        expiresAt: session.expiry_time || undefined,
        status: session.status || 'unknown',
      };

      setMapData(data);
    } catch (error) {
      console.error('ExternalMapViewerScreen: Exception fetching map data:', error);
      setError('An error occurred while loading the map.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInBrowser = () => {
    if (mapData?.mapUrl) {
      console.log('ExternalMapViewerScreen: Opening map in browser:', mapData.mapUrl);
      Linking.openURL(mapData.mapUrl);
    }
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

  const countdownText = formatCountdown(timeRemaining);

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Loading Map...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !mapData) {
    return (
      <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Error',
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
          <Text style={styles.errorText}>{error || 'Map not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: mapData.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <IconSymbol
            ios_icon_name="clock.fill"
            android_material_icon_name="schedule"
            size={16}
            color={timeRemaining && timeRemaining > 0 ? colors.accent : colors.danger}
          />
          <Text style={[
            styles.infoText,
            timeRemaining && timeRemaining <= 0 && { color: colors.danger }
          ]}>
            {countdownText}
          </Text>
        </View>
        <TouchableOpacity style={styles.openButton} onPress={handleOpenInBrowser}>
          <IconSymbol
            ios_icon_name="arrow.up.right.square"
            android_material_icon_name="open-in-new"
            size={16}
            color={colors.accent}
          />
          <Text style={styles.openButtonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          source={{ uri: mapData.mapUrl }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('ExternalMapViewerScreen: WebView error:', nativeEvent);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
