
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

export default function ExternalMapScreen() {
  const router = useRouter();
  const [mapUrl, setMapUrl] = useState('');
  const [mapTitle, setMapTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  console.log('ExternalMapScreen: Component mounted');

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('ExternalMapScreen: User not authenticated');
        setUserId(null);
      } else {
        console.log('ExternalMapScreen: User authenticated:', user.id);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('ExternalMapScreen: Error checking auth:', error);
      setUserId(null);
    }
  };

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'MAP';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('ExternalMapScreen: Generated tracking code:', code);
    return code;
  };

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const isValidProtocol = validProtocols.includes(urlObj.protocol);
      console.log('ExternalMapScreen: URL validation:', url, 'Valid:', isValidProtocol);
      return isValidProtocol;
    } catch (error) {
      console.log('ExternalMapScreen: Invalid URL format:', url);
      return false;
    }
  };

  const handleCreateLiveMap = async () => {
    console.log('ExternalMapScreen: User tapped Create Live Map button');

    if (!mapUrl.trim()) {
      Alert.alert('Error', 'Please enter a map URL');
      return;
    }

    if (!validateUrl(mapUrl)) {
      Alert.alert('Error', 'Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    if (!mapTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your map');
      return;
    }

    setLoading(true);

    try {
      const newTrackingCode = generateTrackingCode();
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      console.log('ExternalMapScreen: Creating external map session in Supabase...');
      console.log('ExternalMapScreen: Map URL:', mapUrl);
      console.log('ExternalMapScreen: Map Title:', mapTitle);
      console.log('ExternalMapScreen: Expiry time:', expiryTime.toISOString());

      const insertData: any = {
        session_type: 'external_map',
        status: 'active',
        tracking_code: newTrackingCode,
        expiry_time: expiryTime.toISOString(),
        destination_address: mapTitle,
        order_id: mapUrl,
      };

      if (userId) {
        insertData.user_id = userId;
        console.log('ExternalMapScreen: Adding user_id to session:', userId);
      } else {
        console.log('ExternalMapScreen: Creating anonymous session (no user_id)');
      }

      const { data: session, error: sessionError } = await supabase
        .from('tracking_sessions')
        .insert(insertData)
        .select()
        .single();

      if (sessionError) {
        console.error('ExternalMapScreen: Error creating session:', sessionError);
        Alert.alert('Error', 'Failed to create live map: ' + sessionError.message);
        setLoading(false);
        return;
      }

      console.log('ExternalMapScreen: Session created successfully:', session.id);
      setTrackingCode(newTrackingCode);

      Alert.alert(
        'Success!',
        `Your live map has been created!\n\nTracking Code: ${newTrackingCode}\n\nShare this code with others to let them view your map.`,
        [
          {
            text: 'View Map',
            onPress: () => {
              console.log('ExternalMapScreen: Navigating to tracking screen');
              router.push(`/track/${newTrackingCode}`);
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              console.log('ExternalMapScreen: Resetting form');
              setMapUrl('');
              setMapTitle('');
              setTrackingCode(null);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('ExternalMapScreen: Exception creating live map:', error);
      Alert.alert('Error', 'Failed to create live map: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasteUrl = async () => {
    console.log('ExternalMapScreen: User tapped Paste URL button');
    // Note: Clipboard API is not available in React Native without expo-clipboard
    // For now, users will need to paste manually
    Alert.alert('Info', 'Please paste your map URL into the text field above');
  };

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'External Map Link',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="map.fill"
              android_material_icon_name="map"
              size={48}
              color={colors.accent}
            />
          </View>
          
          <Text style={styles.cardTitle}>Share Your Custom Map</Text>
          <Text style={styles.cardDescription}>
            Upload a link to your custom map (Google Maps, OpenStreetMap, etc.) and make it live for others to view with a tracking code.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Map Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Delivery Route, Trip to Beach"
              placeholderTextColor={colors.textTertiary}
              value={mapTitle}
              onChangeText={(text) => {
                console.log('ExternalMapScreen: Map title changed:', text);
                setMapTitle(text);
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Map URL *</Text>
            <TextInput
              style={[styles.input, styles.urlInput]}
              placeholder="https://maps.google.com/..."
              placeholderTextColor={colors.textTertiary}
              value={mapUrl}
              onChangeText={(text) => {
                console.log('ExternalMapScreen: Map URL changed');
                setMapUrl(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
            />
            <Text style={styles.inputHint}>
              Paste your map link from Google Maps, OpenStreetMap, or any other mapping service
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, (!mapUrl.trim() || !mapTitle.trim()) && styles.createButtonDisabled]}
            onPress={handleCreateLiveMap}
            disabled={loading || !mapUrl.trim() || !mapTitle.trim()}
          >
            <LinearGradient
              colors={(!mapUrl.trim() || !mapTitle.trim()) ? [colors.textTertiary, colors.textTertiary] : [colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="link.circle.fill"
                    android_material_icon_name="link"
                    size={24}
                    color={colors.background}
                  />
                  <Text style={styles.createButtonText}>Create Live Map</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {trackingCode && (
            <View style={styles.successCard}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={32}
                color={colors.success}
              />
              <Text style={styles.successTitle}>Map Created!</Text>
              <Text style={styles.successCode}>{trackingCode}</Text>
              <Text style={styles.successText}>
                Share this tracking code with others to let them view your map
              </Text>
            </View>
          )}
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>How It Works</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureNumber}>
                <Text style={styles.featureNumberText}>1</Text>
              </View>
              <Text style={styles.featureText}>Copy your map link from any mapping service</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureNumber}>
                <Text style={styles.featureNumberText}>2</Text>
              </View>
              <Text style={styles.featureText}>Paste the link and give your map a title</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureNumber}>
                <Text style={styles.featureNumberText}>3</Text>
              </View>
              <Text style={styles.featureText}>Get a tracking code to share with others</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureNumber}>
                <Text style={styles.featureNumberText}>4</Text>
              </View>
              <Text style={styles.featureText}>Anyone with the code can view your map live</Text>
            </View>
          </View>
        </View>

        <View style={styles.examplesCard}>
          <Text style={styles.examplesTitle}>Supported Map Services</Text>
          <View style={styles.examplesList}>
            <View style={styles.exampleItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.exampleText}>Google Maps</Text>
            </View>
            <View style={styles.exampleItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.exampleText}>OpenStreetMap</Text>
            </View>
            <View style={styles.exampleItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.exampleText}>Apple Maps</Text>
            </View>
            <View style={styles.exampleItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.exampleText}>Any web-based map</Text>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
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
  urlInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    lineHeight: 16,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  successCard: {
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  successCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
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
  featureNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  examplesCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  examplesList: {
    gap: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exampleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
