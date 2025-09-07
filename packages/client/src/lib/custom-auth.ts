/**
 * Custom authentication service using JWT tokens and OTP verification
 */

export interface User {
  id: string
  email: string
  full_name: string
  alias: string
  email_verified: boolean
  last_login_at?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  isNewUser?: boolean
  error?: string
}

export interface ValidateTokenResponse {
  success: boolean
  user?: User
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

class CustomAuthService {
  private token: string | null = null
  private user: User | null = null
  private validationPromise: Promise<ValidateTokenResponse> | null = null
  private lastValidationTime: number = 0
  private readonly VALIDATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token')
    this.user = this.getStoredUser()
  }

  /**
   * Send OTP to user's email
   */
  async sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/functions/v1/auth-send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send OTP' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error sending OTP:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  /**
   * Verify OTP and get JWT token
   */
  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/functions/v1/auth-verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to verify OTP' }
      }

      if (data.success && data.token && data.user) {
        // Store token and user data
        this.token = data.token
        this.user = data.user
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        
        return {
          success: true,
          token: data.token,
          user: data.user,
          isNewUser: data.isNewUser
        }
      }

      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  /**
   * Validate JWT token and get user data
   * Implements aggressive caching and request deduplication
   */
  async validateToken(): Promise<ValidateTokenResponse> {
    if (!this.token) {
      return { success: false, error: 'No token found' }
    }

    const now = Date.now()
    
    // Check if we have a recent validation
    if (now - this.lastValidationTime < this.VALIDATION_CACHE_DURATION) {
      return { success: true, user: this.user! }
    }

    // Check if there's already a validation in progress
    if (this.validationPromise) {
      return await this.validationPromise
    }

    // Start new validation
    console.log('Starting new token validation...')
    this.validationPromise = this._performTokenValidation()
    
    try {
      const result = await this.validationPromise
      this.lastValidationTime = now
      return result
    } finally {
      this.validationPromise = null
    }
  }

  /**
   * Internal method to perform the actual token validation
   */
  private async _performTokenValidation(): Promise<ValidateTokenResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/functions/v1/auth-validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ token: this.token })
      })

      const data = await response.json()

      if (!response.ok) {
        // Token is invalid, clear stored data
        this.clearAuthData()
        return { success: false, error: data.error || 'Invalid token' }
      }

      if (data.success && data.user) {
        this.user = data.user
        localStorage.setItem('user_data', JSON.stringify(data.user))
        return { success: true, user: data.user }
      }

      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Error validating token:', error)
      this.clearAuthData()
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    this.clearAuthData()
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.user)
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('user_data')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error parsing stored user data:', error)
      return null
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    this.token = null
    this.user = null
    this.validationPromise = null
    this.lastValidationTime = 0
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('dev_auth_bypass')
    localStorage.removeItem('dev_user_email')
    localStorage.removeItem('last_token_validation')
    sessionStorage.clear()
  }

  /**
   * Development mode bypass (for testing)
   */
  async devBypass(email: string): Promise<AuthResponse> {
    if (!import.meta.env.DEV) {
      return { success: false, error: 'Development mode only' }
    }

    // Create a mock user for development
    const mockUser: User = {
      id: 'dev-user-id',
      email: email,
      full_name: 'Development User',
      alias: 'dev-user',
      email_verified: true,
      last_login_at: new Date().toISOString()
    }

    // Create a proper JWT token for development
    const mockToken = await this.createDevJWT(mockUser)

    this.token = mockToken
    this.user = mockUser
    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('user_data', JSON.stringify(mockUser))
    localStorage.setItem('dev_auth_bypass', 'true')
    localStorage.setItem('dev_user_email', email)

    return {
      success: true,
      token: mockToken,
      user: mockUser,
      isNewUser: false
    }
  }

  /**
   * Create a development JWT token that matches the server-side format
   */
  private async createDevJWT(user: User): Promise<string> {
    const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      userId: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      iat: now,
      exp: now + (365 * 24 * 60 * 60) // 1 year expiration
    }

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    // Create signature
    const signature = await this.createSignature(`${encodedHeader}.${encodedPayload}`, JWT_SECRET)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  /**
   * Create HMAC signature for JWT
   */
  private async createSignature(data: string, secret: string): Promise<string> {
    // Convert hex string to binary data if needed (same as server)
    let keyData: Uint8Array;
    if (secret.length === 128 && /^[0-9a-fA-F]+$/.test(secret)) {
      // It's a hex string, convert to binary
      const hexBytes = secret.match(/.{2}/g) || [];
      keyData = new Uint8Array(hexBytes.map(byte => parseInt(byte, 16)));
    } else {
      // It's a regular string, encode as UTF-8
      keyData = new TextEncoder().encode(secret);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      keyData as unknown as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
    const signatureArray = new Uint8Array(signature)
    return btoa(String.fromCharCode(...signatureArray)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
}

// Create singleton instance
export const customAuth = new CustomAuthService()

// Types are already exported above, no need to re-export
