
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ViewStyle, Text, ActivityIndicator } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type?: 'driver' | 'customer' | 'destination' | 'default';
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface MapProps {
  markers?: MapMarker[];
  routeCoordinates?: RouteCoordinate[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: ViewStyle;
  showsUserLocation?: boolean;
  onMapPress?: (latitude: number, longitude: number) => void;
  centerOnMarkers?: boolean;
}

export function Map({
  markers = [],
  routeCoordinates = [],
  initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  style,
  showsUserLocation = false,
  onMapPress,
  centerOnMarkers = true,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Map.web: Initializing map component');
    if (!mapContainerRef.current) {
      console.log('Map.web: Container not ready');
      return;
    }

    if (mapRef.current) {
      console.log('Map.web: Map already initialized');
      return;
    }

    console.log('Map.web: Creating Leaflet map instance at', initialRegion.latitude, initialRegion.longitude);
    
    try {
      // Initialize map with explicit options
      const map = L.map(mapContainerRef.current, {
        center: [initialRegion.latitude, initialRegion.longitude],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: false,
      });

      console.log('Map.web: Adding OpenStreetMap tile layer');
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      });

      tileLayer.on('load', () => {
        console.log('Map.web: Tiles loaded successfully');
        setMapReady(true);
      });

      tileLayer.on('tileerror', (error) => {
        console.error('Map.web: Tile loading error:', error);
      });

      tileLayer.addTo(map);

      mapRef.current = map;
      console.log('Map.web: Map initialized successfully');

      // Handle map clicks
      if (onMapPress) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          console.log('Map.web: Map clicked at', e.latlng.lat, e.latlng.lng);
          onMapPress(e.latlng.lat, e.latlng.lng);
        });
      }

      // Force map to recalculate size after initialization
      setTimeout(() => {
        if (mapRef.current) {
          console.log('Map.web: Invalidating map size');
          mapRef.current.invalidateSize();
          setMapReady(true);
        }
      }, 200);

      // Additional size recalculation after a longer delay
      setTimeout(() => {
        if (mapRef.current) {
          console.log('Map.web: Second invalidateSize call');
          mapRef.current.invalidateSize();
        }
      }, 500);

    } catch (error) {
      console.error('Map.web: Error initializing map:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
    }

    return () => {
      console.log('Map.web: Cleaning up map');
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (error) {
          console.error('Map.web: Error cleaning up map:', error);
        }
      }
    };
  }, [initialRegion.latitude, initialRegion.longitude, onMapPress]);

  useEffect(() => {
    if (!mapRef.current) {
      console.log('Map.web: Map not ready for markers update');
      return;
    }

    console.log('Map.web: Updating markers, count:', markers.length);

    // Custom icons
    const driverIcon = L.divIcon({
      html: '<div style="font-size: 32px; text-align: center; line-height: 1; transform: translateY(-50%);">🚗</div>',
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const customerIcon = L.divIcon({
      html: '<div style="font-size: 28px; text-align: center; line-height: 1;">📍</div>',
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const destinationIcon = L.divIcon({
      html: '<div style="font-size: 28px; text-align: center; line-height: 1;">🎯</div>',
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Update or create markers
    const currentMarkerIds = new Set(markers.map(m => m.id));
    
    // Remove markers that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!currentMarkerIds.has(id)) {
        console.log('Map.web: Removing marker', id);
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(markerData => {
      let icon = null;
      if (markerData.type === 'driver') {
        icon = driverIcon;
      } else if (markerData.type === 'customer') {
        icon = customerIcon;
      } else if (markerData.type === 'destination') {
        icon = destinationIcon;
      }

      if (markersRef.current[markerData.id]) {
        // Update existing marker position with smooth animation
        console.log('Map.web: Updating marker', markerData.id);
        const marker = markersRef.current[markerData.id];
        marker.setLatLng([markerData.latitude, markerData.longitude]);
      } else {
        // Create new marker
        console.log('Map.web: Creating new marker', markerData.id, 'at', markerData.latitude, markerData.longitude);
        const marker = L.marker(
          [markerData.latitude, markerData.longitude],
          icon ? { icon } : {}
        ).addTo(mapRef.current!);
        
        if (markerData.title) {
          marker.bindPopup(markerData.title);
        }

        markersRef.current[markerData.id] = marker;
      }
    });

    // Update route polyline
    if (polylineRef.current) {
      console.log('Map.web: Removing old polyline');
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      console.log('Map.web: Drawing route with', routeCoordinates.length, 'points');
      const routeLatLngs = routeCoordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
      polylineRef.current = L.polyline(routeLatLngs, {
        color: '#4A90E2',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
      }).addTo(mapRef.current);
    }

    // Fit bounds if there are markers or route
    if (centerOnMarkers && mapReady) {
      const allPoints: [number, number][] = [];
      markers.forEach(m => allPoints.push([m.latitude, m.longitude]));
      routeCoordinates.forEach(c => allPoints.push([c.latitude, c.longitude]));
      
      if (allPoints.length > 0) {
        console.log('Map.web: Fitting bounds to', allPoints.length, 'points');
        try {
          const bounds = L.latLngBounds(allPoints);
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (error) {
          console.error('Map.web: Error fitting bounds:', error);
        }
      }
    }
  }, [markers, routeCoordinates, centerOnMarkers, mapReady]);

  if (mapError) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>{mapError}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '300px',
          backgroundColor: '#f0f0f0',
          position: 'relative',
          zIndex: 0,
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 300,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.9)',
    zIndex: 1000,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
});
