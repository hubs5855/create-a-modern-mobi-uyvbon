
# 📍 TrackMe LK - Netlify Deployment Answer

## Your Question
> "I had to upload my app to Netlify from GitHub, but how to open map when click trackme.map.netlify.app? What file open to select?"

---

## ✅ Direct Answer

**You don't need to manually select any files!** 

When you deploy to Netlify from GitHub, everything happens automatically. Here's what you need to know:

### 1. What Netlify Does Automatically

When you connect your GitHub repository to Netlify:

```
1. Netlify reads netlify.toml (build configuration)
2. Runs: npx expo export -p web
3. Creates dist/ folder with your web app
4. Deploys everything to their CDN
5. Your site is live!
```

### 2. How to Deploy (Step-by-Step)

#### A. Connect GitHub to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"GitHub"**
4. Select your **TrackMe LK repository**
5. Configure build settings:
   - **Build command:** `npx expo export -p web`
   - **Publish directory:** `dist`
   - **Base directory:** (leave empty)
6. Click **"Deploy site"**

#### B. Wait for Build

Netlify will:
- Install dependencies
- Build your web app
- Deploy to a URL like: `https://random-name-123.netlify.app`

#### C. Your Site is Live!

Your tracking links will work at:
```
https://YOUR-SITE.netlify.app/track/SAF123456
https://YOUR-SITE.netlify.app/track/DEL789012
```

### 3. How the Map Opens

When someone clicks your tracking link:

```
User clicks: https://YOUR-SITE.netlify.app/track/SAF123456
    ↓
Netlify serves your web app
    ↓
Index html loads (with Leaflet map libraries)
    ↓
Expo Router matches /track/[code] route
    ↓
app/track/[code].tsx component renders
    ↓
Fetches tracking data from Supabase
    ↓
components/Map.web.tsx displays the map
    ↓
Map shows live location with real-time updates
```

### 4. Files Involved (Automatic - No Selection Needed)

| File | Purpose | Auto-Used? |
|------|---------|------------|
| `netlify.toml` | Build configuration | ✅ Yes |
| `_redirects` | Routing rules | ✅ Yes |
| `Index html` | Entry point with Leaflet | ✅ Yes |
| `app/track/[code].tsx` | Tracking page | ✅ Yes |
| `components/Map.web.tsx` | Map component | ✅ Yes |

**All files are automatically included in the build!**

### 5. Testing Your Deployment

After deployment:

1. **Create a tracking session** in your mobile app
2. **Copy the tracking code** (e.g., SAF123456)
3. **Open in browser:**
   ```
   https://YOUR-SITE.netlify.app/track/SAF123456
   ```
4. **You should see:**
   - ✅ Live map with location marker
   - ✅ Real-time updates
   - ✅ Battery level and speed
   - ✅ Session information

### 6. Troubleshooting

#### Map Shows White Screen
**Cause:** Leaflet libraries not loading
**Solution:** ✅ Already fixed! Your `Index html` includes:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

#### Tracking Page Shows 404
**Cause:** Routing not configured
**Solution:** ✅ Already fixed! Your `netlify.toml` and `_redirects` handle SPA routing.

#### Build Fails
**Check:** Netlify build logs in dashboard
**Common fix:** Ensure all dependencies are in `package.json`

### 7. Environment Variables (If Needed)

If you need to add Supabase keys to Netlify:

1. Go to **Site settings** → **Environment variables**
2. Add:
   ```
   EXPO_PUBLIC_SUPABASE_URL = https://dnigrhbebdlwiicjnxnf.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```
3. Redeploy

**Note:** Your keys are already in the code, so this is optional.

### 8. Custom Domain (Optional)

To use `trackme.lk` instead of `random-name.netlify.app`:

1. **In Netlify:**
   - Site settings → Domain management
   - Add custom domain: `trackme.lk`

2. **Update DNS at your domain registrar:**
   - Add CNAME record pointing to your Netlify site

3. **Wait for SSL** (automatic, 5-10 minutes)

---

## 🎯 Summary

**Your Question:** "What file to select?"

**Answer:** **No file selection needed!** Netlify automatically:
- Reads `netlify.toml` for build instructions
- Builds your app with `npx expo export -p web`
- Deploys all files from the `dist` folder
- Configures routing with `_redirects`
- Serves your app with HTTPS

**To deploy:**
1. Push code to GitHub
2. Connect GitHub to Netlify
3. Click "Deploy"
4. Done!

**Your tracking links work at:**
```
https://YOUR-SITE.netlify.app/track/[TRACKING-CODE]
```

**The map opens automatically** because:
- `Index html` includes Leaflet libraries
- `app/track/[code].tsx` fetches data from Supabase
- `components/Map.web.tsx` renders the map
- Everything is bundled in the `dist` folder

---

## 📚 Additional Resources

- **Detailed deployment guide:** See `NETLIFY_DEPLOYMENT.md`
- **How tracking works:** See `HOW_TRACKING_WORKS.md`
- **Quick start:** See `NETLIFY_QUICK_START.md`

## 🚀 Next Steps

1. ✅ Your code is ready (all configuration files created)
2. ⏳ Push to GitHub
3. ⏳ Connect to Netlify
4. ⏳ Deploy
5. ⏳ Test tracking link

**Estimated time:** 10-15 minutes
**Cost:** FREE (Netlify free tier)

---

**Still have questions?** Check the build logs in Netlify dashboard or see the detailed guides in this repository.
