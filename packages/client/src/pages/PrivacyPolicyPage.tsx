import { useTranslation } from 'react-i18next'
import { Shield, Mail, Globe, Calendar } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'

function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('privacyPolicy.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('privacyPolicy.lastUpdated')}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-primary-600" />
                {t('privacyPolicy.section1.title')}
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section1.personalInfo.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section1.personalInfo.pastorProfiles')}</li>
                  <li>{t('privacyPolicy.section1.personalInfo.appointmentData')}</li>
                  <li>{t('privacyPolicy.section1.personalInfo.userCommunications')}</li>
                  <li>{t('privacyPolicy.section1.personalInfo.accountInfo')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section1.technicalInfo.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section1.technicalInfo.deviceInfo')}</li>
                  <li>{t('privacyPolicy.section1.technicalInfo.usageData')}</li>
                  <li>{t('privacyPolicy.section1.technicalInfo.locationData')}</li>
                  <li>{t('privacyPolicy.section1.technicalInfo.logData')}</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('privacyPolicy.section2.title')}
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section2.coreServices.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section2.coreServices.appointmentManagement')}</li>
                  <li>{t('privacyPolicy.section2.coreServices.userAuth')}</li>
                  <li>{t('privacyPolicy.section2.coreServices.communication')}</li>
                  <li>{t('privacyPolicy.section2.coreServices.profileManagement')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section2.serviceImprovement.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section2.serviceImprovement.appFunctionality')}</li>
                  <li>{t('privacyPolicy.section2.serviceImprovement.technicalSupport')}</li>
                  <li>{t('privacyPolicy.section2.serviceImprovement.analytics')}</li>
                  <li>{t('privacyPolicy.section2.serviceImprovement.security')}</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('privacyPolicy.section3.title')}
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section3.noSell.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section3.noSell.neverSell')}</li>
                  <li>{t('privacyPolicy.section3.noSell.noMarketing')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section3.limitedSharing.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section3.limitedSharing.serviceProviders')}</li>
                  <li>{t('privacyPolicy.section3.limitedSharing.legalRequirements')}</li>
                  <li>{t('privacyPolicy.section3.limitedSharing.userConsent')}</li>
                  <li>{t('privacyPolicy.section3.limitedSharing.businessTransfers')}</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('privacyPolicy.section4.title')}
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section4.protectionMeasures.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section4.protectionMeasures.encryption')}</li>
                  <li>{t('privacyPolicy.section4.protectionMeasures.accessControls')}</li>
                  <li>{t('privacyPolicy.section4.protectionMeasures.regularAudits')}</li>
                  <li>{t('privacyPolicy.section4.protectionMeasures.secureInfrastructure')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section4.dataRetention.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section4.dataRetention.activeAccounts')}</li>
                  <li>{t('privacyPolicy.section4.dataRetention.inactiveAccounts')}</li>
                  <li>{t('privacyPolicy.section4.dataRetention.legalRequirements')}</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('privacyPolicy.section5.title')}
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section5.accessControl.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section5.accessControl.viewData')}</li>
                  <li>{t('privacyPolicy.section5.accessControl.updateInfo')}</li>
                  <li>{t('privacyPolicy.section5.accessControl.deleteAccount')}</li>
                  <li>{t('privacyPolicy.section5.accessControl.dataExport')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {t('privacyPolicy.section5.communicationPrefs.title')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t('privacyPolicy.section5.communicationPrefs.emailSettings')}</li>
                  <li>{t('privacyPolicy.section5.communicationPrefs.marketingCommunications')}</li>
                  <li>{t('privacyPolicy.section5.communicationPrefs.pushNotifications')}</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Mail className="w-6 h-6 mr-3 text-primary-600" />
                {t('privacyPolicy.contact.title')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {t('privacyPolicy.contact.privacyQuestions.title')}
                  </h3>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>{t('privacyPolicy.contact.privacyQuestions.email')}</li>
                    <li>{t('privacyPolicy.contact.privacyQuestions.support')}</li>
                    <li>{t('privacyPolicy.contact.privacyQuestions.website')}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {t('privacyPolicy.contact.dataProtection.title')}
                  </h3>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>{t('privacyPolicy.contact.dataProtection.email')}</li>
                    <li>{t('privacyPolicy.contact.dataProtection.responseTime')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('privacyPolicy.footer.effectiveDate')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
