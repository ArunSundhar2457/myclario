export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string;
          feature: string;
          id: string;
          last_requested_at: string;
          request_count: number;
          updated_at: string;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feature: string;
          id?: string;
          last_requested_at?: string;
          request_count?: number;
          updated_at?: string;
          usage_date?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feature?: string;
          id?: string;
          last_requested_at?: string;
          request_count?: number;
          updated_at?: string;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          month: string;
          monthly_limit: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          month: string;
          monthly_limit: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          month?: string;
          monthly_limit?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          base_currency: string;
          created_at: string;
          fetched_at: string;
          id: string;
          rate_date: string;
          rates: Json;
          updated_at: string;
        };
        Insert: {
          base_currency?: string;
          created_at?: string;
          fetched_at?: string;
          id?: string;
          rate_date: string;
          rates: Json;
          updated_at?: string;
        };
        Update: {
          base_currency?: string;
          created_at?: string;
          fetched_at?: string;
          id?: string;
          rate_date?: string;
          rates?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          is_recurring: boolean;
          occurred_on: string;
          recurrence: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_recurring?: boolean;
          occurred_on?: string;
          recurrence?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_recurring?: boolean;
          occurred_on?: string;
          recurrence?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      income: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          is_recurring: boolean;
          occurred_on: string;
          recurrence: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_recurring?: boolean;
          occurred_on?: string;
          recurrence?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_recurring?: boolean;
          occurred_on?: string;
          recurrence?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          consent_at: string | null;
          created_at: string;
          currency: string;
          display_name: string | null;
          id: string;
          language: string;
          updated_at: string;
        };
        Insert: {
          consent_at?: string | null;
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id: string;
          language?: string;
          updated_at?: string;
        };
        Update: {
          consent_at?: string | null;
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id?: string;
          language?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          created_at: string;
          due_date: string | null;
          due_time: string | null;
          id: string;
          is_completed: boolean;
          notes: string | null;
          priority: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          is_completed?: boolean;
          notes?: string | null;
          priority?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          is_completed?: boolean;
          notes?: string | null;
          priority?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_and_increment_ai_usage: {
        Args: { p_cooldown_seconds: number; p_feature: string; p_limit: number };
        Returns: Json;
      };
      get_daily_totals: {
        Args: { p_from: string; p_to: string };
        Returns: {
          day: string;
          income: number;
          spent: number;
        }[];
      };
      get_expense_category_totals: {
        Args: { p_from: string; p_to: string };
        Returns: {
          category: string;
          total: number;
        }[];
      };
      get_totals: {
        Args: { p_from?: string; p_to?: string };
        Returns: {
          income: number;
          spent: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
