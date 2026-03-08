
# 🚀 Netlify Deployment Guide for TrackMe LK

## Quick Deployment Steps

### Method 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub:**
   - Create a new repository on GitHub
   - Push your TrackMe LK code to the repository

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize Netlify
   - Select your TrackMe LK repository

3. **Configure build settings:**
   - **Build command:** `npx expo export -p web`
   - **Publish directory:** `dist`
   - Click "Deploy site"

4. **Your site is live!**
   - Netlify will give you a URL like: `https://random-name-123.netlify.app`
   - Your tracking links will work at: `https://random-name-123.netlify.app/track/SAF123456`

### Method 2: Manual Drag & Drop

1. **Build your app locally:**
   ```bash
   npx expo export -p web
   ```
   This creates a `dist` folder with your web app.

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder onto the Netlify dashboard
   - Your site is live instantly!

## 📱 How to Access Your Tracking Map

After deployment, your tracking URLs will work like this:

**Format:**
```
https://YOUR-SITE-NAME.netlify.app/track/[TRACKING-CODE]
```

**Example:**
```
https://trackme-lk.netlify.app/track/SAF123456
https://trackme-lk.netlify.app/track/DEL789012
```

## 🔧 What Files Are Important?

When Netlify builds your app, it uses these key files:

1. **`Index html`** - The main HTML file (already configured with Leaflet map support)
2. **`netlify.toml`** - Build configuration (created for you)
3. **`_redirects`** - Routing configuration (created for you)
4. **`app/track/[code].tsx`** - Your tracking page component

**You don't need to manually select files!** Netlify will automatically:
- Run the build command
- Use the `dist` folder output
- Apply the routing rules from `netlify.toml` and `_redirects`

## 🌐 Custom Domain Setup (Optional)

If you want to use `trackme.lk` or your own domain:

1. **In Netlify Dashboard:**
   - Go to "Site settings" → "Domain management"
   - Click "Add custom domain"
   - Enter your domain (e.g., `trackme.lk`)

2. **Update DNS at your domain registrar:**
   - Add a CNAME record:
     - **Name:** `@` or `www`
     - **Value:** `YOUR-SITE-NAME.netlify.app`
   - Or use Netlify DNS (easier)

3. **SSL Certificate:**
   - Netlify automatically provides free SSL (HTTPS)
   - Wait 5-10 minutes for certificate provisioning

## 🧪 Testing Your Deployment

1. **Create a tracking session** in your mobile app
2. **Copy the tracking code** (e.g., SAF123456)
3. **Open in browser:**
   ```
   https://YOUR-SITE-NAME.netlify.app/track/SAF123456
   ```
4. **You should see:**
   - Live map with location marker
   - Real-time location updates
   - Battery level, speed, ETA
   - Session information

## 🐛 Troubleshooting

### Map Not Showing (White Screen)
✅ **Already Fixed!** Your `Index html` file includes:
- Leaflet CSS and JS from CDN
- Proper styling for map container
- Full height/width configuration

### Tracking Page Shows 404
✅ **Already Fixed!** The `netlify.toml` and `_redirects` files handle routing.

### Environment Variables
If you need to add Supabase keys:
1. Go to Netlify Dashboard → "Site settings" → "Environment variables"
2. Add:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 📊 What Happens When You Deploy?

1. **Netlify receives your code**
2. **Runs build command:** `npx expo export -p web`
3. **Creates optimized web bundle** in `dist` folder
4. **Deploys to CDN** (fast global delivery)
5. **Applies routing rules** from `netlify.toml`
6. **Provides HTTPS URL** automatically

## 🎯 Summary

**To deploy:**
1. Push code to GitHub
2. Connect GitHub to Netlify
3. Netlify auto-builds and deploys
4. Your tracking links work instantly!

**Your tracking URL format:**
```
https://YOUR-SITE.netlify.app/track/[CODE]
```

**No manual file selection needed!** Netlify handles everything automatically using the configuration files.

## 🔗 Useful Links

- **Netlify Dashboard:** https://app.netlify.com
- **Expo Web Docs:** https://docs.expo.dev/workflow/web/
- **Leaflet Map Docs:** https://leafletjs.com/

---

**Need help?** Check the Netlify build logs if deployment fails. Common issues are usually related to missing dependencies or build command errors.
