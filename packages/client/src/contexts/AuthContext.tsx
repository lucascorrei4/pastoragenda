import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { customAuth, User } from '../lib/custom-auth'
import { webViewBridge } from '../lib/webview-bridge'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(loading)
  const validationInProgress = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    let mounted = true

    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      // Prevent multiple simultaneous validation calls
      if (validationInProgress.current) {
        return
      }

      try {
        validationInProgress.current = true

        // Check if we have a stored token and user
        const currentUser = customAuth.getCurrentUser()
        const token = customAuth.getToken()

        if (currentUser && token) {
          // Only validate token if we don't have recent validation
          const lastValidation = localStorage.getItem('last_token_validation')
          const now = Date.now()
          const validationAge = lastValidation ? now - parseInt(lastValidation) : Infinity
          
          // Only validate if token is older than 5 minutes
          if (validationAge > 5 * 60 * 1000) {
            const validationResult = await customAuth.validateToken()
            
            if (validationResult.success && validationResult.user) {
              localStorage.setItem('last_token_validation', now.toString())
              if (mounted) {
                // Only update if user data has actually changed
                if (!user || JSON.stringify(user) !== JSON.stringify(validationResult.user)) {
                  setUser(validationResult.user)
                  // Notify React Native about user authentication
                  webViewBridge.updateUserAuth(
                    validationResult.user.id,
                    validationResult.user.email,
                    token
                  )
                  // Register device for push notifications if in React Native
                  if (webViewBridge.isRunningInReactNative()) {
                    webViewBridge.registerDevice({
                      token: 'web-push-token', // This should be replaced with actual push token from React Native
                      deviceId: `web_${validationResult.user.id}_${Date.now()}`,
                      platform: 'web',
                      appVersion: '1.0.0',
                      deviceModel: navigator.userAgent,
                      osVersion: navigator.platform,
                    })
                  }
                }
                setLoading(false)
              }
              return
            } else {
              // Token is invalid, clear auth data
              customAuth.signOut()
            }
          } else {
            if (mounted) {
              // Only update if user data has actually changed
              if (!user || JSON.stringify(user) !== JSON.stringify(currentUser)) {
                setUser(currentUser)
                // Notify React Native about user authentication
                webViewBridge.updateUserAuth(
                  currentUser.id,
                  currentUser.email,
                  token
                )
                // Register device for push notifications if in React Native
                if (webViewBridge.isRunningInReactNative()) {
                  webViewBridge.registerDevice({
                    token: 'web-push-token', // This should be replaced with actual push token from React Native
                    deviceId: `web_${currentUser.id}_${Date.now()}`,
                    platform: 'web',
                    appVersion: '1.0.0',
                    deviceModel: navigator.userAgent,
                    osVersion: navigator.platform,
                  })
                }
              }
              setLoading(false)
            }
            return
          }
        }

        // Check for development mode bypass
        if (import.meta.env.DEV) {
          const devBypass = localStorage.getItem('dev_auth_bypass')
          const devEmail = localStorage.getItem('dev_user_email')
          
          if (devBypass === 'true' && devEmail) {
            const devResult = await customAuth.devBypass(devEmail)
            if (devResult.success && devResult.user) {
              if (mounted) {
                // Only update if user data has actually changed
                if (!user || JSON.stringify(user) !== JSON.stringify(devResult.user)) {
                  setUser(devResult.user)
                  // Notify React Native about user authentication
                  webViewBridge.updateUserAuth(
                    devResult.user.id,
                    devResult.user.email,
                    devResult.token || null
                  )
                  // Register device for push notifications if in React Native
                  if (webViewBridge.isRunningInReactNative()) {
                    webViewBridge.registerDevice({
                      token: 'web-push-token', // This should be replaced with actual push token from React Native
                      deviceId: `web_${devResult.user.id}_${Date.now()}`,
                      platform: 'web',
                      appVersion: '1.0.0',
                      deviceModel: navigator.userAgent,
                      osVersion: navigator.platform,
                    })
                  }
                }
                setLoading(false)
              }
              return
            }
          }
        }

        // No valid authentication found
        if (mounted) {
          setUser(null)
          // Notify React Native about user logout
          webViewBridge.updateUserAuth(null, null, null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      } finally {
        validationInProgress.current = false
      }
    }

    checkAuthStatus()

    // Listen for storage changes to detect when user logs in from another tab/component
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data' && e.newValue) {
        try {
          const newUser = JSON.parse(e.newValue)
          if (mounted && (!user || JSON.stringify(user) !== JSON.stringify(newUser))) {
            console.log('User data changed in localStorage, updating context')
            setUser(newUser)
            // Notify React Native about user authentication
            webViewBridge.updateUserAuth(
              newUser.id,
              newUser.email,
              customAuth.getToken()
            )
            // Register device for push notifications if in React Native
            if (webViewBridge.isRunningInReactNative()) {
              webViewBridge.registerDevice({
                token: 'web-push-token', // This should be replaced with actual push token from React Native
                deviceId: `web_${newUser.id}_${Date.now()}`,
                platform: 'web',
                appVersion: '1.0.0',
                deviceModel: navigator.userAgent,
                osVersion: navigator.platform,
              })
            }
          }
        } catch (error) {
          console.error('Error parsing user data from storage event:', error)
        }
      } else if (e.key === 'user_data' && !e.newValue) {
        // User data was removed (logout)
        if (mounted) {
          setUser(null)
          // Notify React Native about user logout
          webViewBridge.updateUserAuth(null, null, null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check for changes periodically (fallback for same-tab changes)
    const intervalId = setInterval(() => {
      const currentUser = customAuth.getCurrentUser()
      if (mounted && currentUser && (!user || JSON.stringify(user) !== JSON.stringify(currentUser))) {
        setUser(currentUser)
        // Notify React Native about user authentication
        webViewBridge.updateUserAuth(
          currentUser.id,
          currentUser.email,
          customAuth.getToken()
        )
        // Register device for push notifications if in React Native
        if (webViewBridge.isRunningInReactNative()) {
          webViewBridge.registerDevice({
            token: 'web-push-token', // This should be replaced with actual push token from React Native
            deviceId: `web_${currentUser.id}_${Date.now()}`,
            platform: 'web',
            appVersion: '1.0.0',
            deviceModel: navigator.userAgent,
            osVersion: navigator.platform,
          })
        }
      }
    }, 1000) // Check every second

    // Ensure loading is set to false after a reasonable timeout
    const loadingTimeout = setTimeout(() => {
      if (mounted && loadingRef.current) {
        setLoading(false)
      }
    }, 3000) // 3 second timeout

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      clearInterval(intervalId)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])



  const signOut = async () => {
    try {
      // Clear local state immediately for better UX
      setUser(null)
      
      // Notify React Native about user logout
      webViewBridge.updateUserAuth(null, null, null)
      
      // Clear validation cache
      localStorage.removeItem('last_token_validation')
      
      // Sign out from custom auth service
      await customAuth.signOut()
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      // Ensure local state is cleared even on unexpected errors
      setUser(null)
      // Notify React Native about user logout even on error
      webViewBridge.updateUserAuth(null, null, null)
    }
  }

  const refreshUser = () => {
    const currentUser = customAuth.getCurrentUser()
    if (currentUser && (!user || JSON.stringify(user) !== JSON.stringify(currentUser))) {
      console.log('Refreshing user state from customAuth')
      setUser(currentUser)
      // Notify React Native about user authentication
      webViewBridge.updateUserAuth(
        currentUser.id,
        currentUser.email,
        customAuth.getToken()
      )
      // Register device for push notifications if in React Native
      if (webViewBridge.isRunningInReactNative()) {
        webViewBridge.registerDevice({
          token: 'web-push-token', // This should be replaced with actual push token from React Native
          deviceId: `web_${currentUser.id}_${Date.now()}`,
          platform: 'web',
          appVersion: '1.0.0',
          deviceModel: navigator.userAgent,
          osVersion: navigator.platform,
        })
      }
    }
  }

  const value = {
    user,
    loading,
    signOut,
    refreshUser,
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
