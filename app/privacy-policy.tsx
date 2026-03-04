
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';

export default function PrivacyPolicyScreen() {
  console.log('PrivacyPolicyScreen: Rendering');

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            TrackMe LK collects location data, battery level information, and tracking session details to provide real-time GPS tracking services. We collect this information only when you actively start a tracking session.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Your location data is used exclusively to provide live tracking services to you and the people you choose to share your tracking link with. We do not sell or share your personal information with third parties for marketing purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            All tracking data is stored securely in our encrypted database. Location data is retained only for the duration of your tracking session and for a limited period afterward for service improvement purposes. You can request deletion of your data at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Location Permissions</Text>
          <Text style={styles.paragraph}>
            TrackMe LK requires location permissions to function. You can revoke these permissions at any time through your device settings, but this will prevent the app from providing tracking services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Sharing Your Location</Text>
          <Text style={styles.paragraph}>
            You control who can view your location by sharing your unique tracking code. Anyone with this code can view your real-time location during an active tracking session. Keep your tracking codes private and only share them with trusted individuals.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Emergency SOS</Text>
          <Text style={styles.paragraph}>
            When you trigger the Emergency SOS feature, your current location is marked in the system and your tracking session is flagged as an emergency. This information may be shared with emergency services if required.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We use OpenStreetMap for map display and may use Google Maps for navigation. These services have their own privacy policies. We do not share your personal information with these services beyond what is necessary for map functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children&apos;s Privacy</Text>
          <Text style={styles.paragraph}>
            TrackMe LK is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.contactText}>Email: privacy@trackme.lk</Text>
          <Text style={styles.contactText}>Address: Colombo, Sri Lanka</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using TrackMe LK, you agree to this Privacy Policy.
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
