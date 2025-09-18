import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, CheckCircle, XCircle, ExternalLink, Settings, RefreshCw } from 'lucide-react'
import { googleCalendarService } from '../lib/google-calendar-service'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface GoogleCalendarIntegrationProps {
  onClose?: () => void
}

function GoogleCalendarIntegration({ onClose }: GoogleCalendarIntegrationProps) {
  const { t } = useTranslation()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [calendarInfo, setCalendarInfo] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true)
      const connected = await googleCalendarService.isConnected()
      setIsConnected(connected)

      if (connected) {
        // Get calendar info
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('google_calendar_id, google_calendar_sync_enabled')
            .eq('id', user.id)
            .single()

          if (profile) {
            setSyncEnabled(profile.google_calendar_sync_enabled)
            setCalendarInfo({
              id: profile.google_calendar_id || '',
              name: 'Primary Calendar'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
      toast.error(t('googleCalendar.errors.checkStatus'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const result = await googleCalendarService.getAuthUrl()
      
      if (result.success && result.authUrl) {
        // Open Google OAuth in popup
        const popup = window.open(
          result.authUrl,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // Listen for the popup to close and check for success
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            checkConnectionStatus()
            setIsConnecting(false)
          }
        }, 1000)

        // Listen for message from popup (if using postMessage)
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            popup?.close()
            checkConnectionStatus()
            setIsConnecting(false)
            toast.success(t('googleCalendar.connected'))
          } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
            clearInterval(checkClosed)
            popup?.close()
            setIsConnecting(false)
            toast.error(t('googleCalendar.errors.connectFailed'))
          }
        }

        window.addEventListener('message', handleMessage)
        
        // Cleanup listener after 5 minutes
        setTimeout(() => {
          window.removeEventListener('message', handleMessage)
          clearInterval(checkClosed)
        }, 300000)
      } else {
        toast.error(result.error || t('googleCalendar.errors.connectFailed'))
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error)
      toast.error(t('googleCalendar.errors.connectFailed'))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      const success = await googleCalendarService.disconnect()
      
      if (success) {
        setIsConnected(false)
        setSyncEnabled(false)
        setCalendarInfo(null)
        toast.success(t('googleCalendar.disconnected'))
      } else {
        toast.error(t('googleCalendar.errors.disconnectFailed'))
      }
    } catch (error) {
      console.error('Error disconnecting from Google Calendar:', error)
      toast.error(t('googleCalendar.errors.disconnectFailed'))
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleToggleSync = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ google_calendar_sync_enabled: !syncEnabled })
        .eq('id', user.id)

      if (error) {
        toast.error(t('googleCalendar.errors.updateSettings'))
        return
      }

      setSyncEnabled(!syncEnabled)
      toast.success(
        !syncEnabled 
          ? t('googleCalendar.syncEnabled') 
          : t('googleCalendar.syncDisabled')
      )
    } catch (error) {
      console.error('Error toggling sync:', error)
      toast.error(t('googleCalendar.errors.updateSettings'))
    }
  }

  const handleRefresh = async () => {
    await checkConnectionStatus()
    toast.success(t('googleCalendar.refreshed'))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('googleCalendar.title')}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            title={t('googleCalendar.refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isConnected ? t('googleCalendar.connected') : t('googleCalendar.notConnected')}
              </h3>
              {isConnected && calendarInfo && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('googleCalendar.syncingWith', { calendar: calendarInfo.name })}
                </p>
              )}
            </div>
          </div>
          
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="btn-secondary"
            >
              {isDisconnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                t('googleCalendar.disconnect')
              )}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-primary"
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                t('googleCalendar.connect')
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sync Settings */}
      {isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('googleCalendar.syncSettings')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('googleCalendar.syncDescription')}
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={handleToggleSync}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
          {t('googleCalendar.features.title')}
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>{t('googleCalendar.features.autoSync')}</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>{t('googleCalendar.features.attendeeInfo')}</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>{t('googleCalendar.features.reminders')}</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>{t('googleCalendar.features.twoWaySync')}</span>
          </li>
        </ul>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>{t('googleCalendar.helpText')}</p>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2"
        >
          <span>{t('googleCalendar.openGoogleCalendar')}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

export default GoogleCalendarIntegration
