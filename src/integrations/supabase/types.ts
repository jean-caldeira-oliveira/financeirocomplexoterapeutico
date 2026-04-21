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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bills: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          installment_number: number | null
          paid_amount: number | null
          paid_at: string | null
          payment_date: string | null
          payment_method: string | null
          recurrence: string
          status: string
          subcategory: string
          total_installments: number | null
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          installment_number?: number | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          recurrence?: string
          status?: string
          subcategory?: string
          total_installments?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_number?: number | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          recurrence?: string
          status?: string
          subcategory?: string
          total_installments?: number | null
          user_id?: string
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          created_at: string
          group_key: string | null
          id: string
          key: string
          label: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_key?: string | null
          id?: string
          key: string
          label: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_key?: string | null
          id?: string
          key?: string
          label?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          is_late: boolean | null
          method: string
          note: string | null
          payment_date: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          is_late?: boolean | null
          method?: string
          note?: string | null
          payment_date: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          is_late?: boolean | null
          method?: string
          note?: string | null
          payment_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_method: string
          created_at: string
          description: string | null
          due_date: string
          fine_rate: number
          grace_period_days: number
          id: string
          installment_number: number
          interest_rate_monthly: number | null
          paid_at: string | null
          patient_id: string
          patient_name: string
          status: string
          total_installments: number
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_method?: string
          created_at?: string
          description?: string | null
          due_date: string
          fine_rate?: number
          grace_period_days?: number
          id?: string
          installment_number?: number
          interest_rate_monthly?: number | null
          paid_at?: string | null
          patient_id: string
          patient_name: string
          status?: string
          total_installments?: number
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_method?: string
          created_at?: string
          description?: string | null
          due_date?: string
          fine_rate?: number
          grace_period_days?: number
          id?: string
          installment_number?: number
          interest_rate_monthly?: number | null
          paid_at?: string | null
          patient_id?: string
          patient_name?: string
          status?: string
          total_installments?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean
          created_at: string
          due_day: number
          enrollment_due_date: string | null
          enrollment_fee: number
          entry_date: string
          first_installment_date: string | null
          guardian_contact: string
          guardian_name: string
          has_enrollment_fee: boolean
          id: string
          installments: number
          interest_rate_monthly: number
          monthly_fee: number
          name: string
          referral_source: string
          user_id: string
          ward: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          due_day?: number
          enrollment_due_date?: string | null
          enrollment_fee?: number
          entry_date: string
          first_installment_date?: string | null
          guardian_contact?: string
          guardian_name?: string
          has_enrollment_fee?: boolean
          id?: string
          installments?: number
          interest_rate_monthly?: number
          monthly_fee?: number
          name: string
          referral_source?: string
          user_id: string
          ward?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          due_day?: number
          enrollment_due_date?: string | null
          enrollment_fee?: number
          entry_date?: string
          first_installment_date?: string | null
          guardian_contact?: string
          guardian_name?: string
          has_enrollment_fee?: boolean
          id?: string
          installments?: number
          interest_rate_monthly?: number
          monthly_fee?: number
          name?: string
          referral_source?: string
          user_id?: string
          ward?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          patient_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          date: string
          description?: string
          id?: string
          patient_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          patient_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
