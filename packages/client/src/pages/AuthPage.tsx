import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { customAuth } from '../lib/custom-auth'
import { Mail, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

function AuthPage() {
  const { user, loading, refreshUser } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // Don't redirect here - let the routing handle it naturally
  // The ProtectedRoute component will handle redirecting authenticated users

  // Ensure we start with email step
  useEffect(() => {
    setStep('email')
  }, [])



  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    // Check if user is already authenticated before sending OTP
    if (user) {
      console.log('User is already authenticated')
      return
    }

    // Check for existing authentication with matching email
    const currentUser = customAuth.getCurrentUser()
    if (currentUser && currentUser.email === email) {
      console.log('Valid session found for email')
      return
    }

    // Rate limiting disabled for testing purposes
    // Uncomment the following block to re-enable rate limiting:
    /*
    const lastAttempt = localStorage.getItem(`otp_attempt_${email}`)
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt)
      if (timeSinceLastAttempt < 60000) { // 1 minute cooldown
        const remainingTime = Math.ceil((60000 - timeSinceLastAttempt) / 1000)
        toast.error(`Please wait ${remainingTime} seconds before trying again`)
        return
      }
    }
    */

    setIsLoading(true)
    
    try {
      // Send OTP using custom auth service
      const result = await customAuth.sendOTP(email)

      if (result.success) {
        setIsNewUser(false) // We'll determine this after OTP verification
        toast.success('OTP code sent to your email.')
        setStep('otp')
      } else {
        toast.error(result.error || 'Unable to send OTP. Please try again.')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      toast.error('Unable to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit OTP code')
      return
    }

    setIsLoading(true)
    try {
      // Development mode: Allow testing with "000000" OTP
      if (import.meta.env.DEV && otp === '000000') {
        toast.success('Development mode: OTP bypassed successfully!')
        
        // Use development bypass
        const devResult = await customAuth.devBypass(email)
        
        if (devResult.success) {
          if (devResult.isNewUser) {
            toast.success('Account created and verified successfully!')
          } else {
            toast.success('Signed in successfully!')
          }
          
          // Refresh the user state in AuthContext to trigger redirect
          refreshUser()
        } else {
          toast.error(devResult.error || 'Development bypass failed')
        }
        return
      }

      // Verify the OTP with custom auth service
      const result = await customAuth.verifyOTP(email, otp)

      if (result.success && result.user) {
        setIsNewUser(result.isNewUser || false)
        
        // Success! User is now authenticated
        if (result.isNewUser) {
          toast.success('Account created and verified successfully!')
        } else {
          toast.success('Signed in successfully!')
        }

        // Refresh the user state in AuthContext to trigger redirect
        refreshUser()
      } else {
        toast.error(result.error || 'Invalid OTP code. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error('Unable to verify OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = () => {
    handleSendOTP()
  }

  const resetForm = () => {
    setStep('email')
    setEmail('')
    setOtp('')
    setIsNewUser(false)
    // Clear any existing rate limiting data for testing
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('otp_attempt_')) {
        localStorage.removeItem(key)
      }
    })
    // Clear development mode flags
    localStorage.removeItem('dev_auth_bypass')
    localStorage.removeItem('dev_user_email')
  }



  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // If user is authenticated, redirect to dashboard immediately
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo.png" alt="PastorAgenda" className="h-16 w-auto mx-auto" />
        </div>

        {/* Main Title */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {step === 'email' ? 'Welcome to PastorAgenda' : 'Verify Your Email'}
        </h2>

        {/* Subtitle */}
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {step === 'email'
            ? 'Enter your email to sign in or create an account'
            : `We've sent a 6-digit code to ${email}`
          }
        </p>


      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-200 dark:border-gray-700">
          {/* Back Button - Show when on OTP step */}
          {step === 'otp' && (
            <button
              onClick={resetForm}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to email
            </button>
          )}

          {/* Form Content */}
          <div className="transition-all duration-300 ease-in-out">
            {step === 'email' ? (
              <div className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading && !user) {
                          handleSendOTP()
                        }
                      }}
                      className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading || !!user}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <KeyRound className="w-4 h-4 mr-2" />
                        Continue with Email
                      </div>
                    )}
                  </button>
                </div>
              </div>
            ) : step === 'otp' ? (
              <div className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter OTP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      autoComplete="one-time-code"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 text-center text-lg font-mono tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    We've sent a 6-digit OTP code to {email}
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length < 6}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Resend OTP Code
                  </button>
                </div>
              </div>
            ) : (
              // Fallback - should show email step
              <div className="space-y-6">
                <div className="text-center text-red-500">
                  Error: Invalid step state. Please refresh the page.
                </div>
                <button
                  onClick={() => setStep('email')}
                  className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg"
                >
                  Go to Email Step
                </button>
              </div>
            )}
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:text-primary-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:text-primary-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
