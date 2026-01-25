/**
 * Mindesk Database Types
 * Auto-generated TypeScript types for the Supabase database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type WorkspaceRole = 'owner' | 'admin' | 'provider' | 'assistant'
export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'no_show'
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'nequi' | 'daviplata' | 'other'
export type ReminderChannel = 'email' | 'sms' | 'whatsapp' | 'push'
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'canceled'

// Database Tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          timezone: string
          locale: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          timezone?: string
          locale?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          timezone?: string
          locale?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          country: string
          timezone: string
          currency_code: string
          logo_url: string | null
          settings: Json
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          country?: string
          timezone?: string
          currency_code?: string
          logo_url?: string | null
          settings?: Json
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          country?: string
          timezone?: string
          currency_code?: string
          logo_url?: string | null
          settings?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          is_active: boolean
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: WorkspaceRole
          is_active?: boolean
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: WorkspaceRole
          is_active?: boolean
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          workspace_id: string
          first_name: string
          last_name: string
          doc_type: string | null
          doc_id: string | null
          email: string | null
          phone: string | null
          secondary_phone: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          city: string | null
          referred_by: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          notes: string | null
          tags: string[] | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          first_name: string
          last_name: string
          doc_type?: string | null
          doc_id?: string | null
          email?: string | null
          phone?: string | null
          secondary_phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          city?: string | null
          referred_by?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          notes?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          first_name?: string
          last_name?: string
          doc_type?: string | null
          doc_id?: string | null
          email?: string | null
          phone?: string | null
          secondary_phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          city?: string | null
          referred_by?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          notes?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          provider_id: string
          start_time: string
          end_time: string
          timezone: string
          status: AppointmentStatus
          title: string | null
          description: string | null
          location: string | null
          package_purchase_id: string | null
          is_billable: boolean
          canceled_at: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          provider_id: string
          start_time: string
          end_time: string
          timezone?: string
          status?: AppointmentStatus
          title?: string | null
          description?: string | null
          location?: string | null
          package_purchase_id?: string | null
          is_billable?: boolean
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          provider_id?: string
          start_time?: string
          end_time?: string
          timezone?: string
          status?: AppointmentStatus
          title?: string | null
          description?: string | null
          location?: string | null
          package_purchase_id?: string | null
          is_billable?: boolean
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      session_notes: {
        Row: {
          id: string
          appointment_id: string
          workspace_id: string
          client_id: string
          provider_id: string
          subjective: string | null
          objective: string | null
          assessment: string | null
          plan: string | null
          session_number: number | null
          duration_minutes: number | null
          mood_rating: number | null
          progress_rating: number | null
          tags: string[] | null
          goals: string[] | null
          interventions: string[] | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          appointment_id: string
          workspace_id: string
          client_id: string
          provider_id: string
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          session_number?: number | null
          duration_minutes?: number | null
          mood_rating?: number | null
          progress_rating?: number | null
          tags?: string[] | null
          goals?: string[] | null
          interventions?: string[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          appointment_id?: string
          workspace_id?: string
          client_id?: string
          provider_id?: string
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          session_number?: number | null
          duration_minutes?: number | null
          mood_rating?: number | null
          progress_rating?: number | null
          tags?: string[] | null
          goals?: string[] | null
          interventions?: string[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      packages: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          number_of_sessions: number
          price: number
          currency_code: string
          validity_days: number | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          number_of_sessions: number
          price: number
          currency_code?: string
          validity_days?: number | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          number_of_sessions?: number
          price?: number
          currency_code?: string
          validity_days?: number | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      package_purchases: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          package_id: string
          sessions_total: number
          sessions_used: number
          sessions_remaining: number
          price_paid: number
          currency_code: string
          purchased_at: string
          expires_at: string | null
          notes: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          package_id: string
          sessions_total: number
          sessions_used?: number
          price_paid: number
          currency_code?: string
          purchased_at?: string
          expires_at?: string | null
          notes?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          package_id?: string
          sessions_total?: number
          sessions_used?: number
          price_paid?: number
          currency_code?: string
          purchased_at?: string
          expires_at?: string | null
          notes?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          invoice_number: string
          status: InvoiceStatus
          issue_date: string
          due_date: string | null
          paid_at: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount_amount: number
          total: number
          amount_paid: number
          amount_due: number
          currency_code: string
          notes: string | null
          terms: string | null
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          invoice_number: string
          status?: InvoiceStatus
          issue_date?: string
          due_date?: string | null
          paid_at?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          amount_paid?: number
          currency_code?: string
          notes?: string | null
          terms?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          invoice_number?: string
          status?: InvoiceStatus
          issue_date?: string
          due_date?: string | null
          paid_at?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          amount_paid?: number
          currency_code?: string
          notes?: string | null
          terms?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
          appointment_id: string | null
          package_purchase_id: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          appointment_id?: string | null
          package_purchase_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          appointment_id?: string | null
          package_purchase_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          workspace_id: string
          invoice_id: string
          client_id: string
          amount: number
          currency_code: string
          payment_method: PaymentMethod
          payment_date: string
          reference_number: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          invoice_id: string
          client_id: string
          amount: number
          currency_code?: string
          payment_method: PaymentMethod
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          invoice_id?: string
          client_id?: string
          amount?: number
          currency_code?: string
          payment_method?: PaymentMethod
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          workspace_id: string
          appointment_id: string
          client_id: string
          channel: ReminderChannel
          status: ReminderStatus
          scheduled_for: string
          sent_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          message: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          appointment_id: string
          client_id: string
          channel: ReminderChannel
          status?: ReminderStatus
          scheduled_for: string
          sent_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          message?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          appointment_id?: string
          client_id?: string
          channel?: ReminderChannel
          status?: ReminderStatus
          scheduled_for?: string
          sent_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          message?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          changed_fields: string[] | null
          actor_user_id: string | null
          workspace_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          changed_fields?: string[] | null
          actor_user_id?: string | null
          workspace_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          changed_fields?: string[] | null
          actor_user_id?: string | null
          workspace_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      upcoming_appointments: {
        Row: {
          id: string
          workspace_id: string
          start_time: string
          end_time: string
          status: AppointmentStatus
          title: string | null
          location: string | null
          client_name: string
          client_phone: string | null
          client_email: string | null
          provider_name: string
          provider_email: string
          hours_until_appointment: number
        }
      }
      client_invoice_summary: {
        Row: {
          workspace_id: string
          client_id: string
          client_name: string
          total_invoices: number
          paid_invoices: number
          pending_invoices: number
          overdue_invoices: number
          total_billed: number
          total_paid: number
          total_outstanding: number
        }
      }
      client_package_summary: {
        Row: {
          workspace_id: string
          client_id: string
          client_name: string
          package_name: string
          sessions_total: number
          sessions_used: number
          sessions_remaining: number
          purchased_at: string
          expires_at: string | null
          status: string
        }
      }
      provider_daily_schedule: {
        Row: {
          provider_id: string
          provider_name: string
          workspace_id: string
          appointment_id: string
          start_time: string
          end_time: string
          status: AppointmentStatus
          client_name: string
          client_phone: string | null
          title: string | null
          location: string | null
          has_notes: boolean
        }
      }
    }
    Functions: {
      is_workspace_member: {
        Args: { workspace_uuid: string; user_uuid: string }
        Returns: boolean
      }
      get_user_workspace_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      is_time_slot_available: {
        Args: {
          provider_uuid: string
          slot_start: string
          slot_end: string
          exclude_appointment_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      workspace_role: WorkspaceRole
      appointment_status: AppointmentStatus
      invoice_status: InvoiceStatus
      payment_method: PaymentMethod
      reminder_channel: ReminderChannel
      reminder_status: ReminderStatus
    }
  }
}
