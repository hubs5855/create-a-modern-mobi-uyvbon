
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useMemo } from 'react';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

interface MapProps {
  markers?: MapMarker[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: ViewStyle;
  showsUserLocation?: boolean;
  onMapPress?: (latitude: number, longitude: number) => void;
}

export function Map({
  markers = [],
  initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  style,
  showsUserLocation = false,
  onMapPress,
}: MapProps) {
  const htmlContent = useMemo(() => {
    const markersJson = JSON.stringify(markers);
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
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const markers = ${markersJson};
            const initialRegion = ${initialRegionJson};
            const hasOnMapPress = ${hasOnMapPress};

            const map = L.map('map', {
              zoomControl: true,
              attributionControl: false,
            }).setView([initialRegion.latitude, initialRegion.longitude], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);

            // Add markers
            markers.forEach(marker => {
              const leafletMarker = L.marker([marker.latitude, marker.longitude]).addTo(map);
              if (marker.title) {
                leafletMarker.bindPopup(marker.title);
              }
            });

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

            // Fit bounds if there are markers
            if (markers.length > 0) {
              const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          </script>
        </body>
      </html>
    `;
  }, [markers, initialRegion, onMapPress]);

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
