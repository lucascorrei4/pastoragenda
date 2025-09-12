import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Settings, Link, Copy, CheckCircle } from 'lucide-react'
import AgendaSharingSettings from '../components/AgendaSharingSettings'

function AgendaSharingPage() {
  const { t } = useTranslation()
  const [showSharingSettings, setShowSharingSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Share2 className="w-8 h-8 mr-3 text-primary-600" />
                {t('navigation.agendaSharing')}
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {t('sharing.page.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setShowSharingSettings(true)}
              className="btn-primary flex items-center space-x-2 px-6 py-3"
            >
              <Settings className="w-5 h-5" />
              <span>{t('sharing.page.manageSharing')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sharing Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2 text-primary-600" />
              {t('sharing.page.sharingOverview')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{t('sharing.page.publicAccess')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('sharing.page.publicAccessDesc')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-full">
                    {t('sharing.page.notConfigured')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{t('sharing.page.timeLimitedSharing')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('sharing.page.timeLimitedSharingDesc')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-full">
                    {t('sharing.page.notConfigured')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              {t('sharing.page.quickActions')}
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowSharingSettings(true)}
                className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-primary-600" />
                  <div className="text-left">
                    <h3 className="font-medium text-primary-900 dark:text-primary-100">{t('sharing.page.configureSharing')}</h3>
                    <p className="text-sm text-primary-700 dark:text-primary-300">{t('sharing.page.configureSharingDesc')}</p>
                  </div>
                </div>
                <Copy className="w-4 h-4 text-primary-600" />
              </button>

              <button
                onClick={() => setShowSharingSettings(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Link className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('sharing.page.viewPublicLink')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sharing.page.viewPublicLinkDesc')}</p>
                  </div>
                </div>
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">{t('sharing.page.needHelp')}</h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            {t('sharing.page.helpDesc')}
          </p>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p>• <strong>{t('sharing.page.publicAccess')}:</strong> {t('sharing.page.publicAccessHelp')}</p>
            <p>• <strong>{t('sharing.page.timeLimitedSharing')}:</strong> {t('sharing.page.timeLimitedHelp')}</p>
            <p>• <strong>{t('sharing.anonymousLink')}:</strong> {t('sharing.page.anonymousLinksHelp')}</p>
          </div>
        </div>
      </div>

      {/* Sharing Settings Modal */}
      {showSharingSettings && (
        <AgendaSharingSettings onClose={() => setShowSharingSettings(false)} />
      )}
    </div>
  )
}

export default AgendaSharingPage
