
// Ensure NODE_ENV is set for builds
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Export function for dynamic configuration
module.exports = () => ({
  expo: {
    name: 'TrackMe LK',
    slug: 'trackmelk',
    version: '1.0.0',
    sdkVersion: '52.0.0',
    orientation: 'portrait',
    icon: './assets/images/app-icon-ouc.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    splash: {
      image: './assets/images/app-icon-ouc.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.trackmelk.app',
      newArchEnabled: false,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'TrackMe LK needs your location to provide real-time tracking for personal safety and delivery services.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'TrackMe LK needs continuous access to your location to track your journey and ensure your safety even when the app is in the background.',
        NSLocationAlwaysUsageDescription:
          'TrackMe LK needs continuous access to your location to track your journey and ensure your safety even when the app is in the background.',
        UIBackgroundModes: ['location', 'fetch'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/app-icon-ouc.png',
        backgroundColor: '#000000',
      },
      package: 'com.trackmelk.app',
      newArchEnabled: false,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
        'WAKE_LOCK',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
      ],
    },
    web: {
      favicon: './assets/images/final_quest_240x240.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-font',
      'expo-router',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow TrackMe LK to use your location for real-time tracking.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
    ],
    scheme: 'trackmelk',
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      backendUrl: 'https://ejc7w5dc44x2t7vwbcmdvj8hnuge43dg.app.specular.dev',
    },
    hooks: {
      postPublish: [],
    },
  },
});
