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

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          canceled_at: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          client_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          end_time: string
          id: string
          is_billable: boolean | null
          location: string | null
          package_purchase_id: string | null
          provider_id: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          timezone: string | null
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          client_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_billable?: boolean | null
          location?: string | null
          package_purchase_id?: string | null
          provider_id: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_billable?: boolean | null
          location?: string | null
          package_purchase_id?: string | null
          provider_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_canceled_by_fkey"
            columns: ["canceled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_package_purchase"
            columns: ["package_purchase_id"]
            isOneToOne: false
            referencedRelation: "package_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          care_modality: string | null
          city: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          default_rate: number | null
          deleted_at: string | null
          doc_id: string | null
          doc_type: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          initial_consultation_reason: string | null
          is_active: boolean
          last_name: string
          marital_status: string | null
          nationality: string | null
          notes: string | null
          patient_status: string | null
          pharmacological_treatment: string | null
          phone: string | null
          previous_diagnosis: string | null
          previous_psychology_assistance: string | null
          referred_by: string | null
          secondary_phone: string | null
          session_frequency: string | null
          session_type: string | null
          surcharge_schedule: boolean | null
          tags: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address?: string | null
          care_modality?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          default_rate?: number | null
          deleted_at?: string | null
          doc_id?: string | null
          doc_type?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          initial_consultation_reason?: string | null
          is_active?: boolean
          last_name: string
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          patient_status?: string | null
          pharmacological_treatment?: string | null
          phone?: string | null
          previous_diagnosis?: string | null
          previous_psychology_assistance?: string | null
          referred_by?: string | null
          secondary_phone?: string | null
          session_frequency?: string | null
          session_type?: string | null
          surcharge_schedule?: boolean | null
          tags?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address?: string | null
          care_modality?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          default_rate?: number | null
          deleted_at?: string | null
          doc_id?: string | null
          doc_type?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          initial_consultation_reason?: string | null
          is_active?: boolean
          last_name?: string
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          patient_status?: string | null
          pharmacological_treatment?: string | null
          phone?: string | null
          previous_diagnosis?: string | null
          previous_psychology_assistance?: string | null
          referred_by?: string | null
          secondary_phone?: string | null
          session_frequency?: string | null
          session_type?: string | null
          surcharge_schedule?: boolean | null
          tags?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number | null
          appointment_id: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          package_purchase_id: string | null
          quantity: number
          sort_order: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          appointment_id?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          package_purchase_id?: string | null
          quantity?: number
          sort_order?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          appointment_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          package_purchase_id?: string | null
          quantity?: number
          sort_order?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "provider_daily_schedule"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "invoice_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "upcoming_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_package_purchase_id_fkey"
            columns: ["package_purchase_id"]
            isOneToOne: false
            referencedRelation: "package_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number
          client_id: string
          created_at: string
          created_by: string
          currency_code: string | null
          deleted_at: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          terms: string | null
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number
          client_id: string
          created_at?: string
          created_by: string
          currency_code?: string | null
          deleted_at?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number
          client_id?: string
          created_at?: string
          created_by?: string
          currency_code?: string | null
          deleted_at?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      package_purchases: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          currency_code: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          package_id: string
          price_paid: number
          purchased_at: string
          sessions_remaining: number | null
          sessions_total: number
          sessions_used: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          currency_code?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          package_id: string
          price_paid: number
          purchased_at?: string
          sessions_remaining?: number | null
          sessions_total: number
          sessions_used?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          currency_code?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          package_id?: string
          price_paid?: number
          purchased_at?: string
          sessions_remaining?: number | null
          sessions_total?: number
          sessions_used?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          created_by: string
          currency_code: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          number_of_sessions: number
          price: number
          updated_at: string
          validity_days: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency_code?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          number_of_sessions: number
          price: number
          updated_at?: string
          validity_days?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency_code?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          number_of_sessions?: number
          price?: number
          updated_at?: string
          validity_days?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string
          currency_code: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by: string
          currency_code?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string
          currency_code?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          locale: string | null
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          locale?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          locale?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          appointment_id: string
          channel: Database["public"]["Enums"]["reminder_channel"]
          client_id: string
          created_at: string
          error_message: string | null
          id: string
          message: string | null
          recipient_email: string | null
          recipient_phone: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          appointment_id: string
          channel: Database["public"]["Enums"]["reminder_channel"]
          client_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          appointment_id?: string
          channel?: Database["public"]["Enums"]["reminder_channel"]
          client_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "provider_daily_schedule"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "upcoming_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          appointment_id: string
          assessment: string | null
          client_id: string
          created_at: string
          deleted_at: string | null
          duration_minutes: number | null
          goals: string[] | null
          id: string
          interventions: string[] | null
          mood_rating: number | null
          objective: string | null
          plan: string | null
          progress_rating: number | null
          provider_id: string
          session_number: number | null
          subjective: string | null
          tags: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          appointment_id: string
          assessment?: string | null
          client_id: string
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          goals?: string[] | null
          id?: string
          interventions?: string[] | null
          mood_rating?: number | null
          objective?: string | null
          plan?: string | null
          progress_rating?: number | null
          provider_id: string
          session_number?: number | null
          subjective?: string | null
          tags?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          appointment_id?: string
          assessment?: string | null
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          goals?: string[] | null
          id?: string
          interventions?: string[] | null
          mood_rating?: number | null
          objective?: string | null
          plan?: string | null
          progress_rating?: number | null
          provider_id?: string
          session_number?: number | null
          subjective?: string | null
          tags?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "provider_daily_schedule"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "upcoming_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          currency_code: string | null
          deleted_at: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          currency_code?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          currency_code?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_invoice_summary: {
        Row: {
          client_id: string | null
          client_name: string | null
          overdue_invoices: number | null
          paid_invoices: number | null
          pending_invoices: number | null
          total_billed: number | null
          total_invoices: number | null
          total_outstanding: number | null
          total_paid: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_package_summary: {
        Row: {
          client_id: string | null
          client_name: string | null
          expires_at: string | null
          package_name: string | null
          purchased_at: string | null
          sessions_remaining: number | null
          sessions_total: number | null
          sessions_used: number | null
          status: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_daily_schedule: {
        Row: {
          appointment_id: string | null
          client_name: string | null
          client_phone: string | null
          end_time: string | null
          has_notes: boolean | null
          location: string | null
          provider_id: string | null
          provider_name: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          title: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_appointments: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          end_time: string | null
          hours_until_appointment: number | null
          id: string | null
          location: string | null
          provider_email: string | null
          provider_name: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          title: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_workspace_ids: { Args: { user_uuid: string }; Returns: string[] }
      is_time_slot_available: {
        Args: {
          exclude_appointment_id?: string
          provider_uuid: string
          slot_end: string
          slot_start: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { user_uuid: string; workspace_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status: "scheduled" | "completed" | "canceled" | "no_show"
      invoice_status: "draft" | "pending" | "paid" | "overdue" | "canceled"
      payment_method:
        | "cash"
        | "card"
        | "transfer"
        | "nequi"
        | "daviplata"
        | "other"
      reminder_channel: "email" | "sms" | "whatsapp" | "push"
      reminder_status: "pending" | "sent" | "failed" | "canceled"
      workspace_role: "owner" | "admin" | "provider" | "assistant"
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
      appointment_status: ["scheduled", "completed", "canceled", "no_show"],
      invoice_status: ["draft", "pending", "paid", "overdue", "canceled"],
      payment_method: [
        "cash",
        "card",
        "transfer",
        "nequi",
        "daviplata",
        "other",
      ],
      reminder_channel: ["email", "sms", "whatsapp", "push"],
      reminder_status: ["pending", "sent", "failed", "canceled"],
      workspace_role: ["owner", "admin", "provider", "assistant"],
    },
  },
} as const
