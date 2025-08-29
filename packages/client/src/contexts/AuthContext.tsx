import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          // Clear any invalid session data
          if (mounted) {
            setSession(null)
            setUser(null)
            setLoading(false)
          }
          return
        }

        // Validate session before setting it
        if (session && session.user && session.access_token) {
          // Verify the session is still valid
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !currentUser) {
            console.error('Session validation failed:', userError)
            // Clear invalid session
            await supabase.auth.signOut()
            if (mounted) {
              setSession(null)
              setUser(null)
            }
          } else if (mounted) {
            // Session is valid, set it
            setSession(session)
            setUser(currentUser)
          }
        } else if (mounted) {
          // No session
          setSession(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Unexpected error getting initial session:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with better validation
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.id)

      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session && session.user) {
            // Validate the user session
            const { data: { user: currentUser }, error } = await supabase.auth.getUser()
            
            if (error || !currentUser) {
              console.error('Session validation failed during auth change:', error)
              await supabase.auth.signOut()
              setSession(null)
              setUser(null)
            } else {
              setSession(session)
              setUser(currentUser)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        // On error, clear session to be safe
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Cleanup effect to prevent session contamination
  useEffect(() => {
    return () => {
      // Clear any stale session data when component unmounts
      setUser(null)
      setSession(null)
    }
  }, [])

  const signOut = async () => {
    try {
      // Clear local state immediately for better UX
      setUser(null)
      setSession(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error during sign out:', error)
        // Even if there's an error, we want to clear local state
        // so the user can't access protected routes
      }
      
      // Additional cleanup - clear any stored tokens or user data
      // This ensures complete session cleanup
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      // Ensure local state is cleared even on unexpected errors
      setUser(null)
      setSession(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
