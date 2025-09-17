import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, HelpCircle, MessageSquare, Clock, Shield, Trash2, User } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'

function SupportPage() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleContactSupport = async () => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Create mailto link with pre-filled subject
      const subject = encodeURIComponent('PastorAgenda Support Request')
      const body = encodeURIComponent(`
Hello PastorAgenda Support Team,

I need help with:

[Please describe your issue or question here]

Best regards,
[Your name]
      `)
      
      window.open(`mailto:pastoragendaapp@gmail.com?subject=${subject}&body=${body}`)
      setSubmitStatus('success')
    } catch (error) {
      console.error('Error opening email client:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAccountDeletion = async () => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Create mailto link for account deletion
      const subject = encodeURIComponent('Account Deletion Request - PastorAgenda')
      const body = encodeURIComponent(`
Hello PastorAgenda Support Team,

I would like to request the deletion of my PastorAgenda account.

Account Details:
- Email: [Your email address]
- Pastor Name: [Your pastor name]
- Reason for deletion: [Optional - please specify if you'd like to share]

Please confirm the deletion and let me know if any additional information is required.

Best regards,
[Your name]
      `)
      
      window.open(`mailto:pastoragendaapp@gmail.com?subject=${subject}&body=${body}`)
      setSubmitStatus('success')
    } catch (error) {
      console.error('Error opening email client:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('support.title')}
            </h1>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact Support */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('support.contactSupport')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('support.contactSupportDescription')}
            </p>
            <button
              onClick={handleContactSupport}
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('support.sending')}
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  {t('support.sendEmail')}
                </>
              )}
            </button>
          </div>

          {/* Account Deletion */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('support.deleteAccount')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('support.deleteAccountDescription')}
            </p>
            <button
              onClick={handleAccountDeletion}
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('support.sending')}
                </>
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  {t('support.requestDeletion')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t('support.emailOpened')}
                </p>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('support.emailError')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <HelpCircle className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('support.frequentlyAsked')}
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('support.faq1.question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('support.faq1.answer')}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('support.faq2.question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('support.faq2.answer')}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('support.faq3.question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('support.faq3.answer')}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('support.faq4.question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('support.faq4.answer')}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {t('support.responseTime')}
            </h3>
          </div>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            {t('support.responseTimeDescription')}
          </p>
          <div className="flex items-center text-blue-700 dark:text-blue-300">
            <Shield className="h-5 w-5 mr-2" />
            <span className="text-sm">
              {t('support.privacyNote')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportPage
