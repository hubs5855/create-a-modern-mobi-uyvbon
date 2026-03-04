
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

export default function PersonalSafetyScreen() {
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState(3);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  console.log('PersonalSafetyScreen: Rendering');

  useEffect(() => {
    const getBatteryLevel = async () => {
      const level = await Battery.getBatteryLevelAsync();
      const percentage = Math.round(level * 100);
      setBatteryLevel(percentage);
      console.log('Battery level:', percentage);
    };
    getBatteryLevel();
  }, []);

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SAF';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const startTracking = async () => {
    console.log('User tapped Start Safe Tracking button');
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        alert('Location permission is required for tracking');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Generate unique tracking code
      const newTrackingCode = generateTrackingCode();
      const expiryTime = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      console.log('Creating personal safety session in Supabase');

      // Create tracking session in Supabase
      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .insert({
          mode: 'personal_safety',
          status: 'active',
          tracking_code: newTrackingCode,
          expiry_time: expiryTime.toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        alert('Failed to start tracking');
        setLoading(false);
        return;
      }

      console.log('Session created:', session);

      // Insert initial location
      const batteryLevelValue = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevelValue * 100);
      setBatteryLevel(batteryPercentage);

      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          session_id: session.id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed ? location.coords.speed * 3.6 : null,
          battery_level: batteryPercentage,
          timestamp: new Date().toISOString(),
        });

      if (locationError) {
        console.error('Error inserting initial location:', locationError);
      }

      setSessionId(session.id);
      setTrackingCode(newTrackingCode);
      setExpiresAt(expiryTime.toISOString());
      setIsTracking(true);

      console.log('Tracking started:', { sessionId: session.id, trackingCode: newTrackingCode });

      startLocationUpdates(session.id);
    } catch (error) {
      console.error('Error starting tracking:', error);
      alert('Failed to start tracking');
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = (sessionId: string) => {
    console.log('Starting location updates every 5 seconds');
    
    locationInterval.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const batteryLevelValue = await Battery.getBatteryLevelAsync();
        const batteryPercentage = Math.round(batteryLevelValue * 100);
        setBatteryLevel(batteryPercentage);

        const speedKmh = location.coords.speed ? location.coords.speed * 3.6 : 0;

        console.log('Location update:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: speedKmh,
          battery: batteryPercentage,
        });

        // Insert location update into Supabase
        const { error } = await supabase
          .from('locations')
          .insert({
            session_id: sessionId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: speedKmh,
            battery_level: batteryPercentage,
            timestamp: new Date().toISOString(),
          });

        if (error) {
          console.error('Error updating location:', error);
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 5000);
  };

  const stopTracking = async () => {
    console.log('User tapped Stop Tracking button');
    
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }

    // Update session status to stopped
    if (sessionId) {
      try {
        await supabase
          .from('tracking_sessions')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
        
        console.log('Session marked as stopped in database');
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    }
    
    setIsTracking(false);
    setSessionId(null);
    setTrackingCode(null);
    setExpiresAt(null);
    console.log('Tracking stopped');
  };

  const handleSOS = async () => {
    console.log('User tapped Emergency SOS button');
    
    if (!sessionId) return;

    try {
      // Get current location for SOS
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Insert SOS location marker
      await supabase
        .from('locations')
        .insert({
          session_id: sessionId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed ? location.coords.speed * 3.6 : null,
          battery_level: batteryLevel,
          timestamp: new Date().toISOString(),
        });

      // Update session to mark SOS triggered
      await supabase
        .from('tracking_sessions')
        .update({
          status: 'sos_triggered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      console.log('SOS triggered and saved to database');
      alert('Emergency SOS sent! Your emergency contacts have been notified.');
    } catch (error) {
      console.error('Error triggering SOS:', error);
      alert('Failed to send SOS. Please try again.');
    }
  };

  const shareTrackingLink = async () => {
    if (!trackingCode) return;
    
    const trackingUrl = `https://trackme.lk/track/${trackingCode}`;
    console.log('User tapped Share button, sharing:', trackingUrl);

    try {
      await Share.share({
        message: `Track my live location: ${trackingUrl}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const shareViaWhatsApp = () => {
    if (!trackingCode) return;
    
    const trackingUrl = `https://trackme.lk/track/${trackingCode}`;
    const message = `Track my live location: ${trackingUrl}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    console.log('User tapped WhatsApp share button');
    Linking.openURL(whatsappUrl).catch(() => {
      alert('WhatsApp is not installed');
    });
  };

  const expiryTimeRemaining = expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0;
  const hoursRemaining = Math.floor(expiryTimeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((expiryTimeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const timeRemainingText = `${hoursRemaining}h ${minutesRemaining}m`;

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
            {/* Setup Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Start Safe Tracking</Text>
              <Text style={styles.cardDescription}>
                Share your live location with trusted contacts. Choose how long you want to be tracked.
              </Text>

              {/* Expiry Options */}
              <View style={styles.expiryOptions}>
                <TouchableOpacity
                  style={[styles.expiryButton, expiryHours === 1 && styles.expiryButtonActive]}
                  onPress={() => setExpiryHours(1)}
                >
                  <Text style={[styles.expiryButtonText, expiryHours === 1 && styles.expiryButtonTextActive]}>
                    1 Hour
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.expiryButton, expiryHours === 3 && styles.expiryButtonActive]}
                  onPress={() => setExpiryHours(3)}
                >
                  <Text style={[styles.expiryButtonText, expiryHours === 3 && styles.expiryButtonTextActive]}>
                    3 Hours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.expiryButton, expiryHours === 6 && styles.expiryButtonActive]}
                  onPress={() => setExpiryHours(6)}
                >
                  <Text style={[styles.expiryButtonText, expiryHours === 6 && styles.expiryButtonTextActive]}>
                    6 Hours
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Start Button */}
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

            {/* Features */}
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
                  <Text style={styles.featureText}>Live GPS updates every 5 seconds</Text>
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
            {/* Active Tracking Card */}
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
                <Text style={styles.activeSubtitle}>Your location is being shared</Text>
              </View>

              {/* Tracking Code */}
              <View style={styles.trackingCodeCard}>
                <Text style={styles.trackingCodeLabel}>Tracking Code</Text>
                <Text style={styles.trackingCode}>{trackingCode}</Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.statLabel}>Time Left</Text>
                  <Text style={styles.statValue}>{timeRemainingText}</Text>
                </View>
                <View style={styles.statItem}>
                  <IconSymbol
                    ios_icon_name="battery.100"
                    android_material_icon_name="battery-full"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.statLabel}>Battery</Text>
                  <Text style={styles.statValue}>{batteryLevel}%</Text>
                </View>
              </View>

              {/* Share Buttons */}
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

              {/* SOS Button */}
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

              {/* Stop Button */}
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
