
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
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

type DeliveryStatus = 'pending' | 'on_the_way' | 'delivered';

export default function DeliveryModeScreen() {
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('pending');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  console.log('DeliveryModeScreen: Rendering');

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DEL';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const startDelivery = async () => {
    console.log('User tapped Start Delivery button');
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

      // Generate unique tracking code and order ID
      const newTrackingCode = generateTrackingCode();
      const newOrderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

      console.log('Creating delivery session in Supabase');

      // Create tracking session in Supabase
      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .insert({
          mode: 'delivery',
          status: 'active',
          tracking_code: newTrackingCode,
          order_id: newOrderId,
          customer_name: customerName || null,
          delivery_address: deliveryAddress || null,
          delivery_status: 'pending',
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        alert('Failed to start delivery tracking');
        setLoading(false);
        return;
      }

      console.log('Session created:', session);

      // Insert initial location
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);

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
      setOrderId(newOrderId);
      setTrackingCode(newTrackingCode);
      setIsTracking(true);
      setDeliveryStatus('pending');

      console.log('Delivery started:', { sessionId: session.id, orderId: newOrderId, trackingCode: newTrackingCode });

      startLocationUpdates(session.id);
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('Failed to start delivery tracking');
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

        const speedKmh = location.coords.speed ? location.coords.speed * 3.6 : 0;
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercentage = Math.round(batteryLevel * 100);

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

  const updateDeliveryStatus = async (newStatus: DeliveryStatus) => {
    if (!sessionId) return;

    console.log('User updated delivery status to:', newStatus);
    setDeliveryStatus(newStatus);

    try {
      // Update delivery status in Supabase
      const { error } = await supabase
        .from('tracking_sessions')
        .update({
          delivery_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating delivery status:', error);
      } else {
        console.log('Delivery status updated successfully');
      }

      // If delivered, stop tracking
      if (newStatus === 'delivered') {
        if (locationInterval.current) {
          clearInterval(locationInterval.current);
          locationInterval.current = null;
        }

        // Update session status to completed
        await supabase
          .from('tracking_sessions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        console.log('Delivery completed, tracking stopped');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const stopDelivery = async () => {
    console.log('User tapped Stop Delivery button');
    
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
    setOrderId(null);
    setTrackingCode(null);
    setDeliveryStatus('pending');
    setCustomerName('');
    setDeliveryAddress('');
    console.log('Delivery tracking stopped');
  };

  const shareTrackingLink = async () => {
    if (!trackingCode) return;
    
    const trackingUrl = `https://trackme.lk/track/${trackingCode}`;
    const orderText = orderId ? `Order ${orderId}` : 'Your delivery';
    console.log('User tapped Share button, sharing:', trackingUrl);

    try {
      await Share.share({
        message: `Track ${orderText}: ${trackingUrl}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
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

  const getStatusText = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'on_the_way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const statusText = getStatusText(deliveryStatus);
  const statusColor = getStatusColor(deliveryStatus);

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Delivery Mode',
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
              <Text style={styles.cardTitle}>Create Delivery Order</Text>
              <Text style={styles.cardDescription}>
                Start tracking a delivery. An order ID will be auto-generated.
              </Text>

              {/* Customer Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Customer Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter customer name"
                  placeholderTextColor={colors.textTertiary}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              {/* Delivery Address Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Delivery Address (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter delivery address"
                  placeholderTextColor={colors.textTertiary}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={startDelivery}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="shippingbox.fill"
                        android_material_icon_name="local-shipping"
                        size={24}
                        color={colors.background}
                      />
                      <Text style={styles.startButtonText}>Start Delivery</Text>
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
                    ios_icon_name="number"
                    android_material_icon_name="tag"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Auto-generated order ID</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Real-time GPS tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Customer tracking link</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Status updates</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Active Delivery Card */}
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={styles.pulseContainer}>
                  <View style={styles.pulse} />
                  <IconSymbol
                    ios_icon_name="shippingbox.fill"
                    android_material_icon_name="local-shipping"
                    size={32}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.activeTitle}>Delivery Active</Text>
                <Text style={styles.activeSubtitle}>Tracking in progress</Text>
              </View>

              {/* Order Info */}
              <View style={styles.orderInfoCard}>
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Order ID</Text>
                  <Text style={styles.orderInfoValue}>{orderId}</Text>
                </View>
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Tracking Code</Text>
                  <Text style={styles.orderInfoValue}>{trackingCode}</Text>
                </View>
                {customerName ? (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Customer</Text>
                    <Text style={styles.orderInfoValue}>{customerName}</Text>
                  </View>
                ) : null}
              </View>

              {/* Status Selector */}
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Delivery Status</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      deliveryStatus === 'pending' && { backgroundColor: colors.warning },
                    ]}
                    onPress={() => updateDeliveryStatus('pending')}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        deliveryStatus === 'pending' && { color: colors.background },
                      ]}
                    >
                      Pending
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      deliveryStatus === 'on_the_way' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => updateDeliveryStatus('on_the_way')}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        deliveryStatus === 'on_the_way' && { color: colors.text },
                      ]}
                    >
                      On the Way
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      deliveryStatus === 'delivered' && { backgroundColor: colors.success },
                    ]}
                    onPress={() => updateDeliveryStatus('delivered')}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        deliveryStatus === 'delivered' && { color: colors.background },
                      ]}
                    >
                      Delivered
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.currentStatusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={styles.currentStatusText}>Current: {statusText}</Text>
                </View>
              </View>

              {/* Share Button */}
              <TouchableOpacity style={styles.shareButton} onPress={shareTrackingLink}>
                <IconSymbol
                  ios_icon_name="square.and.arrow.up"
                  android_material_icon_name="share"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.shareButtonText}>Share Tracking Link</Text>
              </TouchableOpacity>

              {/* Stop Button */}
              <TouchableOpacity style={styles.stopButton} onPress={stopDelivery}>
                <Text style={styles.stopButtonText}>Stop Delivery</Text>
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    color: colors.background,
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
    borderColor: colors.accent,
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
  orderInfoCard: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusCard: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentStatusText: {
    fontSize: 14,
    color: colors.text,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
