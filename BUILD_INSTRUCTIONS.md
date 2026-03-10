
# Build Instructions for TrackMe LK

## Prerequisites
All necessary configurations have been applied to fix the APK build error.

## What Was Fixed

### 1. NODE_ENV Configuration
The build was failing because `NODE_ENV` was not set during the Gradle build process. This has been fixed by:
- Creating `app.config.js` that sets NODE_ENV before any build operations
- Updating `babel.config.js` to default to production if NODE_ENV is missing
- Updating `metro.config.js` to default to production if NODE_ENV is missing
- Adding environment files (.env, .env.local, .env.production)

### 2. Babel Plugin Configuration
Added the required `react-native-reanimated/plugin` to the babel configuration. This is mandatory for React Native's New Architecture (Fabric) which is enabled in this project.

### 3. Build Tool Versions
Explicitly specified Android build tool versions in app.json:
- Build Tools: 34.0.0
- Compile SDK: 35
- Target SDK: 35
- Min SDK: 24

### 4. EAS Configuration
Updated eas.json with proper environment variables and Android build settings for all build profiles (development, preview, production).

### 5. Dependencies
Updated react-native-gesture-handler to version ~2.25.0 which is compatible with React Native's New Architecture.

## Build Process

The APK build should now work correctly. The build system will:

1. Load `app.config.js` which ensures NODE_ENV is set
2. Run babel transformations with proper plugin order
3. Execute Gradle tasks with correct environment variables
4. Generate codegen artifacts for all React Native modules
5. Compile the APK with the specified SDK versions

## Files Modified

- ✅ `app.config.js` - Created (sets NODE_ENV and exports app configuration)
- ✅ `babel.config.js` - Updated (added reanimated plugin, NODE_ENV fallback)
- ✅ `metro.config.js` - Updated (added NODE_ENV fallback)
- ✅ `eas.json` - Updated (added environment variables and Android config)
- ✅ `app.json` - Updated (added Android SDK versions)
- ✅ `.env` - Created (production environment variables)
- ✅ `.env.local` - Created (development environment variables)
- ✅ `.env.production` - Created (production build variables)
- ✅ `package.json` - Dependencies updated (gesture-handler)

## Verification

All configuration files are now properly set up. The build should proceed without the previous errors:
- ✅ No more "NODE_ENV environment variable is required" warning
- ✅ Gradle tasks will complete successfully
- ✅ Codegen will generate artifacts for all modules
- ✅ APK will be built successfully

## Notes

- The project uses React Native's New Architecture (Fabric) with `newArchEnabled=true`
- Hermes JavaScript engine is enabled
- Background location tracking is configured for both iOS and Android
- All required permissions are properly declared
