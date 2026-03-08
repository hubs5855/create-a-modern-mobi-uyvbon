
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { t, saveLanguage, getCurrentLanguage, loadLanguage } from '@/utils/i18n';
import { supabase } from '@/app/integrations/supabase/client';

export default function ProfileScreen() {
  const router = useRouter();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  console.log('ProfileScreen (iOS): Rendering');

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        await loadSavedLanguage();
        await checkUserSession();
      } catch (error) {
        console.error('ProfileScreen (iOS): Error during initialization:', error);
      }
    };

    initializeProfile();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      await loadLanguage();
      const lang = getCurrentLanguage();
      setCurrentLanguage(lang);
      console.log('ProfileScreen (iOS): Current language:', lang);
    } catch (error) {
      console.error('ProfileScreen (iOS): Error loading language:', error);
      setCurrentLanguage('en');
    }
  };

  const checkUserSession = async () => {
    try {
      console.log('ProfileScreen (iOS): Checking user session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('ProfileScreen (iOS): Error getting session:', error);
        setIsLoggedIn(false);
        setUserEmail(null);
        return;
      }

      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || null);
        console.log('ProfileScreen (iOS): User is logged in:', session.user.email);
      } else {
        setIsLoggedIn(false);
        setUserEmail(null);
        console.log('ProfileScreen (iOS): User is not logged in');
      }
    } catch (error) {
      console.error('ProfileScreen (iOS): Exception checking user session:', error);
      setIsLoggedIn(false);
      setUserEmail(null);
    }
  };

  const handleLogout = async () => {
    console.log('ProfileScreen (iOS): User tapped Logout button');
    setShowLogoutModal(false);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('ProfileScreen (iOS): Logout error:', error);
        Alert.alert('Error', 'Failed to logout. Please try again.');
        return;
      }
      
      console.log('ProfileScreen (iOS): Logout successful');
      Alert.alert('Success', 'You have been logged out successfully');
      
      // Navigate to welcome screen
      router.replace('/welcome');
    } catch (error) {
      console.error('ProfileScreen (iOS): Logout exception:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleLogin = () => {
    console.log('ProfileScreen (iOS): User tapped Login button');
    router.push('/login');
  };

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  const handleLanguageSelect = async (languageCode: string) => {
    console.log('ProfileScreen (iOS): User selected language:', languageCode);
    try {
      await saveLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setShowLanguageModal(false);
      console.log('ProfileScreen (iOS): Language changed successfully');
    } catch (error) {
      console.error('ProfileScreen (iOS): Error changing language:', error);
    }
  };

  const menuItems = [
    {
      id: 'orders',
      title: t('orders'),
      icon: 'inventory',
      route: '/orders',
    },
    {
      id: 'favorites',
      title: t('favorite_locations'),
      icon: 'star',
      route: '/favorites',
    },
    {
      id: 'language',
      title: t('language'),
      icon: 'language',
      action: () => setShowLanguageModal(true),
    },
    {
      id: 'privacy',
      title: t('privacy_policy'),
      icon: 'security',
      route: '/privacy-policy',
    },
    {
      id: 'terms',
      title: t('terms_of_service'),
      icon: 'description',
      route: '/terms-of-service',
    },
  ];

  const handleMenuPress = (item: any) => {
    console.log('ProfileScreen (iOS): User tapped menu item:', item.id);
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage);
  const selectedLanguageName = selectedLanguage?.nativeName || 'English';

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('settings'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account-circle"
              size={80}
              color={colors.accent}
            />
          </View>
          <Text style={styles.appName}>{t('app_name')}</Text>
          {isLoggedIn && userEmail && (
            <Text style={styles.userEmail}>{userEmail}</Text>
          )}
          <Text style={styles.appVersion}>{t('version')}</Text>
        </View>

        {/* Login/Logout Section */}
        {isLoggedIn ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutButton]}
              onPress={() => setShowLogoutModal(true)}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="arrow.right.square.fill"
                  android_material_icon_name="logout"
                  size={24}
                  color={colors.error}
                />
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.error}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.menuItem, styles.loginButton]}
              onPress={handleLogin}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="arrow.right.square.fill"
                  android_material_icon_name="login"
                  size={24}
                  color={colors.accent}
                />
                <Text style={[styles.menuItemText, styles.loginText]}>Login</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Data</Text>
          {menuItems.slice(0, 2).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name={item.icon}
                  android_material_icon_name={item.icon}
                  size={24}
                  color={colors.text}
                />
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="language"
                android_material_icon_name="language"
                size={24}
                color={colors.text}
              />
              <Text style={styles.menuItemText}>{t('select_language')}</Text>
            </View>
            <View style={styles.languageValue}>
              <Text style={styles.languageValueText}>{selectedLanguageName}</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('legal')}</Text>
          {menuItems.slice(3).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name={item.icon}
                  android_material_icon_name={item.icon}
                  size={24}
                  color={colors.text}
                />
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('app_description')}
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
        onRequestClose={() => setShowLanguageModal(false)}
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

          <View style={styles.languageList}>
            {languages.map((language) => {
              const isSelected = language.code === currentLanguage;
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <View style={styles.languageItemLeft}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageNativeName}>{language.nativeName}</Text>
                  </View>
                  {isSelected && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Text style={styles.logoutModalTitle}>Logout</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutModalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutModalConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutModalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  loginButton: {
    borderColor: colors.accent,
  },
  loginText: {
    color: colors.accent,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
  },
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageValueText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
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
  languageList: {
    padding: 20,
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageItemSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.cardSecondary,
  },
  languageItemLeft: {
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
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  logoutModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutModalCancelButton: {
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutModalConfirmButton: {
    backgroundColor: colors.error,
  },
  logoutModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logoutModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
