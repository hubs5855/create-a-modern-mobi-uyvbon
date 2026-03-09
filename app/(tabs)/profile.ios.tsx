
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { t, saveLanguage, getCurrentLanguage, loadLanguage } from '@/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  console.log('ProfileScreen: Rendering');

  useEffect(() => {
    loadSavedLanguage();
    checkUserSession();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      await loadLanguage();
      const lang = getCurrentLanguage();
      setCurrentLanguage(lang);
      console.log('ProfileScreen: Current language:', lang);
    } catch (error) {
      console.error('ProfileScreen: Error loading language:', error);
    }
  };

  const checkUserSession = async () => {
    try {
      console.log('ProfileScreen: Checking user session...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('ProfileScreen: Error checking session:', error);
        setIsLoggedIn(false);
        setUserEmail(null);
      } else if (user) {
        console.log('ProfileScreen: User is logged in:', user.email);
        setIsLoggedIn(true);
        setUserEmail(user.email || null);
      } else {
        console.log('ProfileScreen: No user session found');
        setIsLoggedIn(false);
        setUserEmail(null);
      }
    } catch (error) {
      console.error('ProfileScreen: Exception checking session:', error);
      setIsLoggedIn(false);
      setUserEmail(null);
    }
  };

  const handleLogout = async () => {
    console.log('ProfileScreen: User tapped Logout button');
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled'),
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('ProfileScreen: Logging out...');
              await supabase.auth.signOut();
              setIsLoggedIn(false);
              setUserEmail(null);
              console.log('ProfileScreen: Logout successful');
              Alert.alert('Success', 'You have been logged out');
            } catch (error) {
              console.error('ProfileScreen: Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    console.log('ProfileScreen: User tapped Login button');
    router.push('/login');
  };

  const handleLanguageSelect = async (languageCode: string) => {
    console.log('ProfileScreen: User selected language:', languageCode);
    try {
      await saveLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setShowLanguageModal(false);
      console.log('ProfileScreen: Language saved successfully');
      Alert.alert('Success', 'Language changed successfully. Please restart the app for full effect.');
    } catch (error) {
      console.error('ProfileScreen: Error saving language:', error);
      Alert.alert('Error', 'Failed to change language');
    }
  };

  const handleMenuPress = (item: any) => {
    console.log('ProfileScreen: User tapped menu item:', item.title);
    
    if (item.route) {
      router.push(item.route);
    } else if (item.action === 'language') {
      setShowLanguageModal(true);
    } else if (item.action === 'clearCache') {
      handleClearCache();
    }
  };

  const handleClearCache = async () => {
    console.log('ProfileScreen: User tapped Clear Cache button');
    
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and improve app performance. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Clear cache cancelled'),
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('ProfileScreen: Clearing cache...');
              
              // Clear AsyncStorage except for language and active session
              const keys = await AsyncStorage.getAllKeys();
              const keysToRemove = keys.filter(
                key => !key.includes('language') && !key.includes('active_session')
              );
              
              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
                console.log('ProfileScreen: Cleared', keysToRemove.length, 'cache items');
              }
              
              Alert.alert('Success', 'Cache cleared successfully. App performance should improve.');
            } catch (error) {
              console.error('ProfileScreen: Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: t('orders'),
      icon: 'local-shipping',
      iosIcon: 'shippingbox.fill',
      route: '/orders',
    },
    {
      title: t('favorite_locations'),
      icon: 'star',
      iosIcon: 'star.fill',
      route: '/favorites',
    },
    {
      title: t('language'),
      icon: 'language',
      iosIcon: 'globe',
      action: 'language',
    },
    {
      title: 'Clear Cache',
      icon: 'delete',
      iosIcon: 'trash.fill',
      action: 'clearCache',
    },
    {
      title: t('privacy_policy'),
      icon: 'security',
      iosIcon: 'lock.shield.fill',
      route: '/privacy-policy',
    },
    {
      title: t('terms_of_service'),
      icon: 'description',
      iosIcon: 'doc.text.fill',
      route: '/terms-of-service',
    },
  ];

  const languageOptions = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={48}
              color={colors.text}
            />
          </View>
          {isLoggedIn ? (
            <>
              <Text style={styles.userName}>{userEmail}</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t('logout')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.userName}>{t('guest_user')}</Text>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>{t('login')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <IconSymbol
                    ios_icon_name={item.iosIcon}
                    android_material_icon_name={item.icon}
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>TrackMe LK v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2024 TrackMe LK. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
        onRequestClose={() => {
          console.log('ProfileScreen: User closed language modal');
          setShowLanguageModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('select_language')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.languageOptions}>
            {languageOptions.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageNativeName}>{lang.nativeName}</Text>
                </View>
                {currentLanguage === lang.code && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={colors.accent}
                  />
                )}
              </TouchableOpacity>
            ))}
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
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
    borderColor: colors.accent,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  logoutButton: {
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  menuSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
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
  languageOptions: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  languageNativeName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
