
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { t, saveLanguage, getCurrentLanguage, loadLanguage } from '@/utils/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  console.log('ProfileScreen (iOS): Rendering');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    await loadLanguage();
    const lang = getCurrentLanguage();
    setCurrentLanguage(lang);
    console.log('Current language:', lang);
  };

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  const handleLanguageSelect = async (languageCode: string) => {
    console.log('User selected language:', languageCode);
    await saveLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setShowLanguageModal(false);
    // Force re-render by updating state
    setTimeout(() => {
      console.log('Language changed, UI will update');
    }, 100);
  };

  const menuItems = [
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
    console.log('User tapped menu item:', item.id);
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
          <Text style={styles.appVersion}>{t('version')}</Text>
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
          {menuItems.slice(1).map((item) => (
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
});
