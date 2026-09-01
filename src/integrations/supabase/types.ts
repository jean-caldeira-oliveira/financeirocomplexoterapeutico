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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          app_action: string | null
          app_description: string | null
          app_entity_id: string | null
          app_entity_name: string | null
          app_module: string | null
          app_user_email: string | null
          app_user_id: string | null
          app_user_name: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          app_action?: string | null
          app_description?: string | null
          app_entity_id?: string | null
          app_entity_name?: string | null
          app_module?: string | null
          app_user_email?: string | null
          app_user_id?: string | null
          app_user_name?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          app_action?: string | null
          app_description?: string | null
          app_entity_id?: string | null
          app_entity_name?: string | null
          app_module?: string | null
          app_user_email?: string | null
          app_user_id?: string | null
          app_user_name?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bill_history: {
        Row: {
          action: string
          bill_id: string
          created_at: string
          description: string | null
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          bill_id: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          bill_id?: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          user_id: string
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          user_id: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          employee_id: string | null
          id: string
          installment_number: number | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          recurrence: string
          recurrence_group_id: string | null
          status: string
          subcategory: string
          supplier_id: string | null
          total_installments: number | null
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          due_date: string
          employee_id?: string | null
          id?: string
          installment_number?: number | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          recurrence?: string
          recurrence_group_id?: string | null
          status?: string
          subcategory?: string
          supplier_id?: string | null
          total_installments?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          employee_id?: string | null
          id?: string
          installment_number?: number | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          recurrence?: string
          recurrence_group_id?: string | null
          status?: string
          subcategory?: string
          supplier_id?: string | null
          total_installments?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_quotes: {
        Row: {
          coletivo_enrollment_fee: number
          coletivo_monthly_fee: number
          created_at: string
          guardian_document: string | null
          guardian_name: string
          guardian_phone: string | null
          id: string
          laundry_included: boolean
          notes: string | null
          patient_birth_date: string | null
          patient_document: string | null
          patient_name: string
          period_months: string | null
          privativo_enrollment_fee: number
          privativo_monthly_fee: number
          psychiatric_followup: boolean
          semi_privativo_enrollment_fee: number
          semi_privativo_monthly_fee: number
          user_id: string
          user_name: string | null
          validity_days: number
        }
        Insert: {
          coletivo_enrollment_fee?: number
          coletivo_monthly_fee?: number
          created_at?: string
          guardian_document?: string | null
          guardian_name: string
          guardian_phone?: string | null
          id?: string
          laundry_included?: boolean
          notes?: string | null
          patient_birth_date?: string | null
          patient_document?: string | null
          patient_name: string
          period_months?: string | null
          privativo_enrollment_fee?: number
          privativo_monthly_fee?: number
          psychiatric_followup?: boolean
          semi_privativo_enrollment_fee?: number
          semi_privativo_monthly_fee?: number
          user_id: string
          user_name?: string | null
          validity_days?: number
        }
        Update: {
          coletivo_enrollment_fee?: number
          coletivo_monthly_fee?: number
          created_at?: string
          guardian_document?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          laundry_included?: boolean
          notes?: string | null
          patient_birth_date?: string | null
          patient_document?: string | null
          patient_name?: string
          period_months?: string | null
          privativo_enrollment_fee?: number
          privativo_monthly_fee?: number
          psychiatric_followup?: boolean
          semi_privativo_enrollment_fee?: number
          semi_privativo_monthly_fee?: number
          user_id?: string
          user_name?: string | null
          validity_days?: number
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
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
      employees: {
        Row: {
          admission_date: string
          bank_info_or_pix_key: string | null
          code: string
          cost_center_id: string
          created_at: string
          default_account_id: string
          document: string
          employment_type: string
          full_name: string
          id: string
          notes: string | null
          payment_method: string | null
          role_title: string
          status: string
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          admission_date: string
          bank_info_or_pix_key?: string | null
          code?: string
          cost_center_id: string
          created_at?: string
          default_account_id: string
          document: string
          employment_type: string
          full_name: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          role_title: string
          status?: string
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          admission_date?: string
          bank_info_or_pix_key?: string | null
          code?: string
          cost_center_id?: string
          created_at?: string
          default_account_id?: string
          document?: string
          employment_type?: string
          full_name?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          role_title?: string
          status?: string
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          extension_due_day: number | null
          extension_installments: number | null
          extension_monthly_fee: number | null
          extension_months: number
          extension_start_date: string | null
          first_installment_date: string | null
          guardian_contact: string
          guardian_name: string
          has_enrollment_fee: boolean
          has_extension: boolean
          id: string
          installments: number
          interest_rate_monthly: number
          monthly_fee: number
          name: string
          original_installments: number | null
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
          extension_due_day?: number | null
          extension_installments?: number | null
          extension_monthly_fee?: number | null
          extension_months?: number
          extension_start_date?: string | null
          first_installment_date?: string | null
          guardian_contact?: string
          guardian_name?: string
          has_enrollment_fee?: boolean
          has_extension?: boolean
          id?: string
          installments?: number
          interest_rate_monthly?: number
          monthly_fee?: number
          name: string
          original_installments?: number | null
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
          extension_due_day?: number | null
          extension_installments?: number | null
          extension_monthly_fee?: number | null
          extension_months?: number
          extension_start_date?: string | null
          first_installment_date?: string | null
          guardian_contact?: string
          guardian_name?: string
          has_enrollment_fee?: boolean
          has_extension?: boolean
          id?: string
          installments?: number
          interest_rate_monthly?: number
          monthly_fee?: number
          name?: string
          original_installments?: number | null
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
      suppliers: {
        Row: {
          address: string | null
          bank_info: string | null
          code: string
          created_at: string
          default_account_id: string
          default_cost_center_id: string
          document: string
          email: string | null
          id: string
          legal_name: string
          notes: string | null
          person_type: string
          phone: string | null
          pix_key: string | null
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_info?: string | null
          code?: string
          created_at?: string
          default_account_id: string
          default_cost_center_id: string
          document: string
          email?: string | null
          id?: string
          legal_name: string
          notes?: string | null
          person_type: string
          phone?: string | null
          pix_key?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_info?: string | null
          code?: string
          created_at?: string
          default_account_id?: string
          default_cost_center_id?: string
          document?: string
          email?: string | null
          id?: string
          legal_name?: string
          notes?: string | null
          person_type?: string
          phone?: string | null
          pix_key?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_default_cost_center_id_fkey"
            columns: ["default_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          ticket_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          ticket_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          ticket_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          severity: string
          status: string
          tab: string
          ticket_type: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          severity: string
          status?: string
          tab: string
          ticket_type: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          severity?: string
          status?: string
          tab?: string
          ticket_type?: string
          user_id?: string
          user_name?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
