import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  full_name: string
  alias: string
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface EventType {
  id: string
  user_id: string
  title: string
  duration: number
  description: string | null
  availability_rules: AvailabilityRules
  custom_questions: CustomQuestion[]
  created_at: string
}

export interface CustomQuestion {
  id: string
  question: string
  type: 'text' | 'radio' | 'checkbox'
  required: boolean
  options?: string[] // For radio/checkbox questions
}

export interface AvailabilityRules {
  [key: string]: TimeSlot[]
}

export interface TimeSlot {
  from: string
  to: string
}

export interface Booking {
  id: string
  event_type_id: string
  start_time: string
  end_time: string
  booker_name: string
  booker_email: string
  booker_description?: string
  booker_phone?: string
  custom_answers?: Record<string, any>
  status: 'confirmed' | 'cancelled'
  created_at: string
}

export interface BookingWithDetails extends Booking {
  event_types: {
    title: string
    duration: number
    custom_questions: CustomQuestion[]
  }
}
