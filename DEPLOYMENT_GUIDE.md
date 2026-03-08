
# 🚀 TrackMe LK - Complete Deployment Guide

## ✅ Current Status
Your tracking app is **fully functional** and ready to deploy! The tracking system works with:
- Live GPS tracking
- Real-time map updates
- Battery level and speed monitoring
- Personal Safety and Delivery modes

## 🌐 Deploying to Netlify (Recommended - FREE)

### Step 1: Prepare Your Code

Your app is already configured with:
- ✅ `Index html` - Includes Leaflet map support
- ✅ `netlify.toml` - Build configuration
- ✅ `_redirects` - Routing rules
- ✅ `app/track/[code].tsx` - Tracking page

**No additional setup needed!**

### Step 2: Deploy to Netlify

#### Option A: GitHub Deployment (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and select your repository
   - **Build settings:**
     - Build command: `npx expo export -p web`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Done!** Your site is live at:
   ```
   https://random-name-123.netlify.app
   ```

#### Option B: Manual Deployment

1. **Build locally:**
   ```bash
   npx expo export -p web
   ```

2. **Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `dist` folder to Netlify
   - Site is live instantly!

### Step 3: Test Your Tracking Links

1. **Create a tracking session** in your app
2. **Get the tracking code** (e.g., SAF123456)
3. **Open in browser:**
   ```
   https://YOUR-SITE.netlify.app/track/SAF123456
   ```

**You should see:**
- ✅ Live map with location marker
- ✅ Real-time updates every 5 seconds
- ✅ Battery level and speed
- ✅ Session information

## 🎯 Understanding the Tracking URL

### URL Structure
```
https://YOUR-SITE.netlify.app/track/[TRACKING-CODE]
                              ↑      ↑
                              |      |
                         Route path  Dynamic code
```

### How It Works

1. **User shares tracking link** from app
2. **Recipient opens link** in any browser
3. **Netlify serves** your web app
4. **Expo Router** matches `/track/[code]` route
5. **`app/track/[code].tsx`** component loads
6. **Fetches data** from Supabase using the code
7. **Displays map** with live location

### Example URLs

**Personal Safety:**
```
https://trackme-lk.netlify.app/track/SAF123456
```

**Delivery Mode:**
```
https://trackme-lk.netlify.app/track/DEL789012
```

## 📱 What Files Open When Clicking the Link?

When someone clicks your tracking link:

1. **Netlify receives request:** `GET /track/SAF123456`
2. **`_redirects` file** redirects to `/index.html`
3. **`Index html` loads** with Leaflet map libraries
4. **Expo Router** parses the URL path
5. **`app/track/[code].tsx`** component renders
6. **Map component** (`components/Map.web.tsx`) displays the map
7. **Supabase client** fetches tracking data
8. **Real-time updates** via Supabase subscriptions

**Key files involved:**
- `Index html` - Entry point with map libraries
- `app/track/[code].tsx` - Tracking page logic
- `components/Map.web.tsx` - Map rendering
- `app/integrations/supabase/client.ts` - Data fetching

## 🔧 Configuration Files Explained

### `netlify.toml`
Tells Netlify how to build and deploy your app:
- Build command: `npx expo export -p web`
- Output directory: `dist`
- Routing rules for SPA (Single Page App)

### `_redirects`
Ensures all routes work correctly:
- Redirects all paths to `index.html`
- Allows Expo Router to handle routing

### `Index html`
Main HTML file with:
- Leaflet CSS and JS libraries
- Map container styling
- Full height/width configuration

## 🌐 Custom Domain Setup (Optional)

### Using Your Own Domain (e.g., trackme.lk)

1. **Register domain** at Namecheap, GoDaddy, etc. (~$10-15/year)

2. **In Netlify:**
   - Site settings → Domain management
   - Add custom domain: `trackme.lk`

3. **Update DNS:**
   - Add CNAME record:
     - Name: `@` or `www`
     - Value: `YOUR-SITE.netlify.app`

4. **Wait for SSL** (5-10 minutes)

5. **Update tracking URLs** in your app code:
   ```typescript
   // In app/personal-safety.tsx and app/delivery-mode.tsx
   const PRODUCTION_DOMAIN = 'https://trackme.lk';
   ```

## 🐛 Troubleshooting

### Map Not Showing (White Screen)
**Cause:** Leaflet libraries not loaded
**Solution:** ✅ Already fixed in `Index html`

### Tracking Page Shows 404
**Cause:** Routing not configured
**Solution:** ✅ Already fixed with `netlify.toml` and `_redirects`

### "Tracking session not found"
**Cause:** Invalid tracking code or expired session
**Solution:** Check that:
- Tracking session is active in Supabase
- Tracking code is correct
- Session hasn't expired

### Build Fails on Netlify
**Check build logs** in Netlify dashboard:
- Common issue: Missing dependencies
- Solution: Ensure `package.json` is committed

## 📊 Deployment Checklist

- [x] Code is ready (no changes needed)
- [x] `Index html` configured with Leaflet
- [x] `netlify.toml` created
- [x] `_redirects` created
- [ ] Push code to GitHub
- [ ] Connect GitHub to Netlify
- [ ] Deploy and test tracking link
- [ ] (Optional) Add custom domain

## 🎉 You're Ready to Deploy!

**Next steps:**
1. Push your code to GitHub
2. Connect to Netlify
3. Click "Deploy"
4. Share your tracking links!

**Your tracking links will work at:**
```
https://YOUR-SITE.netlify.app/track/[CODE]
```

## 💡 Pro Tips

1. **Auto-deploy:** Netlify auto-deploys when you push to GitHub
2. **Preview deploys:** Test changes before going live
3. **Environment variables:** Add Supabase keys in Netlify settings
4. **Analytics:** Enable Netlify Analytics to track visitors
5. **Forms:** Use Netlify Forms for contact/feedback

## 🔗 Resources

- **Netlify Docs:** https://docs.netlify.com
- **Expo Web:** https://docs.expo.dev/workflow/web/
- **Leaflet Maps:** https://leafletjs.com
- **Supabase:** https://supabase.com/docs

---

**Questions?** Check `NETLIFY_DEPLOYMENT.md` for detailed step-by-step instructions.

**Current Status:** ✅ Ready to deploy
**Estimated Time:** 10-15 minutes
**Cost:** FREE (Netlify free tier)
