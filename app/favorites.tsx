
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { Map } from '@/components/Map';

interface Favorite {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  console.log('FavoritesScreen: Rendering');

  const fetchFavorites = useCallback(async (uid: string) => {
    console.log('FavoritesScreen: Fetching favorites for user:', uid);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('FavoritesScreen: Error fetching favorites:', error);
        Alert.alert('Error', 'Failed to load favorites: ' + error.message);
      } else {
        console.log('FavoritesScreen: Favorites fetched:', data?.length || 0);
        setFavorites(data || []);
      }
    } catch (error) {
      console.error('FavoritesScreen: Exception fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthAndFetch = useCallback(async () => {
    console.log('FavoritesScreen: Checking authentication...');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('FavoritesScreen: User not authenticated, redirecting to login');
        Alert.alert(
          'Authentication Required',
          'Please log in to manage favorite locations',
          [
            {
              text: 'Log In',
              onPress: () => router.push('/login'),
            },
            {
              text: 'Cancel',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
        setLoading(false);
        return;
      }

      console.log('FavoritesScreen: User authenticated:', user.id);
      setUserId(user.id);
      await fetchFavorites(user.id);
    } catch (error) {
      console.error('FavoritesScreen: Error checking auth:', error);
      setLoading(false);
    }
  }, [router, fetchFavorites]);

  useEffect(() => {
    checkAuthAndFetch();
    getCurrentLocation();
  }, [checkAuthAndFetch]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    console.log('FavoritesScreen: User searching for location:', searchQuery);
    setSearchLoading(true);

    try {
      const results = await Location.geocodeAsync(searchQuery);
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log('FavoritesScreen: Search result:', result);
        
        setSelectedLocation({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        setNewAddress(searchQuery);
        Alert.alert('Success', 'Location found! You can adjust the pin on the map if needed.');
      } else {
        Alert.alert('Not Found', 'Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('FavoritesScreen: Error searching location:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapPress = (latitude: number, longitude: number) => {
    console.log('FavoritesScreen: User selected location on map:', { latitude, longitude });
    setSelectedLocation({ latitude, longitude });
  };

  const handleAddFavorite = () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to add favorites');
      return;
    }
    console.log('FavoritesScreen: User tapped Add Favorite button');
    setShowAddModal(true);
    setNewLabel('');
    setNewAddress('');
    setSelectedLocation(null);
    setSearchQuery('');
  };

  const handleSaveFavorite = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to save favorites');
      return;
    }

    if (!newLabel.trim()) {
      Alert.alert('Error', 'Please enter a label for this location');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    console.log('FavoritesScreen: Saving favorite for user:', userId);
    console.log('FavoritesScreen: Favorite data:', { label: newLabel, address: newAddress, location: selectedLocation });
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          label: newLabel.trim(),
          address: newAddress.trim() || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        })
        .select()
        .single();

      if (error) {
        console.error('FavoritesScreen: Error saving favorite:', error);
        Alert.alert('Error', 'Failed to save favorite: ' + error.message);
      } else {
        console.log('FavoritesScreen: Favorite saved successfully:', data);
        setFavorites([data, ...favorites]);
        setShowAddModal(false);
        Alert.alert('Success', 'Favorite location saved!');
      }
    } catch (error: any) {
      console.error('FavoritesScreen: Exception saving favorite:', error);
      Alert.alert('Error', 'Failed to save favorite: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFavorite = async (id: string, label: string) => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to delete favorites');
      return;
    }

    console.log('FavoritesScreen: User requested to delete favorite:', id);

    Alert.alert(
      'Delete Favorite',
      `Are you sure you want to delete "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('FavoritesScreen: Deleting favorite:', id);
            try {
              const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

              if (error) {
                console.error('FavoritesScreen: Error deleting favorite:', error);
                Alert.alert('Error', 'Failed to delete favorite: ' + error.message);
              } else {
                console.log('FavoritesScreen: Favorite deleted successfully');
                setFavorites(favorites.filter(f => f.id !== id));
              }
            } catch (error: any) {
              console.error('FavoritesScreen: Exception deleting favorite:', error);
              Alert.alert('Error', 'Failed to delete favorite: ' + (error.message || 'Unknown error'));
            }
          },
        },
      ]
    );
  };

  const labelText = newLabel || 'Enter label';
  const addressText = newAddress || 'Enter address';

  return (
    <SafeAreaView style={[commonStyles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Favorite Locations',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : !userId ? (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="person.fill"
            android_material_icon_name="person"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyTitle}>Authentication Required</Text>
          <Text style={styles.emptyDescription}>
            Please log in to manage your favorite locations.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {favorites.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyTitle}>No Favorite Locations</Text>
              <Text style={styles.emptyDescription}>
                Save your frequently visited places like Home, Office, or School for quick access.
              </Text>
            </View>
          ) : (
            <View style={styles.favoritesList}>
              {favorites.map((favorite) => (
                <View key={favorite.id} style={styles.favoriteCard}>
                  <View style={styles.favoriteHeader}>
                    <View style={styles.favoriteIcon}>
                      <IconSymbol
                        ios_icon_name="mappin.circle.fill"
                        android_material_icon_name="place"
                        size={24}
                        color={colors.accent}
                      />
                    </View>
                    <View style={styles.favoriteInfo}>
                      <Text style={styles.favoriteLabel}>{favorite.label}</Text>
                      <Text style={styles.favoriteAddress}>{favorite.address}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFavorite(favorite.id, favorite.label)}
                    >
                      <IconSymbol
                        ios_icon_name="trash.fill"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addButton} onPress={handleAddFavorite}>
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color={colors.background}
            />
            <Text style={styles.addButtonText}>Add Favorite Location</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add Favorite Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Favorite</Text>
            <TouchableOpacity onPress={handleSaveFavorite} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Label Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Label (e.g., Home, Office)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter label"
                placeholderTextColor={colors.textTertiary}
                value={newLabel}
                onChangeText={setNewLabel}
              />
            </View>

            {/* Search Bar */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Search Location</Text>
              <View style={styles.searchBar}>
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a location..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchLocation}
                  returnKeyType="search"
                />
                {searchLoading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <TouchableOpacity onPress={handleSearchLocation}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-forward"
                      size={24}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.searchHint}>Or tap on the map to select a location</Text>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
              {currentLocation && (
                <Map
                  markers={selectedLocation ? [
                    {
                      id: 'selected',
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                      title: 'Selected Location',
                    },
                  ] : []}
                  initialRegion={{
                    latitude: selectedLocation?.latitude || currentLocation.latitude,
                    longitude: selectedLocation?.longitude || currentLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  style={styles.map}
                  onMapPress={handleMapPress}
                />
              )}
              {selectedLocation && (
                <View style={styles.selectedBadge}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.selectedText}>Location selected</Text>
                </View>
              )}
            </View>

            {/* Address Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address (Optional)</Text>
              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Enter or edit address"
                placeholderTextColor={colors.textTertiary}
                value={newAddress}
                onChangeText={setNewAddress}
                multiline
              />
            </View>
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  favoritesList: {
    gap: 12,
    marginBottom: 20,
  },
  favoriteCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  modalContent: {
    padding: 20,
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
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});
