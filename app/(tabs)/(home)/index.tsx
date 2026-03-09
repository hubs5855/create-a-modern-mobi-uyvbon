
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { colors, commonStyles } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();

  console.log('HomeScreen: Component rendered');

  const handlePersonalSafety = async () => {
    console.log('HomeScreen: User tapped Personal Safety button');
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('HomeScreen: Location permission denied');
      Alert.alert('Permission Required', 'Location permission is required for tracking');
      return;
    }

    console.log('HomeScreen: Navigating to personal-safety screen');
    router.push('/personal-safety');
  };

  const handleDeliveryMode = async () => {
    console.log('HomeScreen: User tapped Delivery Mode button');
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('HomeScreen: Location permission denied');
      Alert.alert('Permission Required', 'Location permission is required for tracking');
      return;
    }

    console.log('HomeScreen: Navigating to delivery-mode screen');
    router.push('/delivery-mode');
  };

  const handleEmergencySOS = () => {
    console.log('HomeScreen: User tapped Emergency SOS button');
    Alert.alert(
      'Emergency SOS',
      'This feature requires an active tracking session. Please start Personal Safety tracking first.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'TrackMe LK',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TrackMe LK</Text>
          <Text style={styles.subtitle}>
            Live GPS tracking for personal safety and deliveries
          </Text>
        </View>

        <View style={styles.modesContainer}>
          <TouchableOpacity style={styles.modeCard} onPress={handlePersonalSafety}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeGradient}
            >
              <View style={styles.modeIcon}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="security"
                  size={48}
                  color={colors.text}
                />
              </View>
              <Text style={styles.modeTitle}>Personal Safety</Text>
              <Text style={styles.modeDescription}>
                Share your live location with trusted contacts
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeCard} onPress={handleDeliveryMode}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeGradient}
            >
              <View style={styles.modeIcon}>
                <IconSymbol
                  ios_icon_name="shippingbox.fill"
                  android_material_icon_name="local-shipping"
                  size={48}
                  color={colors.background}
                />
              </View>
              <Text style={[styles.modeTitle, { color: colors.background }]}>Delivery Mode</Text>
              <Text style={[styles.modeDescription, { color: colors.background }]}>
                Track deliveries with real-time updates
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
              <Text style={styles.featureText}>Real-time GPS tracking with live map</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="link.circle.fill"
                android_material_icon_name="link"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.featureText}>Easy sharing with tracking codes</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.featureText}>Auto-expiry timers</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.featureText}>Emergency SOS alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="map.fill"
                android_material_icon_name="map"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.featureText}>Interactive map with route history</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.sosButton} onPress={handleEmergencySOS}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  modesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modeGradient: {
    padding: 24,
    minHeight: 160,
    justifyContent: 'center',
  },
  modeIcon: {
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
    lineHeight: 20,
  },
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuresTitle: {
    fontSize: 20,
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
    flex: 1,
  },
  sosButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
});
