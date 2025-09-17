import { createClient } from '@supabase/supabase-js'
import { customAuth } from './custom-auth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create the Supabase client based on environment variables
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env file in the client directory with:')
  console.error('VITE_SUPABASE_URL=your_supabase_project_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  
  // Create a mock client that will fail gracefully
  const mockClient = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Missing environment variables') }) }) }),
      insert: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Missing environment variables') }) }),
      update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Missing environment variables') }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Missing environment variables') }) })
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('Missing environment variables') })
  } as any
  
  console.warn('Using mock Supabase client due to missing environment variables')
  supabase = mockClient
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Enhanced Supabase client with custom authentication
export const supabaseWithAuth = {
  ...supabase,
  
  // Override the from method to include authentication headers
  from: (table: string) => {
    const originalFrom = supabase.from(table)
    
    // Get current auth token
    const token = customAuth.getToken()
    
    if (token) {
      // Add authorization header to requests
      const headers = {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey || ''
      }
      
      // Create a new client instance with auth headers
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers
        }
      })
      
      return authClient.from(table)
    }
    
    return originalFrom
  }
}

export { supabase }

// Database types
export interface Profile {
  id: string
  full_name: string
  alias: string
  bio: string | null
  avatar_url: string | null
  email: string
  email_verified: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
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

export interface UnavailabilityPeriod {
  id: string
  user_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  is_all_day: boolean
  created_at: string
  updated_at: string
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
  profiles?: {
    alias: string
    full_name: string
  }
}

// Pastor Sharing Interfaces
export interface PastorSharingSettings {
  id: string
  pastor_id: string
  is_public_enabled: boolean
  public_slug: string
  allow_booking_view: boolean
  allow_event_types_view: boolean
  show_pastor_name: boolean
  show_pastor_contact: boolean
  sharing_token?: string
  token_expires_at?: string
  sharing_type: 'public' | 'time_limited'
  anonymous_id?: string
  created_at: string
  updated_at: string
}

export interface MasterPastorFollow {
  id: string
  master_pastor_id: string
  followed_pastor_id: string
  invitation_status: 'pending' | 'accepted' | 'declined' | 'revoked'
  invited_by: string | null
  invitation_token: string
  invited_at: string
  responded_at: string | null
  created_at: string
  updated_at: string
}

export interface PastorInvitation {
  id: string
  from_pastor_id: string
  to_email: string
  invitation_token: string
  invitation_type: 'master_pastor' | 'viewer'
  permissions: {
    view_bookings: boolean
    view_event_types: boolean
    view_contact: boolean
  }
  expires_at: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  accepted_by: string | null
  created_at: string
  updated_at: string
}

export interface PastorWithFollows extends Profile {
  master_pastor_follows: MasterPastorFollow[]
  pastor_sharing_settings: PastorSharingSettings
}

export interface FollowedPastorData {
  profile: Profile
  sharing_settings: PastorSharingSettings
  bookings: BookingWithDetails[]
  event_types: EventType[]
}