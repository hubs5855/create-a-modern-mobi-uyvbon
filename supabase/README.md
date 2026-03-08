
# Supabase Database Setup

This document contains the SQL migrations needed to set up the complete database schema for TrackMe LK.

## How to Apply Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dnweopctkrhuuepfadij
2. Navigate to the SQL Editor
3. Copy and paste the SQL from `migrations/20240115_create_orders_table.sql`
4. Click "Run" to execute the migration

## Database Schema Overview

### Tables

#### 1. **profiles**
Stores user profile information.
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `full_name` (TEXT)
- `phone_number` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### 2. **tracking_sessions**
Stores active tracking sessions for both personal safety and delivery modes.
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `mode` (TEXT) - 'personal' or 'delivery'
- `status` (TEXT) - 'active', 'stopped', 'completed'
- `tracking_code` (TEXT, UNIQUE)
- `order_id` (TEXT) - For delivery mode
- `customer_name` (TEXT) - For delivery mode
- `delivery_address` (TEXT)
- `delivery_status` (TEXT) - 'pending', 'on_the_way', 'delivered', 'cancelled'
- `destination_latitude` (DOUBLE PRECISION)
- `destination_longitude` (DOUBLE PRECISION)
- `destination_address` (TEXT)
- `expiry_time` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### 3. **locations**
Stores GPS location updates for tracking sessions (updated every 5 seconds).
- `id` (UUID, PK)
- `session_id` (UUID, FK to tracking_sessions)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `speed` (DOUBLE PRECISION) - in km/h
- `battery_level` (INTEGER) - percentage
- `timestamp` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

#### 4. **favorites**
Stores user's favorite locations.
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `label` (TEXT) - e.g., "Home", "Office"
- `address` (TEXT)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### 5. **orders** (NEW)
Stores delivery order records.
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `order_id` (TEXT, UNIQUE) - e.g., "ORD-12345"
- `customer_name` (TEXT)
- `customer_phone` (TEXT)
- `pickup_address` (TEXT)
- `pickup_latitude` (DOUBLE PRECISION)
- `pickup_longitude` (DOUBLE PRECISION)
- `delivery_address` (TEXT, REQUIRED)
- `delivery_latitude` (DOUBLE PRECISION, REQUIRED)
- `delivery_longitude` (DOUBLE PRECISION, REQUIRED)
- `delivery_status` (TEXT) - 'pending', 'on_the_way', 'delivered', 'cancelled'
- `tracking_session_id` (UUID, FK to tracking_sessions)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### profiles, favorites, orders
- Users can only view, create, update, and delete their own records
- Policy: `auth.uid() = user_id`

### tracking_sessions
- Users can view their own sessions
- Anyone can view active sessions by tracking code (for public tracking)
- Users can only create and update their own sessions

### locations
- Anyone can view locations for active tracking sessions (for public tracking)
- Users can only insert locations for their own tracking sessions

## Indexes

The following indexes are created for optimal query performance:

- `idx_orders_user_id` on `orders(user_id)`
- `idx_orders_order_id` on `orders(order_id)`
- `idx_orders_status` on `orders(delivery_status)`
- `idx_orders_created_at` on `orders(created_at DESC)`

## Triggers

### Auto-update `updated_at` timestamp
A trigger automatically updates the `updated_at` column whenever a record is modified in the `orders` table.

## Features Enabled

### 1. Order Management
- Create delivery orders with auto-generated order IDs
- Track order status (pending → on the way → delivered)
- View order history
- Delete orders

### 2. Favorites Management
- Save favorite locations (home, office, etc.)
- Quick access to frequently used addresses
- Edit and delete favorites

### 3. Real-time Tracking
- Live GPS updates every 5 seconds
- Battery level monitoring
- Speed tracking
- Public tracking links

### 4. User Authentication
- Supabase Auth integration
- Email/password authentication
- Row-level security for data isolation

## Migration Status

- ✅ profiles table (existing)
- ✅ tracking_sessions table (existing, updated with destination fields)
- ✅ locations table (existing)
- ✅ favorites table (existing, RLS policies updated)
- ✅ orders table (NEW - needs to be created)

## Next Steps

1. Run the migration SQL in Supabase SQL Editor
2. Verify all tables are created successfully
3. Test RLS policies by creating test data
4. Verify the app can read/write to all tables

## Troubleshooting

If you encounter any issues:

1. **Permission Denied Errors**: Check that RLS policies are correctly configured
2. **Foreign Key Violations**: Ensure referenced records exist before creating dependent records
3. **Unique Constraint Violations**: Check for duplicate order_id or tracking_code values

## Support

For issues or questions, check the Supabase documentation:
- https://supabase.com/docs/guides/database
- https://supabase.com/docs/guides/auth/row-level-security
