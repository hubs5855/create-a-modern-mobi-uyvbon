
# TrackMe LK - Deployment Guide

## Current Status
Your tracking app is working! However, the tracking links currently point to `trackme.lk` which doesn't have DNS configured yet.

## How Tracking Links Work Now

### In Development (Current)
When you share a tracking link, it generates a URL that can be opened in a web browser. The tracking page (`app/track/[code].tsx`) displays:
- Live map with driver/user location
- Real-time location updates via Supabase
- Battery level, speed, ETA, and distance
- Session information

### Sharing Options
Users can share tracking links via:
1. **General Share** - Opens native share sheet (SMS, Email, etc.)
2. **WhatsApp** - Direct WhatsApp share
3. **Copy Link** - Manual copy/paste

## How to Publish Your App

### Option 1: Expo Web Deployment (Easiest - Free)
Deploy your app as a web app that works in browsers:

```bash
# Build for web
npx expo export -p web

# Deploy to Netlify, Vercel, or GitHub Pages
# Upload the 'dist' folder to your hosting service
```

**Steps:**
1. Register domain `trackme.lk` with a domain registrar (Namecheap, GoDaddy, etc.)
2. Deploy web build to Netlify/Vercel (free tier available)
3. Point `trackme.lk` DNS to your hosting service
4. Update `PRODUCTION_DOMAIN` in `app/personal-safety.tsx` and `app/delivery-mode.tsx`

### Option 2: Mobile App Stores
Publish native apps to Google Play Store and Apple App Store:

**Android (Google Play):**
```bash
# Build Android APK/AAB
eas build --platform android
```

**iOS (App Store):**
```bash
# Build iOS IPA
eas build --platform ios
```

**Requirements:**
- Google Play Developer account ($25 one-time fee)
- Apple Developer account ($99/year)
- App store listings, screenshots, descriptions

### Option 3: Expo Go (Testing Only)
For testing with friends/family without publishing:
- Share your Expo project URL
- Users install Expo Go app
- Users scan QR code to open your app

**Note:** This is NOT suitable for production/public use.

## Recommended Deployment Path

### Phase 1: Web Deployment (Immediate)
1. **Register `trackme.lk` domain** (~$10-15/year)
2. **Deploy to Netlify** (Free tier):
   - Connect GitHub repo
   - Auto-deploy on push
   - Free SSL certificate
   - Custom domain support
3. **Update tracking URLs** in code to use `https://trackme.lk`

### Phase 2: Mobile Apps (Later)
1. **Set up EAS Build** (Expo Application Services)
2. **Create app store accounts**
3. **Submit to stores** (review process takes 1-7 days)

## Quick Start: Deploy to Netlify (Free)

1. **Create Netlify account** at netlify.com
2. **Build your web app:**
   ```bash
   npx expo export -p web
   ```
3. **Drag & drop** the `dist` folder to Netlify
4. **Add custom domain** `trackme.lk` in Netlify settings
5. **Update DNS** at your domain registrar:
   - Add CNAME record pointing to Netlify
6. **Update code** - Change `PRODUCTION_DOMAIN` in:
   - `app/personal-safety.tsx`
   - `app/delivery-mode.tsx`

## Current Tracking URL Format

**Development:**
```
http://192.168.x.x:8081/track/SAF123456
```

**Production (after deployment):**
```
https://trackme.lk/track/SAF123456
```

## Testing Tracking Links

To test tracking links right now:

1. **Start tracking** in the app (Personal Safety or Delivery Mode)
2. **Copy the tracking code** (e.g., SAF123456)
3. **Open in browser:**
   - Development: `http://YOUR_IP:8081/track/SAF123456`
   - Replace `YOUR_IP` with your computer's local IP
4. **View live tracking** in the browser

## Need Help?

- **Expo Documentation:** https://docs.expo.dev/
- **Netlify Deployment:** https://docs.netlify.com/
- **Domain Registration:** Namecheap, GoDaddy, Google Domains
- **EAS Build:** https://docs.expo.dev/build/introduction/

## Summary

✅ **Your app works!** The tracking system is fully functional.
⏳ **Next step:** Deploy to web hosting and configure `trackme.lk` domain.
🚀 **Timeline:** Can be live in 1-2 hours with Netlify + domain registration.

---

**Current Status:** Development mode - tracking works locally
**Goal:** Production deployment with `trackme.lk` domain
**Estimated Cost:** $10-15/year (domain only, hosting is free with Netlify)
