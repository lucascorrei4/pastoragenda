import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { googleCalendarService } from '../lib/google-calendar-service'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function GoogleCalendarCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage('Authorization was denied or failed')
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          return
        }

        const result = await googleCalendarService.exchangeCodeForTokens(code)

        if (result.success) {
          setStatus('success')
          setMessage('Google Calendar connected successfully!')
          
          // Notify parent window if opened in popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_CALENDAR_AUTH_SUCCESS'
            }, window.location.origin)
            
            // Close popup after a short delay
            setTimeout(() => {
              window.close()
            }, 2000)
          } else {
            // Redirect to profile settings after a delay
            setTimeout(() => {
              navigate('/profile-settings')
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to connect Google Calendar')
          
          // Notify parent window if opened in popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_CALENDAR_AUTH_ERROR',
              error: result.error
            }, window.location.origin)
            
            // Close popup after a short delay
            setTimeout(() => {
              window.close()
            }, 3000)
          }
        }
      } catch (error) {
        console.error('Error handling Google Calendar callback:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
        
        // Notify parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_CALENDAR_AUTH_ERROR',
            error: 'An unexpected error occurred'
          }, window.location.origin)
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close()
          }, 3000)
        }
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting to Google Calendar...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we set up your calendar integration.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This window will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This window will close automatically...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCalendarCallback
