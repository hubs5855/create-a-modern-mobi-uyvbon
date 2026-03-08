
# 🗺️ TrackMe LK - Deployment Flow Diagram

## Visual Guide: From GitHub to Live Tracking Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR GITHUB REPOSITORY                       │
│                                                                  │
│  📁 app/                                                         │
│    └── track/                                                    │
│        └── [code].tsx  ← Tracking page component                │
│                                                                  │
│  📁 components/                                                  │
│    └── Map.web.tsx  ← Map rendering with Leaflet                │
│                                                                  │
│  📄 Index html  ← Entry point with Leaflet libraries            │
│  📄 netlify.toml  ← Build configuration                          │
│  📄 _redirects  ← Routing rules                                  │
│  📄 package.json  ← Dependencies                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Push to GitHub]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         NETLIFY BUILD                            │
│                                                                  │
│  1. Reads netlify.toml                                           │
│  2. Runs: npx expo export -p web                                 │
│  3. Creates dist/ folder:                                        │
│     📁 dist/                                                     │
│       ├── index.html  ← Built HTML                               │
│       ├── _expo/                                                 │
│       │   └── static/                                            │
│       │       ├── js/  ← React app bundle                        │
│       │       └── css/  ← Styles                                 │
│       └── assets/  ← Images, fonts                               │
│                                                                  │
│  4. Deploys to CDN                                               │
│  5. Applies _redirects rules                                     │
│  6. Generates HTTPS URL                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Site is Live!]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR LIVE SITE                                │
│                                                                  │
│  🌐 https://YOUR-SITE.netlify.app                                │
│                                                                  │
│  Available routes:                                               │
│  • /  ← Home page                                                │
│  • /login  ← Login page                                          │
│  • /track/SAF123456  ← Tracking page (PUBLIC)                    │
│  • /track/DEL789012  ← Another tracking page                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              [User clicks tracking link]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT HAPPENS IN BROWSER                       │
│                                                                  │
│  1. Browser requests:                                            │
│     GET https://YOUR-SITE.netlify.app/track/SAF123456            │
│                                                                  │
│  2. Netlify CDN responds:                                        │
│     • Checks _redirects: /track/* → /index.html                  │
│     • Serves index.html with all assets                          │
│                                                                  │
│  3. Browser loads index.html:                                    │
│     <head>                                                       │
│       <link rel="stylesheet"                                     │
│         href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>│
│     </head>                                                      │
│     <body>                                                       │
│       <div id="root"></div>                                      │
│       <script src="https://unpkg.com/leaflet@1.9.4/..."></script>│
│     </body>                                                      │
│                                                                  │
│  4. React app initializes:                                       │
│     • Expo Router parses URL: /track/SAF123456                   │
│     • Matches route: app/track/[code].tsx                        │
│     • Extracts param: code = "SAF123456"                         │
│                                                                  │
│  5. Tracking component renders:                                  │
│     • Fetches session from Supabase                              │
│     • Fetches location history                                   │
│     • Passes data to Map component                               │
│                                                                  │
│  6. Map component renders:                                       │
│     • Initializes Leaflet map                                    │
│     • Adds OpenStreetMap tiles                                   │
│     • Places markers (driver, destination)                       │
│     • Draws route polyline                                       │
│                                                                  │
│  7. Real-time updates:                                           │
│     • Subscribes to Supabase changes                             │
│     • Updates map every 5 seconds                                │
│     • Shows battery, speed, ETA                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [User sees live map!]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT USER SEES                                │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TrackMe LK - Live Tracking                               │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │                                                       │ │  │
│  │  │         🗺️  LIVE MAP WITH LOCATION                   │ │  │
│  │  │                                                       │ │  │
│  │  │              🚗  ← Driver marker                      │ │  │
│  │  │               │                                       │ │  │
│  │  │               │  ← Route polyline                     │ │  │
│  │  │               │                                       │ │  │
│  │  │              🎯  ← Destination marker                 │ │  │
│  │  │                                                       │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ● ACTIVE                                                 │  │
│  │  Last updated: 2 seconds ago                              │  │
│  │                                                           │  │
│  │  📊 Live Stats:                                           │  │
│  │  🚗 Speed: 45.2 km/h                                      │  │
│  │  🔋 Battery: 87%                                          │  │
│  │  📍 Distance: 3.2 km                                      │  │
│  │  ⏱️ ETA: 12 min                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Responsibility Chart

```
┌──────────────────────┬─────────────────────────────────────────┐
│ File                 │ What It Does                            │
├──────────────────────┼─────────────────────────────────────────┤
│ netlify.toml         │ Tells Netlify how to build your app     │
│                      │ • Build command                         │
│                      │ • Output directory                      │
│                      │ • Routing rules                         │
├──────────────────────┼─────────────────────────────────────────┤
│ _redirects           │ Ensures SPA routing works               │
│                      │ • Redirects all paths to index.html     │
│                      │ • Allows Expo Router to handle routes   │
├──────────────────────┼─────────────────────────────────────────┤
│ Index html           │ Entry point for web app                 │
│                      │ • Loads Leaflet CSS/JS                  │
│                      │ • Provides root div for React           │
│                      │ • Sets up map container styling         │
├──────────────────────┼─────────────────────────────────────────┤
│ app/track/[code].tsx │ Tracking page component                 │
│                      │ • Fetches tracking data from Supabase   │
│                      │ • Manages real-time updates             │
│                      │ • Displays session info                 │
│                      │ • Renders Map component                 │
├──────────────────────┼─────────────────────────────────────────┤
│ components/          │ Map rendering with Leaflet              │
│ Map.web.tsx          │ • Initializes Leaflet map               │
│                      │ • Adds markers and polylines            │
│                      │ • Handles map interactions              │
│                      │ • Updates in real-time                  │
├──────────────────────┼─────────────────────────────────────────┤
│ app/integrations/    │ Supabase database connection            │
│ supabase/client.ts   │ • Fetches tracking sessions             │
│                      │ • Fetches location history              │
│                      │ • Subscribes to real-time updates       │
└──────────────────────┴─────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│ Mobile App  │  User starts tracking
│ (GPS)       │  ↓
└─────────────┘  Sends location every 5 seconds
       ↓
       ↓ INSERT INTO locations
       ↓
┌─────────────┐
│  Supabase   │  Stores:
│  Database   │  • tracking_sessions
│             │  • locations (GPS data)
└─────────────┘
       ↓
       ↓ Real-time subscription
       ↓
┌─────────────┐
│ Web Browser │  User opens tracking link
│ (Tracking   │  ↓
│  Page)      │  Fetches session & locations
└─────────────┘  ↓
       ↓         Subscribes to updates
       ↓
┌─────────────┐
│ Leaflet Map │  Displays:
│ (Visual)    │  • Current location marker
│             │  • Route polyline
│             │  • Destination marker
└─────────────┘  Updates every 5 seconds
```

## Deployment Checklist

```
✅ Code is ready
   ├── ✅ netlify.toml created
   ├── ✅ _redirects created
   ├── ✅ Index html configured with Leaflet
   ├── ✅ app/track/[code].tsx implemented
   └── ✅ components/Map.web.tsx implemented

⏳ Deploy to Netlify
   ├── ⏳ Push code to GitHub
   ├── ⏳ Connect GitHub to Netlify
   ├── ⏳ Configure build settings
   └── ⏳ Click "Deploy site"

⏳ Test deployment
   ├── ⏳ Create tracking session in app
   ├── ⏳ Copy tracking code
   ├── ⏳ Open tracking link in browser
   └── ⏳ Verify map displays correctly

✨ Optional: Custom domain
   ├── ⏳ Register domain (e.g., trackme.lk)
   ├── ⏳ Add domain in Netlify
   ├── ⏳ Update DNS records
   └── ⏳ Wait for SSL certificate
```

## Summary

**Your Question:** "What file to select when deploying to Netlify?"

**Answer:** **No file selection needed!**

Netlify automatically:
1. Reads `netlify.toml` for build instructions
2. Runs `npx expo export -p web`
3. Deploys the `dist` folder
4. Applies routing from `_redirects`
5. Serves your app with HTTPS

**When user clicks tracking link:**
1. Netlify serves `index.html` (with Leaflet)
2. React app loads
3. Expo Router matches `/track/[code]`
4. `app/track/[code].tsx` fetches data
5. `components/Map.web.tsx` renders map
6. User sees live tracking!

**Everything is automatic!** Just push to GitHub and connect to Netlify.

---

**See also:**
- `README_NETLIFY.md` - Direct answer to your question
- `NETLIFY_DEPLOYMENT.md` - Complete deployment guide
- `HOW_TRACKING_WORKS.md` - Technical details
