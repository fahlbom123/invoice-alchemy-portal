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
      invoice_lines: {
        Row: {
          actual_cost: number | null
          actual_vat: number | null
          booking_number: string | null
          confirmation_number: string | null
          created_at: string | null
          currency: string | null
          departure_date: string | null
          description: string
          estimated_cost: number
          estimated_vat: number | null
          fully_invoiced: boolean | null
          id: string
          invoice_id: string | null
          invoice_type: string | null
          payment_status: string | null
          quantity: number
          supplier_id: string
          supplier_name: string
          supplier_part_number: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_vat?: number | null
          booking_number?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          currency?: string | null
          departure_date?: string | null
          description: string
          estimated_cost: number
          estimated_vat?: number | null
          fully_invoiced?: boolean | null
          id?: string
          invoice_id?: string | null
          invoice_type?: string | null
          payment_status?: string | null
          quantity?: number
          supplier_id: string
          supplier_name: string
          supplier_part_number: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_vat?: number | null
          booking_number?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          currency?: string | null
          departure_date?: string | null
          description?: string
          estimated_cost?: number
          estimated_vat?: number | null
          fully_invoiced?: boolean | null
          id?: string
          invoice_id?: string | null
          invoice_type?: string | null
          payment_status?: string | null
          quantity?: number
          supplier_id?: string
          supplier_name?: string
          supplier_part_number?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account: string | null
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_date: string | null
          invoice_number: string
          notes: string | null
          ocr: string | null
          periodization_month: number | null
          periodization_year: number | null
          project_id: string | null
          reference: string
          source: string | null
          status: string
          supplier_id: string
          total_amount: number
          total_vat: number | null
          updated_at: string | null
          vat: number | null
          vat_account: string | null
        }
        Insert: {
          account?: string | null
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_date?: string | null
          invoice_number: string
          notes?: string | null
          ocr?: string | null
          periodization_month?: number | null
          periodization_year?: number | null
          project_id?: string | null
          reference: string
          source?: string | null
          status?: string
          supplier_id: string
          total_amount?: number
          total_vat?: number | null
          updated_at?: string | null
          vat?: number | null
          vat_account?: string | null
        }
        Update: {
          account?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          ocr?: string | null
          periodization_month?: number | null
          periodization_year?: number | null
          project_id?: string | null
          reference?: string
          source?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          total_vat?: number | null
          updated_at?: string | null
          vat?: number | null
          vat_account?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string
          end_date: string
          id: string
          project_number: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date: string
          id?: string
          project_number: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string
          id?: string
          project_number?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_invoice_lines: {
        Row: {
          actual_cost: number
          actual_vat: number
          created_at: string | null
          created_by: string | null
          currency: string
          description: string
          id: string
          invoice_line_id: string
          supplier_invoice_id: string | null
          supplier_name: string
        }
        Insert: {
          actual_cost: number
          actual_vat: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description: string
          id?: string
          invoice_line_id: string
          supplier_invoice_id?: string | null
          supplier_name: string
        }
        Update: {
          actual_cost?: number
          actual_vat?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          invoice_line_id?: string
          supplier_invoice_id?: string | null
          supplier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_invoice_lines_invoice_id"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_lines_invoice_line_id_fkey"
            columns: ["invoice_line_id"]
            isOneToOne: false
            referencedRelation: "invoice_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_number: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency_rate: number | null
          default_currency: string | null
          email: string
          iban: string | null
          id: string
          name: string
          phone: string
          swift: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency_rate?: number | null
          default_currency?: string | null
          email: string
          iban?: string | null
          id?: string
          name: string
          phone: string
          swift?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency_rate?: number | null
          default_currency?: string | null
          email?: string
          iban?: string | null
          id?: string
          name?: string
          phone?: string
          swift?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
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
