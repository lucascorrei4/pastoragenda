import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, X, Bell, Calendar, Users } from 'lucide-react'

interface WelcomeMessageProps {
  userName?: string
  onDismiss?: () => void
}

function WelcomeMessage({ userName, onDismiss }: WelcomeMessageProps) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has seen the welcome message
    const hasSeenWelcome = localStorage.getItem('welcome_message_dismissed')
    if (!hasSeenWelcome) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('welcome_message_dismissed', 'true')
    onDismiss?.()
  }

  if (!show || dismissed) {
    return null
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('welcome.title', { name: userName || 'User' })}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('welcome.message')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 text-primary-500" />
              <span>{t('welcome.createEventTypes')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Bell className="h-4 w-4 text-primary-500" />
              <span>{t('welcome.manageBookings')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 text-primary-500" />
              <span>{t('welcome.setAvailability')}</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-300 dark:bg-primary-800 dark:hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('welcome.getStarted')}
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('welcome.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeMessage
