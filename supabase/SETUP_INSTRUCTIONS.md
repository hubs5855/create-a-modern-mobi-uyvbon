
# Supabase Database Setup Instructions

## Your Supabase Project Details
- **Project URL**: https://dnigrhbebdlwiicjnxnf.supabase.co
- **Project ID**: dnigrhbebdlwiicjnxnf

## Step 1: Run the Database Migration

You need to create the database tables for TrackMe LK to work properly.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/dnigrhbebdlwiicjnxnf
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `supabase/migrations/20240320_create_all_tables.sql`
5. Paste it into the SQL editor
6. Click "Run" button
7. You should see "Success. No rows returned" message

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
supabase db push
```

## Step 2: Verify Tables Were Created

1. In Supabase Dashboard, go to "Table Editor"
2. You should see these tables:
   - `tracking_sessions` - Stores active tracking sessions
   - `locations` - Stores GPS location updates
   - `favorites` - Stores user's favorite locations
   - `orders` - Stores delivery orders

## Step 3: Test the Connection

1. Restart your Expo development server
2. Try creating a favorite location
3. Try starting a Personal Safety or Delivery tracking session
4. Check the Supabase Table Editor to see if data is being saved

## Troubleshooting

### Error: "Could not find the 'session_type' column"
- This means the tables haven't been created yet
- Run the migration SQL from Step 1

### Error: "new row violates row-level security policy"
- Make sure you're logged in to the app
- RLS policies require authentication for most operations

### Error: "relation 'tracking_sessions' does not exist"
- The tables haven't been created
- Run the migration SQL from Step 1

## What Each Table Does

### tracking_sessions
Stores active tracking sessions for both Personal Safety and Delivery modes.
- Includes tracking code, destination, expiry time, and session type

### locations
Stores GPS location updates for each tracking session.
- Linked to tracking_sessions via session_id
- Includes latitude, longitude, speed, and battery level

### favorites
Stores user's favorite locations for quick access.
- User-specific (protected by RLS)
- Includes label, address, and coordinates

### orders
Stores delivery orders with customer information.
- Linked to tracking_sessions
- Includes delivery status and addresses
