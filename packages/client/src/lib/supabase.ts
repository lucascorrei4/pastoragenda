import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase client initialization:')
console.log('- VITE_SUPABASE_URL:', supabaseUrl)
console.log('- VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
console.log('- VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey?.length)

// Create the Supabase client based on environment variables
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env file in the client directory with:')
  console.error('VITE_SUPABASE_URL=your_supabase_project_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  
  // Create a mock client that will fail gracefully
  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Missing environment variables') }),
      getUser: async () => ({ data: { user: null }, error: new Error('Missing environment variables') }),
      signOut: async () => ({ error: new Error('Missing environment variables') }),
      signInWithOtp: async () => ({ data: null, error: new Error('Missing environment variables') }),
      signUp: async () => ({ data: null, error: new Error('Missing environment variables') }),
      verifyOtp: async () => ({ data: null, error: new Error('Missing environment variables') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  } as any
  
  console.warn('Using mock Supabase client due to missing environment variables')
  supabase = mockClient
} else {
  console.log('Creating Supabase client...')
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('Supabase client created successfully:', supabase)
  console.log('Supabase client methods:', Object.keys(supabase))
}

export { supabase }

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
