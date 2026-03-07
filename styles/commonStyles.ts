
import { StyleSheet } from 'react-native';

// TrackMe LK - Dark Premium Theme with Blue and Neon Green Accents
export const colors = {
  // Dark theme base
  background: '#0A0E1A',
  card: '#141B2D',
  cardBackground: '#141B2D',
  cardSecondary: '#1A2332',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#8B92A8',
  textTertiary: '#5A6175',
  
  // Primary colors
  primary: '#2E7CF6', // Premium blue
  primaryDark: '#1E5FD9',
  primaryLight: '#4A8FF8',
  
  // Accent colors
  accent: '#00FF88', // Neon green
  accentDark: '#00CC6E',
  accentLight: '#33FFA3',
  
  // Status colors
  success: '#00FF88',
  warning: '#FFB800',
  danger: '#FF3B5C',
  error: '#FF3B5C',
  info: '#2E7CF6',
  
  // UI elements
  border: '#2A3447',
  borderLight: '#3A4557',
  shadow: '#000000',
  overlay: 'rgba(10, 14, 26, 0.9)',
  
  // Special
  highlight: '#00FF88',
  secondary: '#7B61FF',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardGlow: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    boxShadow: `0px 0px 10px ${colors.primary}4D`,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    // CRITICAL: Use default system font for Unicode support (Sinhala/Tamil)
    // Do NOT specify fontFamily - let the system handle it
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    // CRITICAL: Use default system font for Unicode support (Sinhala/Tamil)
    // Do NOT specify fontFamily - let the system handle it
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    // CRITICAL: Use default system font for Unicode support (Sinhala/Tamil)
    // Do NOT specify fontFamily - let the system handle it
  },
  accentButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    // CRITICAL: Use default system font for Unicode support (Sinhala/Tamil)
    // Do NOT specify fontFamily - let the system handle it
  },
});
