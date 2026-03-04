
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
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { Map } from '@/components/Map';

type DeliveryStatus = 'pending' | 'on_the_way' | 'delivered';

interface DestinationLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function DeliveryModeScreen() {
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('pending');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [destination, setDestination] = useState<DestinationLocation | null>(null);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [tempDestinationAddress, setTempDestinationAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  console.log('DeliveryModeScreen: Rendering');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DEL';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a location to search');
      return;
    }

    console.log('User searching for location:', searchQuery);
    setSearchLoading(true);

    try {
      // Use geocoding to search for the location
      const results = await Location.geocodeAsync(searchQuery);
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log('Search result:', result);
        
        setDestination({
          latitude: result.latitude,
          longitude: result.longitude,
          address: searchQuery,
        });
        setTempDestinationAddress(searchQuery);
        alert('Location found! You can adjust the pin on the map if needed.');
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapPress = (latitude: number, longitude: number) => {
    console.log('User selected location on map:', { latitude, longitude });
    setDestination({
      latitude,
      longitude,
      address: tempDestinationAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    });
  };

  const confirmDestination = () => {
    if (!destination) {
      alert('Please select a destination on the map or search for a location');
      return;
    }
    console.log('Destination confirmed:', destination);
    setDeliveryAddress(destination.address);
    setShowDestinationPicker(false);
  };

  const startDelivery = async () => {
    console.log('User tapped Start Delivery button');
    
    if (!destination) {
      alert('Please select a destination before starting delivery');
      return;
    }

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

      console.log('Creating delivery session in Supabase with destination');

      // Create tracking session in Supabase with destination
      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .insert({
          mode: 'delivery',
          status: 'active',
          tracking_code: newTrackingCode,
          order_id: newOrderId,
          customer_name: customerName || null,
          delivery_address: destination.address,
          delivery_status: 'pending',
          destination_latitude: destination.latitude,
          destination_longitude: destination.longitude,
          destination_address: destination.address,
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
    setDestination(null);
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

              {/* Destination Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Destination (Required)</Text>
                <TouchableOpacity
                  style={styles.destinationButton}
                  onPress={() => setShowDestinationPicker(true)}
                >
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={destination ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[styles.destinationButtonText, destination && { color: colors.text }]}>
                    {destination ? destination.address : 'Select destination on map'}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={[styles.startButton, !destination && styles.startButtonDisabled]}
                onPress={startDelivery}
                disabled={loading || !destination}
              >
                <LinearGradient
                  colors={!destination ? [colors.textTertiary, colors.textTertiary] : [colors.accent, colors.accentDark]}
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
                    ios_icon_name="map.fill"
                    android_material_icon_name="map"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Destination selection on map</Text>
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
                {destination ? (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Destination</Text>
                    <Text style={styles.orderInfoValue}>{destination.address}</Text>
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

      {/* Destination Picker Modal */}
      <Modal
        visible={showDestinationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDestinationPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDestinationPicker(false)}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Destination</Text>
            <TouchableOpacity onPress={confirmDestination}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchLocation}
                returnKeyType="search"
              />
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <TouchableOpacity onPress={handleSearchLocation}>
                  <IconSymbol
                    ios_icon_name="arrow.right.circle.fill"
                    android_material_icon_name="arrow-forward"
                    size={24}
                    color={colors.accent}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.searchHint}>Tap on the map to select a location</Text>
          </View>

          {/* Map */}
          <View style={styles.mapPickerContainer}>
            {currentLocation && (
              <Map
                markers={destination ? [
                  {
                    id: 'destination',
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                    title: 'Destination',
                  },
                ] : []}
                initialRegion={{
                  latitude: destination?.latitude || currentLocation.latitude,
                  longitude: destination?.longitude || currentLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                style={styles.mapPicker}
                onMapPress={handleMapPress}
              />
            )}
            {destination && (
              <View style={styles.selectedLocationBadge}>
                <IconSymbol
                  ios_icon_name="mappin.circle.fill"
                  android_material_icon_name="place"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.selectedLocationText}>
                  {destination.address}
                </Text>
              </View>
            )}
          </View>

          {/* Address Input */}
          <View style={styles.addressInputContainer}>
            <Text style={styles.addressInputLabel}>Destination Address</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Enter or edit address"
              placeholderTextColor={colors.textTertiary}
              value={tempDestinationAddress}
              onChangeText={setTempDestinationAddress}
              multiline
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  destinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  destinationButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.textSecondary,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonDisabled: {
    opacity: 0.5,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  mapPickerContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPicker: {
    flex: 1,
  },
  selectedLocationBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  addressInputContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
