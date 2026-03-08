
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          phone_number: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          phone_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          phone_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tracking_sessions: {
        Row: {
          id: string
          created_at: string | null
          user_id: string | null
          status: string | null
          mode: string | null
          tracking_code: string | null
          expiry_time: string | null
          order_id: string | null
          customer_name: string | null
          delivery_address: string | null
          delivery_status: string | null
          updated_at: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          destination_address: string | null
          countdown_timer: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          user_id?: string | null
          status?: string | null
          mode?: string | null
          tracking_code?: string | null
          expiry_time?: string | null
          order_id?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          delivery_status?: string | null
          updated_at?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          destination_address?: string | null
          countdown_timer?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          user_id?: string | null
          status?: string | null
          mode?: string | null
          tracking_code?: string | null
          expiry_time?: string | null
          order_id?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          delivery_status?: string | null
          updated_at?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          destination_address?: string | null
          countdown_timer?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          session_id: string | null
          latitude: number
          longitude: number
          speed: number | null
          battery_level: number | null
          timestamp: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          latitude: number
          longitude: number
          speed?: number | null
          battery_level?: number | null
          timestamp?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          latitude?: number
          longitude?: number
          speed?: number | null
          battery_level?: number | null
          timestamp?: string | null
          created_at?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string | null
          label: string
          address: string
          latitude: number
          longitude: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          label: string
          address: string
          latitude: number
          longitude: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          label?: string
          address?: string
          latitude?: number
          longitude?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_id: string
          customer_name: string | null
          customer_phone: string | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          delivery_address: string
          delivery_latitude: number
          delivery_longitude: number
          delivery_status: string
          tracking_session_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id: string
          customer_name?: string | null
          customer_phone?: string | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          delivery_address: string
          delivery_latitude: number
          delivery_longitude: number
          delivery_status?: string
          tracking_session_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          delivery_address?: string
          delivery_latitude?: number
          delivery_longitude?: number
          delivery_status?: string
          tracking_session_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
