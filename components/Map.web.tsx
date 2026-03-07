
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialRegion.latitude, initialRegion.longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Handle map clicks
    if (onMapPress) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapPress(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialRegion.latitude, initialRegion.longitude, onMapPress]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Custom icons
    const driverIcon = L.divIcon({
      html: '<div style="font-size: 32px; text-align: center; line-height: 1;">🚗</div>',
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
        const marker = markersRef.current[markerData.id];
        marker.setLatLng([markerData.latitude, markerData.longitude]);
      } else {
        // Create new marker
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
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const routeLatLngs = routeCoordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
      polylineRef.current = L.polyline(routeLatLngs, {
        color: '#4A90E2',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
      }).addTo(mapRef.current);
    }

    // Fit bounds if there are markers or route
    if (centerOnMarkers) {
      const allPoints: [number, number][] = [];
      markers.forEach(m => allPoints.push([m.latitude, m.longitude]));
      routeCoordinates.forEach(c => allPoints.push([c.latitude, c.longitude]));
      
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [markers, routeCoordinates, centerOnMarkers]);

  return (
    <View style={[styles.container, style]}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
