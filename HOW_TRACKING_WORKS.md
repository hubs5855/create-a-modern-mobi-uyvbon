
# 🗺️ How Tracking Links Work - Complete Flow

## Overview

When you share a tracking link from your app, here's exactly what happens:

## 1. Creating a Tracking Session (In App)

**User Action:** Taps "Start Safe Tracking" or "Start Delivery"

**What Happens:**
```typescript
// In app/personal-safety.tsx or app/delivery-mode.tsx

1. Generate tracking code (e.g., SAF123456)
2. Create session in Supabase:
   {
     tracking_code: 'SAF123456',
     session_type: 'personal_safety',
     is_active: true,
     expiry_time: '2024-01-15T10:30:00Z'
   }
3. Start GPS tracking (every 5 seconds)
4. Save locations to Supabase
5. Generate tracking link:
   https://YOUR-SITE.netlify.app/track/SAF123456
```

## 2. Sharing the Link

**User Action:** Taps "Share via WhatsApp" or "Copy Link"

**What Happens:**
```typescript
// Share link via native share sheet
const trackingUrl = `https://YOUR-SITE.netlify.app/track/${trackingCode}`;
Share.share({ message: trackingUrl });
```

## 3. Opening the Link (In Browser)

**Recipient Action:** Clicks the tracking link

**What Happens:**

### Step 1: Netlify Receives Request
```
GET https://YOUR-SITE.netlify.app/track/SAF123456
```

### Step 2: Netlify Routing
```
1. Checks _redirects file
2. Redirects to /index.html (SPA routing)
3. Serves Index html with all assets
```

### Step 3: Index html Loads
```html
<!-- Index html -->
<head>
  <!-- Leaflet CSS for map styling -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
  <div id="root"></div>
  <!-- Leaflet JS for map functionality -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</body>
```

### Step 4: React App Initializes
```typescript
// Expo Router parses URL
const route = '/track/SAF123456';
const params = { code: 'SAF123456' };

// Matches route to component
// app/track/[code].tsx
```

### Step 5: Tracking Component Loads
```typescript
// app/track/[code].tsx

export default function PublicTrackingScreen() {
  const { code } = useLocalSearchParams(); // code = 'SAF123456'
  
  // Fetch tracking data from Supabase
  const { data: session } = await supabase
    .from('tracking_sessions')
    .select('*')
    .eq('tracking_code', code)
    .single();
  
  // Fetch location history
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('session_id', session.id)
    .order('timestamp', { ascending: false });
  
  // Display map with locations
  return <Map markers={...} routeCoordinates={...} />;
}
```

### Step 6: Map Renders
```typescript
// components/Map.web.tsx

export function Map({ markers, routeCoordinates }) {
  // Initialize Leaflet map
  const map = L.map(container, {
    center: [latitude, longitude],
    zoom: 13
  });
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);
  
  // Add markers (driver, destination)
  markers.forEach(marker => {
    L.marker([marker.latitude, marker.longitude])
      .addTo(map);
  });
  
  // Draw route polyline
  L.polyline(routeCoordinates, { color: 'blue' })
    .addTo(map);
}
```

### Step 7: Real-Time Updates
```typescript
// Subscribe to Supabase real-time updates
const channel = supabase
  .channel(`locations:session_id=eq.${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'locations',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // New location received!
    updateMapMarker(payload.new);
  })
  .subscribe();

// Also: Auto-refresh every 10 seconds
setInterval(() => fetchTrackingData(), 10000);
```

## 4. What the Recipient Sees

**On Screen:**
- 🗺️ Live map with location marker
- 📍 Current location (updates every 5 seconds)
- 🔋 Battery level
- 🚗 Speed (km/h)
- ⏱️ Time remaining
- 📊 Distance and ETA (for deliveries)
- 📜 Location history (route polyline)

## File Flow Diagram

```
User clicks link
    ↓
Netlify receives request
    ↓
_redirects → /index.html
    ↓
Index html loads
    ↓
Leaflet CSS/JS loads
    ↓
React app initializes
    ↓
Expo Router matches /track/[code]
    ↓
app/track/[code].tsx renders
    ↓
Fetches data from Supabase
    ↓
components/Map.web.tsx renders map
    ↓
Real-time updates via Supabase
    ↓
Map updates every 5 seconds
```

## Key Files and Their Roles

| File | Role |
|------|------|
| `Index html` | Entry point, loads Leaflet libraries |
| `netlify.toml` | Build configuration for Netlify |
| `_redirects` | Routing rules for SPA |
| `app/track/[code].tsx` | Tracking page component |
| `components/Map.web.tsx` | Map rendering with Leaflet |
| `app/integrations/supabase/client.ts` | Database connection |

## Data Flow

```
Mobile App (GPS)
    ↓ (every 5 seconds)
Supabase Database
    ↓ (real-time subscription)
Web Browser (Tracking Page)
    ↓ (renders)
Leaflet Map (Visual Display)
```

## Why It Works on Netlify

1. **Static Site Hosting:** Netlify serves your web app
2. **SPA Routing:** `_redirects` ensures all routes work
3. **CDN Delivery:** Fast global access
4. **HTTPS:** Secure connections
5. **Auto-deploy:** Updates when you push to GitHub

## Summary

**You asked:** "What file opens when clicking the tracking link?"

**Answer:** Multiple files work together:
1. **Netlify** receives the request
2. **`_redirects`** routes to `index.html`
3. **`Index html`** loads with Leaflet libraries
4. **Expo Router** matches `/track/[code]` route
5. **`app/track/[code].tsx`** fetches data and renders
6. **`components/Map.web.tsx`** displays the map
7. **Supabase** provides real-time location updates

**No manual file selection needed!** Everything is automatic.

---

**Next Steps:**
1. Deploy to Netlify (see `NETLIFY_DEPLOYMENT.md`)
2. Test tracking link
3. Share with users!
