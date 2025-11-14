import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user' | 'viewer'
          company_id: string | null
          created_at: string
          updated_at: string
          encrypted_data: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user' | 'viewer'
          company_id?: string | null
          created_at?: string
          updated_at?: string
          encrypted_data?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user' | 'viewer'
          company_id?: string | null
          created_at?: string
          updated_at?: string
          encrypted_data?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          owner_id: string
          subscription_tier: 'free' | 'basic' | 'professional' | 'enterprise'
          max_users: number
          max_companies: number
          max_documents: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          subscription_tier?: 'free' | 'basic' | 'professional' | 'enterprise'
          max_users?: number
          max_companies?: number
          max_documents?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          subscription_tier?: 'free' | 'basic' | 'professional' | 'enterprise'
          max_users?: number
          max_companies?: number
          max_documents?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          company_id: string
          user_id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          encrypted: boolean
          legal_accepted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          encrypted?: boolean
          legal_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          encrypted?: boolean
          legal_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          stripe_invoice_id: string
          amount: number
          currency: string
          status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
          due_date: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          stripe_invoice_id: string
          amount: number
          currency?: string
          status?: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
          due_date?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          stripe_invoice_id?: string
          amount?: number
          currency?: string
          status?: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
          due_date?: string | null
          paid_at?: string | null
          created_at?: string
        }
      }
      data_breaches: {
        Row: {
          id: string
          company_id: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          detected_at: string
          resolved_at: string | null
          affected_records: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          detected_at: string
          resolved_at?: string | null
          affected_records?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          description?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          detected_at?: string
          resolved_at?: string | null
          affected_records?: number
          created_at?: string
        }
      }
      backups: {
        Row: {
          id: string
          company_id: string
          backup_type: 'full' | 'incremental'
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          file_path: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          backup_type: 'full' | 'incremental'
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          file_path?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          backup_type?: 'full' | 'incremental'
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          file_path?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
    }
  }
}


