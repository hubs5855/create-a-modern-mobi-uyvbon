
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';

export default function TermsOfServiceScreen() {
  console.log('TermsOfServiceScreen: Rendering');

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Terms of Service',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using TrackMe LK, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Service Description</Text>
          <Text style={styles.paragraph}>
            TrackMe LK provides real-time GPS tracking services for personal safety and delivery tracking purposes. The service allows users to share their live location with others through unique tracking codes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your tracking codes</Text>
          <Text style={styles.bulletPoint}>• Using the service in compliance with all applicable laws</Text>
          <Text style={styles.bulletPoint}>• Ensuring you have permission to track or be tracked</Text>
          <Text style={styles.bulletPoint}>• Not using the service for illegal surveillance or stalking</Text>
          <Text style={styles.bulletPoint}>• Providing accurate information when using the service</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Location Tracking</Text>
          <Text style={styles.paragraph}>
            By starting a tracking session, you consent to the collection and sharing of your location data. You can stop tracking at any time. Location data is shared only with individuals who have your tracking code.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Service Availability</Text>
          <Text style={styles.paragraph}>
            We strive to provide reliable service, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, technical issues, or factors beyond our control. We are not liable for any damages resulting from service interruptions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Emergency SOS</Text>
          <Text style={styles.paragraph}>
            The Emergency SOS feature is provided as a convenience and should not be relied upon as your sole means of emergency communication. Always contact local emergency services (119 in Sri Lanka) directly in case of emergency.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Prohibited Uses</Text>
          <Text style={styles.paragraph}>
            You may not use TrackMe LK to:
          </Text>
          <Text style={styles.bulletPoint}>• Track individuals without their knowledge or consent</Text>
          <Text style={styles.bulletPoint}>• Engage in stalking, harassment, or illegal surveillance</Text>
          <Text style={styles.bulletPoint}>• Violate any local, national, or international laws</Text>
          <Text style={styles.bulletPoint}>• Interfere with or disrupt the service</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            TrackMe LK is provided &quot;as is&quot; without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service, including but not limited to loss of data, personal injury, or property damage.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Accuracy of Location Data</Text>
          <Text style={styles.paragraph}>
            While we strive for accuracy, GPS location data may be affected by various factors including device capabilities, signal strength, and environmental conditions. We do not guarantee the precision of location information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to terminate or suspend your access to the service at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users or the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may modify these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms of Service are governed by the laws of Sri Lanka. Any disputes shall be resolved in the courts of Colombo, Sri Lanka.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms of Service, contact us at:
          </Text>
          <Text style={styles.contactText}>Email: support@trackme.lk</Text>
          <Text style={styles.contactText}>Address: Colombo, Sri Lanka</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using TrackMe LK, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 15,
    color: colors.accent,
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
