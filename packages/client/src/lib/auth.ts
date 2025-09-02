import { customAuth } from './custom-auth'

/**
 * Utility functions for authentication and session management
 * Updated to use custom JWT authentication instead of Supabase Auth
 */

export const authUtils = {
  /**
   * Check if user is authenticated (synchronous check - no network calls)
   */
  isAuthenticatedSync(): boolean {
    return customAuth.isAuthenticated()
  },

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return customAuth.getToken()
  },

  /**
   * Get current user (synchronous check - no network calls)
   */
  getCurrentUserSync() {
    return customAuth.getCurrentUser()
  },

  /**
   * Clear all authentication data
   */
  async clearAuthData() {
    try {
      await customAuth.signOut()
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }
}
