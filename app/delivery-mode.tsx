
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
import { supabase } from '@/integrations/supabase/client';
import { Map } from '@/components/Map';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  startForegroundLocationTracking,
  stopForegroundLocationTracking,
  isLocationTrackingActive,
} from '@/utils/locationTracking';
import { t } from '@/utils/i18n';
import { setActiveTrackingSession, clearActiveTrackingSession, getActiveTrackingSession } from '@/utils/trackingSessionManager';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [tempDestinationAddress, setTempDestinationAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showTrafficAlert, setShowTrafficAlert] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Time picker states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState<Date | null>(null);

  console.log('DeliveryModeScreen: Rendering, isTracking:', isTracking, 'sessionId:', sessionId);

  useEffect(() => {
    console.log('DeliveryModeScreen: Component mounted, checking auth and getting location...');
    checkAuth();
    getCurrentLocation();
    checkExistingTracking();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('DeliveryModeScreen: User not authenticated');
        setUserId(null);
      } else {
        console.log('DeliveryModeScreen: User authenticated:', user.id);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('DeliveryModeScreen: Error checking auth:', error);
      setUserId(null);
    }
  };

  const checkExistingTracking = async () => {
    try {
      const session = await getActiveTrackingSession();
      console.log('DeliveryModeScreen: Checking existing tracking session');
      
      if (session && session.type === 'delivery') {
        console.log('DeliveryModeScreen: Found active delivery session:', session.id);
        
        // Verify session is still active in database
        const { data, error } = await supabase
          .from('tracking_sessions')
          .select('*')
          .eq('id', session.id)
          .single();

        if (error) {
          console.error('DeliveryModeScreen: Error verifying session:', error);
          await clearActiveTrackingSession();
        } else if (data && data.status === 'active') {
          console.log('DeliveryModeScreen: Restoring active session from database');
          setSessionId(data.id);
          setOrderId(data.order_id || null);
          setTrackingCode(data.tracking_code);
          setDeliveryStatus(data.delivery_status || 'pending');
          setCustomerName(data.customer_name || '');
          setDeliveryAddress(data.destination_address || '');
          if (data.destination_latitude && data.destination_longitude) {
            setDestination({
              latitude: data.destination_latitude,
              longitude: data.destination_longitude,
              address: data.destination_address || '',
            });
          }
          setExpiresAt(data.expiry_time || null);
          setIsTracking(true);
        } else {
          console.log('DeliveryModeScreen: Session is no longer active, clearing');
          await clearActiveTrackingSession();
        }
      }
    } catch (error) {
      console.error('DeliveryModeScreen: Error checking existing tracking:', error);
    }
  };

  // Real-time countdown timer - updates every second
  useEffect(() => {
    if (!expiresAt) {
      console.log('DeliveryModeScreen: No expiry time, clearing countdown');
      setTimeRemaining(null);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      return;
    }

    console.log('DeliveryModeScreen: Starting countdown timer for expiry:', expiresAt);

    const calculateTimeRemaining = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      
      console.log('DeliveryModeScreen: Time remaining (ms):', remaining);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        console.log('DeliveryModeScreen: Timer expired, stopping countdown');
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
      console.log('DeliveryModeScreen: Cleaning up countdown timer');
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [expiresAt]);

  const getCurrentLocation = async () => {
    try {
      console.log('DeliveryModeScreen: Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        console.log('DeliveryModeScreen: Location permission granted, getting position...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('DeliveryModeScreen: Current location set:', location.coords.latitude, location.coords.longitude);
      } else {
        console.log('DeliveryModeScreen: Location permission denied');
      }
    } catch (error) {
      console.error('DeliveryModeScreen: Error getting current location:', error);
    }
  };

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DEL';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('DeliveryModeScreen: Generated tracking code:', code);
    return code;
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    console.log('DeliveryModeScreen: User searching for location:', searchQuery);
    setSearchLoading(true);

    try {
      const results = await Location.geocodeAsync(searchQuery);
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log('DeliveryModeScreen: Search result found:', result);
        
        setDestination({
          latitude: result.latitude,
          longitude: result.longitude,
          address: searchQuery,
        });
        setTempDestinationAddress(searchQuery);
        Alert.alert('Success', 'Location found! You can adjust the pin on the map if needed.');
      } else {
        console.log('DeliveryModeScreen: No search results found');
        Alert.alert('Not Found', 'Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('DeliveryModeScreen: Error searching location:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapPress = (latitude: number, longitude: number) => {
    console.log('DeliveryModeScreen: User selected location on map:', { latitude, longitude });
    setDestination({
      latitude,
      longitude,
      address: tempDestinationAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    });
  };

  const confirmDestination = () => {
    if (!destination) {
      Alert.alert('Error', 'Please select a destination on the map or search for a location');
      return;
    }
    console.log('DeliveryModeScreen: Destination confirmed:', destination);
    setDeliveryAddress(destination.address);
    setShowDestinationPicker(false);

    // Simulate traffic check (in production, this would call a traffic API)
    const hasTraffic = Math.random() > 0.7;
    if (hasTraffic) {
      console.log('DeliveryModeScreen: Traffic detected on route');
      setShowTrafficAlert(true);
    }
  };

  const handleNavigateToDestination = () => {
    if (!destination) {
      Alert.alert('Error', 'No destination selected');
      return;
    }

    console.log('DeliveryModeScreen: Opening Google Maps for navigation to destination');

    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${destination.latitude},${destination.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${destination.latitude},${destination.longitude}&mode=d`,
    });

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;

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

  const handleShiftRoute = () => {
    console.log('DeliveryModeScreen: User requested alternative route');
    setShowTrafficAlert(false);
    Alert.alert('Route Updated', 'Alternative route calculated. Opening Google Maps with new route.');
    handleNavigateToDestination();
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    console.log('DeliveryModeScreen: Time picker changed:', selectedDate);
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeliveryTime(selectedDate);
    }
  };

  const startDelivery = async () => {
    console.log('DeliveryModeScreen: User tapped Start Delivery button');
    
    if (!destination) {
      Alert.alert('Error', 'Please select a destination before starting delivery');
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      console.log('DeliveryModeScreen: User not authenticated, prompting login');
      Alert.alert(
        'Authentication Required',
        'Please log in to create delivery orders',
        [
          {
            text: 'Log In',
            onPress: () => router.push('/login'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      console.log('DeliveryModeScreen: Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('DeliveryModeScreen: Current location:', location.coords.latitude, location.coords.longitude);

      const newTrackingCode = generateTrackingCode();
      const newOrderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
      
      // Set expiry time to 8 hours from now for delivery mode
      const expiryTime = new Date(Date.now() + 8 * 60 * 60 * 1000);

      console.log('DeliveryModeScreen: Creating delivery session in Supabase with user_id:', userId);
      console.log('DeliveryModeScreen: Order ID:', newOrderId);
      console.log('DeliveryModeScreen: Customer Name:', customerName || 'None');
      console.log('DeliveryModeScreen: Destination:', destination);
      console.log('DeliveryModeScreen: Expiry time:', expiryTime.toISOString());
      console.log('DeliveryModeScreen: Delivery time:', deliveryTime ? deliveryTime.toISOString() : 'Not set');

      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .insert({
          user_id: userId,
          session_type: 'delivery',
          status: 'active',
          tracking_code: newTrackingCode,
          order_id: newOrderId,
          customer_name: customerName || null,
          delivery_status: 'pending',
          destination_latitude: destination.latitude,
          destination_longitude: destination.longitude,
          destination_address: destination.address,
          expiry_time: expiryTime.toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        console.error('DeliveryModeScreen: Error creating session:', sessionError);
        Alert.alert('Error', 'Failed to start delivery tracking: ' + sessionError.message);
        setLoading(false);
        return;
      }

      console.log('DeliveryModeScreen: Session created successfully:', session.id);

      // Create order record in orders table
      console.log('DeliveryModeScreen: Creating order record in orders table...');
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_id: newOrderId,
          customer_name: customerName || null,
          delivery_address: destination.address,
          delivery_latitude: destination.latitude,
          delivery_longitude: destination.longitude,
          delivery_status: 'pending',
          tracking_session_id: session.id,
        })
        .select()
        .single();

      if (orderError) {
        console.error('DeliveryModeScreen: Error creating order:', orderError);
        // Continue anyway - order creation is not critical for tracking
      } else {
        console.log('DeliveryModeScreen: Order created successfully:', orderData.id);
      }

      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);

      console.log('DeliveryModeScreen: Inserting initial location...');
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
        console.error('DeliveryModeScreen: Error inserting initial location:', locationError);
      } else {
        console.log('DeliveryModeScreen: Initial location inserted successfully');
      }

      setSessionId(session.id);
      setOrderId(newOrderId);
      setTrackingCode(newTrackingCode);
      setExpiresAt(expiryTime.toISOString());
      setIsTracking(true);
      setDeliveryStatus('pending');

      console.log('DeliveryModeScreen: Delivery started successfully!');
      console.log('DeliveryModeScreen: Session ID:', session.id);
      console.log('DeliveryModeScreen: Order ID:', newOrderId);
      console.log('DeliveryModeScreen: Tracking Code:', newTrackingCode);
      console.log('DeliveryModeScreen: Expires At:', expiryTime.toISOString());

      // Save active session to local storage
      await setActiveTrackingSession({
        id: session.id,
        type: 'delivery',
        trackingCode: newTrackingCode,
        startedAt: new Date().toISOString(),
      });
      console.log('DeliveryModeScreen: Active session saved to local storage');

      // Start foreground location tracking
      const trackingStarted = await startForegroundLocationTracking(session.id);
      
      if (!trackingStarted) {
        console.error('DeliveryModeScreen: Failed to start foreground location tracking');
        Alert.alert(
          'Warning',
          'Location tracking may not work in the background. Please keep the app open for best results.'
        );
      } else {
        console.log('DeliveryModeScreen: Foreground location tracking started successfully');
        Alert.alert(
          'Tracking Started',
          'Your location will continue to be tracked even when you navigate to Google Maps or other apps.'
        );
      }
    } catch (error: any) {
      console.error('DeliveryModeScreen: Exception starting delivery:', error);
      Alert.alert('Error', 'Failed to start delivery tracking: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (newStatus: DeliveryStatus) => {
    if (!sessionId || !userId) {
      console.log('DeliveryModeScreen: Cannot update status - missing sessionId or userId');
      return;
    }

    console.log('DeliveryModeScreen: User tapped status button:', newStatus);
    console.log('DeliveryModeScreen: Current sessionId:', sessionId);
    console.log('DeliveryModeScreen: Current userId:', userId);

    try {
      // First, verify the session belongs to this user
      const { data: verifyData, error: verifyError } = await supabase
        .from('tracking_sessions')
        .select('user_id, status')
        .eq('id', sessionId)
        .single();

      if (verifyError) {
        console.error('DeliveryModeScreen: Error verifying session ownership:', verifyError);
        Alert.alert('Error', 'Failed to verify session: ' + verifyError.message);
        return;
      }

      if (verifyData.user_id !== userId) {
        console.error('DeliveryModeScreen: Session does not belong to current user');
        Alert.alert('Error', 'You do not have permission to update this delivery');
        return;
      }

      console.log('DeliveryModeScreen: Session verified, updating status...');

      // Update tracking session delivery_status
      const { data: sessionData, error: sessionError } = await supabase
        .from('tracking_sessions')
        .update({
          delivery_status: newStatus,
          status: newStatus === 'delivered' ? 'stopped' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select();

      if (sessionError) {
        console.error('DeliveryModeScreen: Error updating delivery status in tracking_sessions:', sessionError);
        Alert.alert('Error', 'Failed to update status: ' + sessionError.message);
        return;
      }

      console.log('DeliveryModeScreen: Tracking session updated successfully:', sessionData);

      // Update order record
      console.log('DeliveryModeScreen: Updating order delivery status...');
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update({
          delivery_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('tracking_session_id', sessionId)
        .eq('user_id', userId)
        .select();

      if (orderError) {
        console.error('DeliveryModeScreen: Error updating delivery status in orders:', orderError);
      } else {
        console.log('DeliveryModeScreen: Order status updated successfully:', orderData);
      }

      // Update local state
      setDeliveryStatus(newStatus);

      if (newStatus === 'delivered') {
        console.log('DeliveryModeScreen: Delivery marked as delivered, stopping location updates...');
        await stopForegroundLocationTracking();
        console.log('DeliveryModeScreen: Delivery completed, tracking stopped');
        Alert.alert('Success', 'Delivery marked as delivered! Tracking has been stopped.');
      } else {
        Alert.alert('Success', `Status updated to: ${newStatus === 'on_the_way' ? 'On the Way' : 'Pending'}`);
      }
    } catch (error: any) {
      console.error('DeliveryModeScreen: Exception updating delivery status:', error);
      Alert.alert('Error', 'Failed to update status: ' + (error.message || 'Unknown error'));
    }
  };

  const stopDelivery = async () => {
    console.log('DeliveryModeScreen: User tapped Stop Delivery button');
    
    // Stop foreground location tracking
    await stopForegroundLocationTracking();

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
      console.log('DeliveryModeScreen: Countdown timer stopped');
    }

    if (sessionId && userId) {
      try {
        console.log('DeliveryModeScreen: Marking session as stopped in database...');
        await supabase
          .from('tracking_sessions')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .eq('user_id', userId);
        
        console.log('DeliveryModeScreen: Session marked as stopped successfully');
      } catch (error) {
        console.error('DeliveryModeScreen: Error stopping session:', error);
      }
    }

    // Clear active session from local storage
    await clearActiveTrackingSession();
    console.log('DeliveryModeScreen: Active session cleared from local storage');

    setIsTracking(false);
    setSessionId(null);
    setOrderId(null);
    setTrackingCode(null);
    setDeliveryStatus('pending');
    setCustomerName('');
    setDeliveryAddress('');
    setDestination(null);
    setShowTrafficAlert(false);
    setExpiresAt(null);
    setTimeRemaining(null);
    setDeliveryTime(null);
    console.log('DeliveryModeScreen: Delivery tracking stopped, state reset');
  };

  const shareTrackingLink = async () => {
    if (!trackingCode) return;
    
    console.log('DeliveryModeScreen: User tapped Share button, opening share modal');
    setShowShareModal(true);
  };

  const shareViaMethod = async (method: 'general' | 'whatsapp' | 'messenger') => {
    if (!trackingCode) return;
    
    const trackingUrl = `https://trackme.lk/track/${trackingCode}`;
    const orderText = orderId ? `Order ${orderId}` : 'Your delivery';
    const message = `Track ${orderText}: ${trackingUrl}`;

    console.log(`DeliveryModeScreen: User sharing via ${method}:`, trackingUrl);

    try {
      if (method === 'whatsapp') {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          console.log('DeliveryModeScreen: WhatsApp opened successfully');
        } else {
          console.log('DeliveryModeScreen: WhatsApp not installed');
          Alert.alert('Error', 'WhatsApp is not installed on this device');
        }
      } else if (method === 'messenger') {
        const messengerUrl = `fb-messenger://share?link=${encodeURIComponent(trackingUrl)}`;
        const canOpen = await Linking.canOpenURL(messengerUrl);
        if (canOpen) {
          await Linking.openURL(messengerUrl);
          console.log('DeliveryModeScreen: Messenger opened successfully');
        } else {
          console.log('DeliveryModeScreen: Messenger not installed');
          Alert.alert('Error', 'Messenger is not installed on this device');
        }
      } else {
        await Share.share({
          message: message,
          url: trackingUrl,
        });
        console.log('DeliveryModeScreen: Share sheet opened successfully');
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('DeliveryModeScreen: Error sharing:', error);
      Alert.alert('Error', 'Failed to share tracking link');
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

  const formatDeliveryTime = (date: Date | null): string => {
    if (!date) return 'Not set';
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const statusText = getStatusText(deliveryStatus);
  const statusColor = getStatusColor(deliveryStatus);
  const timeRemainingText = formatCountdown(timeRemaining);
  const deliveryTimeText = formatDeliveryTime(deliveryTime);

  console.log('DeliveryModeScreen: Rendering UI, destination:', destination ? 'Set' : 'Not set');

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('delivery_mode_title'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isTracking ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('create_delivery_order')}</Text>
              <Text style={styles.cardDescription}>
                {t('delivery_order_desc')}
              </Text>

              {!userId && (
                <View style={styles.authNotice}>
                  <IconSymbol
                    ios_icon_name="info.circle.fill"
                    android_material_icon_name="info"
                    size={20}
                    color={colors.warning}
                  />
                  <Text style={styles.authNoticeText}>
                    You need to log in to create delivery orders
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('customer_name')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_customer_name')}
                  placeholderTextColor={colors.textTertiary}
                  value={customerName}
                  onChangeText={(text) => {
                    console.log('DeliveryModeScreen: Customer name changed:', text);
                    setCustomerName(text);
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('destination_required')}</Text>
                <TouchableOpacity
                  style={styles.destinationButton}
                  onPress={() => {
                    console.log('DeliveryModeScreen: User tapped destination picker button');
                    setShowDestinationPicker(true);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={destination ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[styles.destinationButtonText, destination && { color: colors.text }]}>
                    {destination ? destination.address : t('select_destination')}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Expected Delivery Time (Optional)</Text>
                <TouchableOpacity
                  style={styles.destinationButton}
                  onPress={() => {
                    console.log('DeliveryModeScreen: User tapped time picker button');
                    setShowTimePicker(true);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={deliveryTime ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[styles.destinationButtonText, deliveryTime && { color: colors.text }]}>
                    {deliveryTimeText}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {showTimePicker && (
                <DateTimePicker
                  value={deliveryTime || new Date()}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}

              <TouchableOpacity
                style={[styles.startButton, (!destination || !userId) && styles.startButtonDisabled]}
                onPress={startDelivery}
                disabled={loading || !destination || !userId}
              >
                <LinearGradient
                  colors={(!destination || !userId) ? [colors.textTertiary, colors.textTertiary] : [colors.accent, colors.accentDark]}
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
                      <Text style={styles.startButtonText}>{t('start_delivery')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

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
                  <Text style={styles.featureText}>Continuous GPS tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="map.fill"
                    android_material_icon_name="map"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Works with Google Maps navigation</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Traffic alerts</Text>
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
                    ios_icon_name="shippingbox.fill"
                    android_material_icon_name="local-shipping"
                    size={32}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.activeTitle}>Delivery Active</Text>
                <Text style={styles.activeSubtitle}>Tracking continues in background</Text>
              </View>

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
                {deliveryTime && (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Expected Time</Text>
                    <Text style={styles.orderInfoValue}>{deliveryTimeText}</Text>
                  </View>
                )}
                {expiresAt && (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Time Remaining</Text>
                    <Text style={[
                      styles.orderInfoValue,
                      timeRemaining && timeRemaining <= 0 && { color: colors.danger }
                    ]}>
                      {timeRemainingText}
                    </Text>
                  </View>
                )}
              </View>

              {/* Traffic Alert */}
              {showTrafficAlert && (
                <View style={styles.trafficAlert}>
                  <View style={styles.trafficAlertHeader}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle.fill"
                      android_material_icon_name="warning"
                      size={24}
                      color={colors.warning}
                    />
                    <Text style={styles.trafficAlertTitle}>Heavy Traffic Detected</Text>
                  </View>
                  <Text style={styles.trafficAlertText}>
                    Your current route has heavy traffic. Consider taking an alternative route.
                  </Text>
                  <TouchableOpacity style={styles.shiftRouteButton} onPress={handleShiftRoute}>
                    <IconSymbol
                      ios_icon_name="arrow.triangle.2.circlepath"
                      android_material_icon_name="refresh"
                      size={20}
                      color={colors.background}
                    />
                    <Text style={styles.shiftRouteButtonText}>Shift Route</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Navigate Button */}
              {destination && (
                <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToDestination}>
                  <IconSymbol
                    ios_icon_name="arrow.triangle.turn.up.right.circle.fill"
                    android_material_icon_name="navigation"
                    size={24}
                    color={colors.background}
                  />
                  <Text style={styles.navigateButtonText}>Navigate with Google Maps</Text>
                </TouchableOpacity>
              )}

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

              <TouchableOpacity style={styles.shareButton} onPress={shareTrackingLink}>
                <IconSymbol
                  ios_icon_name="square.and.arrow.up"
                  android_material_icon_name="share"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.shareButtonText}>Share Tracking Link</Text>
              </TouchableOpacity>

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
        onRequestClose={() => {
          console.log('DeliveryModeScreen: User closed destination picker modal');
          setShowDestinationPicker(false);
        }}
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

      {/* Share Options Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
        onRequestClose={() => {
          console.log('DeliveryModeScreen: User closed share modal');
          setShowShareModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share Tracking Link</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.shareOptionsContainer}>
            <Text style={styles.shareOptionsTitle}>Choose how to share</Text>
            
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => shareViaMethod('whatsapp')}
            >
              <View style={[styles.shareOptionIcon, { backgroundColor: '#25D366' }]}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="message"
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.shareOptionInfo}>
                <Text style={styles.shareOptionTitle}>WhatsApp</Text>
                <Text style={styles.shareOptionDesc}>Share via WhatsApp</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => shareViaMethod('messenger')}
            >
              <View style={[styles.shareOptionIcon, { backgroundColor: '#0084FF' }]}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="message"
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.shareOptionInfo}>
                <Text style={styles.shareOptionTitle}>Messenger</Text>
                <Text style={styles.shareOptionDesc}>Share via Facebook Messenger</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => shareViaMethod('general')}
            >
              <View style={[styles.shareOptionIcon, { backgroundColor: colors.primary }]}>
                <IconSymbol
                  ios_icon_name="square.and.arrow.up"
                  android_material_icon_name="share"
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.shareOptionInfo}>
                <Text style={styles.shareOptionTitle}>More Options</Text>
                <Text style={styles.shareOptionDesc}>Share via other apps</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.trackingCodeDisplay}>
              <Text style={styles.trackingCodeLabel}>Tracking Code</Text>
              <Text style={styles.trackingCodeValue}>{trackingCode}</Text>
              <Text style={styles.trackingUrlLabel}>Tracking URL</Text>
              <Text style={styles.trackingUrlValue}>https://trackme.lk/track/{trackingCode}</Text>
            </View>
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
  authNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  authNoticeText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
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
  trafficAlert: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  trafficAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  trafficAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  trafficAlertText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  shiftRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  shiftRouteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
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
  shareOptionsContainer: {
    padding: 20,
  },
  shareOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  shareOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionInfo: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  shareOptionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  trackingCodeDisplay: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackingCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trackingCodeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: 16,
  },
  trackingUrlLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trackingUrlValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
