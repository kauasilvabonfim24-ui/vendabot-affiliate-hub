export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_signup_emails: {
        Row: {
          id: string
          sent_at: string
          step: number
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          step: number
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          step?: number
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      bot_auth_state: {
        Row: {
          data: string
          key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data: string
          key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: string
          key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_status: {
        Row: {
          qr_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string
          whatsapp_gid: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: string
          updated_at?: string
          user_id: string
          whatsapp_gid: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
          whatsapp_gid?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          cakto_product_id: string | null
          created_at: string
          id: string
          max_groups: number | null
          max_schedules: number | null
          name: string
          price: number
        }
        Insert: {
          cakto_product_id?: string | null
          created_at?: string
          id: string
          max_groups?: number | null
          max_schedules?: number | null
          name: string
          price: number
        }
        Update: {
          cakto_product_id?: string | null
          created_at?: string
          id?: string
          max_groups?: number | null
          max_schedules?: number | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          link: string
          name: string
          old_price: number
          platform: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link: string
          name: string
          old_price?: number
          platform?: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string
          name?: string
          old_price?: number
          platform?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          code: string
          created_at: string
          id: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          cakto_subscription_id: string | null
          created_at: string
          id: number
          referred_user_id: string
          referrer_user_id: string
          reward_days: number
        }
        Insert: {
          cakto_subscription_id?: string | null
          created_at?: string
          id?: never
          referred_user_id: string
          referrer_user_id: string
          reward_days: number
        }
        Update: {
          cakto_subscription_id?: string | null
          created_at?: string
          id?: never
          referred_user_id?: string
          referrer_user_id?: string
          reward_days?: number
        }
        Relationships: []
      }
      referral_signups: {
        Row: {
          created_at: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          created_at?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          created_at?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          category: string | null
          created_at: string
          group_ids: string[]
          id: string
          repeat: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          group_ids?: string[]
          id?: string
          repeat?: string
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          group_ids?: string[]
          id?: string
          repeat?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cakto_subscription_id: string | null
          created_at: string
          current_period_end: string | null
          plan_id: string
          status: string
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cakto_subscription_id?: string | null
          created_at?: string
          current_period_end?: string | null
          plan_id: string
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cakto_subscription_id?: string | null
          created_at?: string
          current_period_end?: string | null
          plan_id?: string
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          admin_reply: string | null
          category: string
          created_at: string
          id: number
          message: string
          rating: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          category?: string
          created_at?: string
          id?: never
          message: string
          rating?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          category?: string
          created_at?: string
          id?: never
          message?: string
          rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_debug_log: {
        Row: {
          created_at: string
          id: number
          note: string | null
          payload: Json
          source: string
        }
        Insert: {
          created_at?: string
          id?: never
          note?: string | null
          payload: Json
          source: string
        }
        Update: {
          created_at?: string
          id?: never
          note?: string | null
          payload?: Json
          source?: string
        }
        Relationships: []
      }
      whatsapp_groups_available: {
        Row: {
          gid: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          gid: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          gid?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      capture_referral: { Args: { p_code: string }; Returns: boolean }
      ensure_referral_code: { Args: never; Returns: string }
      get_emails_by_ids: {
        Args: { ids: string[] }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_referral_stats: {
        Args: never
        Returns: {
          clicks: number
          code: string
          days_earned: number
          reward_days_config: number
          signups: number
          valid_referrals: number
        }[]
      }
      get_user_id_by_email: { Args: { lookup_email: string }; Returns: string }
      grant_referral_reward: {
        Args: { p_cakto_subscription_id: string; p_referred_user_id: string }
        Returns: string
      }
      has_active_subscription: { Args: { uid: string }; Returns: boolean }
      register_referral_click: { Args: { p_code: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
