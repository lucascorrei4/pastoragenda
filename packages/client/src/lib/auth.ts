import { supabase } from './supabase'

/**
 * Utility functions for authentication and session management
 */

export const authUtils = {
  /**
   * Check if user is authenticated by validating the session
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return !error && !!session && !!session.user
    } catch (error) {
      console.error('Error checking authentication status:', error)
      return false
    }
  },

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  },

  /**
   * Clear all authentication data
   */
  async clearAuthData() {
    try {
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear localStorage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      console.log('All authentication data cleared')
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  },

  /**
   * Validate and refresh session if needed
   */
  async validateSession() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        // Session is invalid, clear it
        await this.clearAuthData()
        return false
      }
      return true
    } catch (error) {
      console.error('Error validating session:', error)
      await this.clearAuthData()
      return false
    }
  }
}
