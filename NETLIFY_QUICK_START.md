
# 🚀 Quick Answer: Opening Map on Netlify

## Your Question
> "I had to upload my app to Netlify from GitHub, but how to open map when click trackme.map.netlify.app? What file open to select?"

## Quick Answer

**You don't need to manually select any files!** Netlify automatically handles everything.

### What Happens Automatically:

1. **Netlify reads `netlify.toml`** (build configuration)
2. **Runs build command:** `npx expo export -p web`
3. **Creates `dist` folder** with your web app
4. **Deploys everything** including:
   - `Index html` (with Leaflet map libraries)
   - `app/track/[code].tsx` (tracking page)
   - `components/Map.web.tsx` (map component)
   - All other app files

### How to Deploy:

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Netlify"
git push
```

#### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Select your repository
5. **Build settings:**
   - Build command: `npx expo export -p web`
   - Publish directory: `dist`
6. Click "Deploy site"

#### Step 3: Done!
Your site is live at: `https://YOUR-SITE.netlify.app`

### How to Open the Map:

**Format:**
```
https://YOUR-SITE.netlify.app/track/[TRACKING-CODE]
```

**Example:**
```
https://trackme-lk.netlify.app/track/SAF123456
```

### What Files Are Involved?

When someone clicks your tracking link, these files work together:

1. **`Index html`** - Entry point (includes Leaflet map CSS/JS)
2. **`app/track/[code].tsx`** - Tracking page component
3. **`components/Map.web.tsx`** - Map rendering
4. **`netlify.toml`** - Build configuration
5. **`_redirects`** - Routing rules

**You don't select these manually!** Netlify uses them automatically.

## Testing Your Deployment

1. **Create tracking session** in your app
2. **Copy tracking code** (e.g., SAF123456)
3. **Open in browser:**
   ```
   https://YOUR-SITE.netlify.app/track/SAF123456
   ```
4. **Map should display** with live location!

## Troubleshooting

### Map Shows White Screen
✅ **Already fixed!** Your `Index html` includes Leaflet libraries.

### 404 Error on Tracking Page
✅ **Already fixed!** The `netlify.toml` and `_redirects` handle routing.

### How to Check if It's Working
1. Open Netlify dashboard
2. Go to "Deploys"
3. Check build log for errors
4. Click "Preview deploy" to test

## Summary

**You asked:** "What file to select?"
**Answer:** No file selection needed! Netlify automatically:
- Builds your app
- Deploys all files
- Configures routing
- Serves the map

**Just:**
1. Push to GitHub
2. Connect to Netlify
3. Deploy
4. Use URL: `https://YOUR-SITE.netlify.app/track/[CODE]`

---

**Need more details?** See `NETLIFY_DEPLOYMENT.md` for complete guide.
