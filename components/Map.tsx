
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useMemo } from 'react';

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
  const htmlContent = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const routeJson = JSON.stringify(routeCoordinates);
    const initialRegionJson = JSON.stringify(initialRegion);
    const hasOnMapPress = !!onMapPress;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
            }
            #map {
              height: 100%;
              width: 100%;
            }
            .driver-icon {
              font-size: 32px;
              text-align: center;
              line-height: 1;
              transition: all 0.5s ease-in-out;
            }
            .customer-icon {
              font-size: 28px;
              text-align: center;
              line-height: 1;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const markers = ${markersJson};
            const routeCoordinates = ${routeJson};
            const initialRegion = ${initialRegionJson};
            const hasOnMapPress = ${hasOnMapPress};
            const centerOnMarkers = ${centerOnMarkers};

            const map = L.map('map', {
              zoomControl: true,
              attributionControl: false,
            }).setView([initialRegion.latitude, initialRegion.longitude], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);

            // Custom icons
            const driverIcon = L.divIcon({
              html: '<div class="driver-icon">🚗</div>',
              className: '',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });

            const customerIcon = L.divIcon({
              html: '<div class="customer-icon">📍</div>',
              className: '',
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            });

            const destinationIcon = L.divIcon({
              html: '<div class="customer-icon">🎯</div>',
              className: '',
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            });

            // Store marker references for smooth animation
            const markerRefs = {};

            // Add markers with custom icons
            markers.forEach(marker => {
              let icon = null;
              if (marker.type === 'driver') {
                icon = driverIcon;
              } else if (marker.type === 'customer') {
                icon = customerIcon;
              } else if (marker.type === 'destination') {
                icon = destinationIcon;
              }

              const leafletMarker = L.marker([marker.latitude, marker.longitude], icon ? { icon } : {}).addTo(map);
              
              if (marker.title) {
                leafletMarker.bindPopup(marker.title);
              }

              // Store reference for animation
              markerRefs[marker.id] = leafletMarker;
            });

            // Draw route polyline if coordinates provided
            if (routeCoordinates && routeCoordinates.length > 1) {
              const routeLatLngs = routeCoordinates.map(coord => [coord.latitude, coord.longitude]);
              L.polyline(routeLatLngs, {
                color: '#4A90E2',
                weight: 4,
                opacity: 0.7,
                smoothFactor: 1,
              }).addTo(map);
            }

            // Handle map clicks if onMapPress is provided
            if (hasOnMapPress) {
              map.on('click', function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mapPress',
                  latitude: lat,
                  longitude: lng,
                }));
              });
            }

            // Fit bounds if there are markers or route
            if (centerOnMarkers) {
              const allPoints = [];
              markers.forEach(m => allPoints.push([m.latitude, m.longitude]));
              routeCoordinates.forEach(c => allPoints.push([c.latitude, c.longitude]));
              
              if (allPoints.length > 0) {
                const bounds = L.latLngBounds(allPoints);
                map.fitBounds(bounds, { padding: [50, 50] });
              }
            }

            // Listen for marker updates for smooth animation
            window.addEventListener('message', function(event) {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'updateMarker' && markerRefs[data.id]) {
                  const marker = markerRefs[data.id];
                  const newLatLng = L.latLng(data.latitude, data.longitude);
                  marker.setLatLng(newLatLng);
                  
                  // Optionally pan to new location
                  if (data.panTo) {
                    map.panTo(newLatLng);
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            });
          </script>
        </body>
      </html>
    `;
  }, [markers, routeCoordinates, initialRegion, onMapPress, centerOnMarkers]);

  const handleMessage = (event: any) => {
    if (!onMapPress) return;
    
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapPress') {
        onMapPress(data.latitude, data.longitude);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});
