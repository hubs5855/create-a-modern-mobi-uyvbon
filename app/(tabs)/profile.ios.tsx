
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';

export default function ProfileScreen() {
  console.log('ProfileScreen: Rendering (iOS)');

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={48}
              color={colors.text}
            />
          </View>
          <Text style={styles.name}>TrackMe User</Text>
          <Text style={styles.email}>user@trackme.lk</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="security"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Safety Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="shippingbox.fill"
                android_material_icon_name="local-shipping"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About TrackMe LK</Text>
            <Text style={styles.infoText}>
              Live GPS tracking for personal safety and delivery management. Designed for Sri Lanka.
            </Text>
          </View>
        </View>

        {/* Language Support */}
        <View style={styles.languageCard}>
          <Text style={styles.languageTitle}>Language Support</Text>
          <View style={styles.languageList}>
            <View style={styles.languageItem}>
              <Text style={styles.languageFlag}>🇬🇧</Text>
              <Text style={styles.languageText}>English</Text>
            </View>
            <View style={styles.languageItem}>
              <Text style={styles.languageFlag}>🇱🇰</Text>
              <Text style={styles.languageText}>සිංහල (Sinhala)</Text>
            </View>
            <View style={styles.languageItem}>
              <Text style={styles.languageFlag}>🇱🇰</Text>
              <Text style={styles.languageText}>தமிழ் (Tamil)</Text>
            </View>
          </View>
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
    marginBottom: 32,
    marginTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  languageCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
