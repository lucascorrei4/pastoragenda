import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Mail, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

function AuthPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      // First try to sign in (check if user exists)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (signInError) {
        // User doesn't exist, try to sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: 'temp-password-123', // Temporary password for OTP flow
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        })

        if (signUpError) {
          toast.error(signUpError.message)
          return
        }
        setIsNewUser(true)
        toast.success('Welcome! OTP code sent to your email.')
      } else {
        setIsNewUser(false)
        toast.success('Welcome back! OTP code sent to your email.')
      }

      setStep('otp')
      setCountdown(60) // 60 second countdown
    } catch (error) {
      toast.error('Failed to send OTP code. Please try again.')
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
      // Verify the OTP with Supabase
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Success! User is now authenticated
      if (isNewUser) {
        toast.success('Account created and verified successfully!')
      } else {
        toast.success('Signed in successfully!')
      }

      // The user will be automatically redirected by the AuthContext useEffect
      // which detects the user state change and navigates to /dashboard
    } catch (error) {
      toast.error('Failed to verify OTP code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = () => {
    if (countdown > 0) return
    handleSendOTP()
  }

  const resetForm = () => {
    setStep('email')
    setEmail('')
    setOtp('')
    setCountdown(0)
    setIsNewUser(false)
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Send OTP Button */}
                <button
                  onClick={handleSendOTP}
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Continue with Email
                    </>
                  )}
                </button>

                {/* Info Text */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  We'll automatically create an account if you're new, or sign you in if you already have one.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter OTP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      autoComplete="one-time-code"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-center text-lg tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    We've sent a 6-digit OTP code to <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                  </p>
                </div>

                {/* Verify OTP Button */}
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    onClick={handleResendOTP}
                    disabled={countdown > 0}
                    className="text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Privacy */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('auth.terms')}{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
            {t('auth.termsOfService')}
          </a>{' '}
          {t('common.and')}{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
            {t('auth.privacyPolicy')}
          </a>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
