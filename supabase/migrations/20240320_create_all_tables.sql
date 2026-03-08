
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.tracking_sessions CASCADE;

-- Create tracking_sessions table
CREATE TABLE public.tracking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('personal_safety', 'delivery')),
    tracking_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'stopped')),
    order_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    destination_latitude DOUBLE PRECISION,
    destination_longitude DOUBLE PRECISION,
    destination_address TEXT,
    delivery_status TEXT CHECK (delivery_status IN ('pending', 'on_the_way', 'delivered', 'cancelled')),
    expiry_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table for GPS tracking
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    battery_level INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    pickup_address TEXT,
    delivery_address TEXT NOT NULL,
    delivery_latitude DOUBLE PRECISION NOT NULL,
    delivery_longitude DOUBLE PRECISION NOT NULL,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'on_the_way', 'delivered', 'cancelled')),
    tracking_session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracking_sessions
CREATE POLICY "Users can view their own tracking sessions"
    ON public.tracking_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking sessions"
    ON public.tracking_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking sessions"
    ON public.tracking_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view tracking sessions by code"
    ON public.tracking_sessions FOR SELECT
    USING (true);

-- RLS Policies for locations
CREATE POLICY "Users can view locations for their sessions"
    ON public.locations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tracking_sessions
            WHERE tracking_sessions.id = locations.session_id
            AND tracking_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert locations for their sessions"
    ON public.locations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tracking_sessions
            WHERE tracking_sessions.id = locations.session_id
            AND tracking_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view all locations"
    ON public.locations FOR SELECT
    USING (true);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites"
    ON public.favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
    ON public.favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites"
    ON public.favorites FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
    ON public.favorites FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
    ON public.orders FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_tracking_sessions_user_id ON public.tracking_sessions(user_id);
CREATE INDEX idx_tracking_sessions_tracking_code ON public.tracking_sessions(tracking_code);
CREATE INDEX idx_locations_session_id ON public.locations(session_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_tracking_session_id ON public.orders(tracking_session_id);
