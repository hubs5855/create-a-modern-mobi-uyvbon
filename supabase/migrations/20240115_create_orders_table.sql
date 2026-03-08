
-- Create orders table for delivery orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  pickup_address TEXT,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION NOT NULL,
  delivery_longitude DOUBLE PRECISION NOT NULL,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'on_the_way', 'delivered', 'cancelled')),
  tracking_session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders
CREATE POLICY "Users can update their own orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own orders
CREATE POLICY "Users can delete their own orders"
  ON public.orders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing favorites table to ensure RLS is enabled
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

-- Create RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
  ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites"
  ON public.favorites
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update tracking_sessions to ensure proper RLS
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.tracking_sessions;
DROP POLICY IF EXISTS "Anyone can view active sessions by tracking code" ON public.tracking_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.tracking_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.tracking_sessions;

-- Create RLS policies for tracking_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.tracking_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active sessions by tracking code"
  ON public.tracking_sessions
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create their own sessions"
  ON public.tracking_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.tracking_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update locations table RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view locations for active sessions" ON public.locations;
DROP POLICY IF EXISTS "Users can insert locations for their sessions" ON public.locations;

-- Create RLS policies for locations
CREATE POLICY "Anyone can view locations for active sessions"
  ON public.locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracking_sessions
      WHERE tracking_sessions.id = locations.session_id
      AND tracking_sessions.status = 'active'
    )
  );

CREATE POLICY "Users can insert locations for their sessions"
  ON public.locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracking_sessions
      WHERE tracking_sessions.id = locations.session_id
      AND tracking_sessions.user_id = auth.uid()
    )
  );
