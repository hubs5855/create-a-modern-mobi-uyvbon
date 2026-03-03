
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';

export default function HomeScreen() {
  const router = useRouter();

  console.log('HomeScreen: Rendering TrackMe LK home screen');

  const handlePersonalSafety = () => {
    console.log('User tapped Personal Safety Mode button');
    router.push('/personal-safety');
  };

  const handleDeliveryMode = () => {
    console.log('User tapped Delivery Mode button');
    router.push('/delivery-mode');
  };

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>TrackMe LK</Text>
          <Text style={styles.tagline}>Live GPS Tracking</Text>
        </View>

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
              <Text style={styles.modeTitle}>Personal Safety</Text>
              <Text style={styles.modeDescription}>
                Share your live location with trusted contacts
              </Text>
              <View style={styles.modeFeatures}>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Live GPS tracking</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Emergency SOS</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.featureText}>Battery sharing</Text>
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
              <Text style={[styles.modeTitle, { color: colors.background }]}>Delivery Mode</Text>
              <Text style={[styles.modeDescription, { color: colors.background }]}>
                Track deliveries with order management
              </Text>
              <View style={styles.modeFeatures}>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.background}
                  />
                  <Text style={[styles.featureText, { color: colors.background }]}>Auto order ID</Text>
                </View>
                <View style={styles.featureRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.background}
                  />
                  <Text style={[styles.featureText, { color: colors.background }]}>Live tracking</Text>
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
    marginBottom: 40,
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
  modesContainer: {
    gap: 20,
    marginBottom: 24,
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
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
