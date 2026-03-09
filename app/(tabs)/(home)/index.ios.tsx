
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import * as Location from 'expo-location';
import { t } from '@/utils/i18n';
import { getActiveTrackingSession, clearActiveTrackingSession, ActiveSessionInfo } from '@/utils/trackingSessionManager';
import { supabase } from '@/app/integrations/supabase/client';

export default function HomeScreen() {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  console.log('HomeScreen: Rendering TrackMe LK home screen (iOS)');

  // Check for active session when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen: Screen focused, checking for active session...');
      checkActiveSession();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    console.log('HomeScreen: User pulled to refresh');
    setRefreshing(true);
    await checkActiveSession();
    setRefreshing(false);
  }, []);

  const checkActiveSession = async () => {
    try {
      setLoading(true);
      const session = await getActiveTrackingSession();
      
      if (session) {
        console.log('HomeScreen: Found active session:', session.id, session.type);
        
        // Verify session is still active in database
        const { data, error } = await supabase
          .from('tracking_sessions')
          .select('status, delivery_status, order_id, customer_name, destination_address')
          .eq('id', session.id)
          .single();

        if (error) {
          console.error('HomeScreen: Error verifying session:', error);
          await clearActiveTrackingSession();
          setActiveSession(null);
        } else if (data && (data.status === 'active' || data.status === 'sos_triggered')) {
          console.log('HomeScreen: Session is still active in database');
          // Enrich session info with delivery details
          const enrichedSession = {
            ...session,
            deliveryStatus: data.delivery_status,
            orderId: data.order_id,
            customerName: data.customer_name,
            destinationAddress: data.destination_address,
          };
          setActiveSession(enrichedSession as any);
        } else {
          console.log('HomeScreen: Session is no longer active, clearing local storage');
          await clearActiveTrackingSession();
          setActiveSession(null);
        }
      } else {
        console.log('HomeScreen: No active session found');
        setActiveSession(null);
      }
    } catch (error) {
      console.error('HomeScreen: Error checking active session:', error);
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalSafety = () => {
    console.log('User tapped Personal Safety Mode button');
    router.push('/personal-safety');
  };

  const handleDeliveryMode = () => {
    console.log('User tapped Delivery Mode button');
    router.push('/delivery-mode');
  };

  const handleEmergencySOS = async () => {
    console.log('User tapped Emergency SOS button from home');
    
    Alert.alert(
      'Emergency SOS',
      'This will send your current location to emergency contacts. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('SOS cancelled'),
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Requesting location permission for SOS...');
              const { status } = await Location.requestForegroundPermissionsAsync();
              
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location permission is required for SOS');
                return;
              }

              console.log('Getting current location for SOS...');
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              const sosMessage = `🚨 EMERGENCY SOS 🚨\nI need help!\nMy location: https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
              
              console.log('SOS triggered with location:', location.coords.latitude, location.coords.longitude);
              
              Alert.alert(
                'SOS Sent!',
                'Your emergency location has been prepared. Share it with your emergency contacts.',
                [
                  {
                    text: 'OK',
                    onPress: () => console.log('SOS alert acknowledged'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error triggering SOS:', error);
              Alert.alert('Error', 'Failed to get your location. Please try again.');
            }
          },
        },
      ]
    );
  };

  const sessionTypeText = activeSession?.type === 'delivery' ? t('delivery_mode') : t('personal_safety');
  const deliveryStatusText = (activeSession as any)?.deliveryStatus || 'pending';

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{t('home_title')}</Text>
          <Text style={styles.tagline}>{t('home_subtitle')}</Text>
        </View>

        {/* Active Session Card */}
        {activeSession && (
          <TouchableOpacity
            style={styles.activeSessionCard}
            onPress={() => {
              console.log('HomeScreen: User tapped active session card');
              if (activeSession.type === 'delivery') {
                router.push('/delivery-mode');
              } else {
                router.push('/personal-safety');
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeSessionGradient}
            >
              <View style={styles.activeSessionHeader}>
                <View style={styles.pulseIndicator}>
                  <View style={styles.pulseOuter} />
                  <View style={styles.pulseInner} />
                </View>
                <View style={styles.activeSessionInfo}>
                  <Text style={styles.activeSessionTitle}>{t('active_tracking_session')}</Text>
                  <Text style={styles.activeSessionType}>{sessionTypeText}</Text>
                </View>
              </View>
              <View style={styles.activeSessionDetails}>
                <View style={styles.activeSessionRow}>
                  <IconSymbol
                    ios_icon_name="number"
                    android_material_icon_name="tag"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.activeSessionLabel}>{t('tracking_code')}:</Text>
                  <Text style={styles.activeSessionValue}>{activeSession.trackingCode}</Text>
                </View>
                {activeSession.type === 'delivery' && (
                  <>
                    {(activeSession as any).orderId && (
                      <View style={styles.activeSessionRow}>
                        <IconSymbol
                          ios_icon_name="shippingbox.fill"
                          android_material_icon_name="local-shipping"
                          size={16}
                          color={colors.text}
                        />
                        <Text style={styles.activeSessionLabel}>Order ID:</Text>
                        <Text style={styles.activeSessionValue}>{(activeSession as any).orderId}</Text>
                      </View>
                    )}
                    {(activeSession as any).customerName && (
                      <View style={styles.activeSessionRow}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={16}
                          color={colors.text}
                        />
                        <Text style={styles.activeSessionLabel}>Customer:</Text>
                        <Text style={styles.activeSessionValue}>{(activeSession as any).customerName}</Text>
                      </View>
                    )}
                    <View style={styles.activeSessionRow}>
                      <IconSymbol
                        ios_icon_name="circle.fill"
                        android_material_icon_name="circle"
                        size={12}
                        color={
                          deliveryStatusText === 'delivered' ? colors.success :
                          deliveryStatusText === 'on_the_way' ? colors.primary :
                          colors.warning
                        }
                      />
                      <Text style={styles.activeSessionLabel}>Status:</Text>
                      <Text style={styles.activeSessionValue}>
                        {deliveryStatusText === 'delivered' ? 'Delivered' :
                         deliveryStatusText === 'on_the_way' ? 'On the Way' :
                         'Pending'}
                      </Text>
                    </View>
                  </>
                )}
                <Text style={styles.activeSessionHint}>{t('tap_to_manage')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Emergency SOS Button */}
        <TouchableOpacity
          style={styles.sosCard}
          onPress={handleEmergencySOS}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.danger, '#CC0000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sosGradient}
          >
            <View style={styles.sosIconContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={40}
                color={colors.text}
              />
            </View>
            <View style={styles.sosTextContainer}>
              <Text style={styles.sosTitle}>{t('emergency_sos')}</Text>
              <Text style={styles.sosDescription}>
                {t('emergency_sos_alerts')}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mode Selection Cards */}
        <View style={styles.modesContainer}>
          {/* Personal Safety Mode */}
          <TouchableOpacity
            style={styles.modeCard}
            onPress={handlePersonalSafety}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeGradient}
            >
              <View style={styles.modeIconContainer}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="security"
                  size={48}
                  color={colors.text}
                />
              </View>
              <Text style={styles.modeTitle}>{t('personal_safety')}</Text>
              <Text style={styles.modeDescription}>
                {t('personal_safety_desc')}
              </Text>
              <View style={styles.modeFeatures}>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>{t('live_gps_updates')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>{t('emergency_sos')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>{t('battery_sharing')}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Delivery Mode */}
          <TouchableOpacity
            style={styles.modeCard}
            onPress={handleDeliveryMode}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeGradient}
            >
              <View style={styles.modeIconContainer}>
                <IconSymbol
                  ios_icon_name="shippingbox.fill"
                  android_material_icon_name="local-shipping"
                  size={48}
                  color={colors.background}
                />
              </View>
              <Text style={[styles.modeTitle, { color: colors.background }]}>{t('delivery_mode')}</Text>
              <Text style={[styles.modeDescription, { color: colors.background }]}>
                {t('delivery_mode_desc')}
              </Text>
              <View style={styles.modeFeatures}>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.background}
                  />
                  <Text style={[styles.featureText, { color: colors.background }]}>{t('auto_order_id')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.background}
                  />
                  <Text style={[styles.featureText, { color: colors.background }]}>{t('realtime_gps')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.background}
                  />
                  <Text style={[styles.featureText, { color: colors.background }]}>Status updates</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Choose your tracking mode to get started. Share tracking links via WhatsApp or SMS.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  activeSessionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  activeSessionGradient: {
    padding: 20,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  pulseIndicator: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    opacity: 0.3,
  },
  pulseInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  activeSessionInfo: {
    flex: 1,
  },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  activeSessionType: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
  },
  activeSessionDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  activeSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeSessionLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
  },
  activeSessionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  activeSessionHint: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  sosCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  sosIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTextContainer: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  sosDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
  },
  modesContainer: {
    gap: 20,
    marginBottom: 24,
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modeGradient: {
    padding: 24,
    minHeight: 240,
  },
  modeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
    marginBottom: 20,
  },
  modeFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
