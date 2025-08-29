import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, Clock, Shield, ArrowRight, CheckCircle, MessageSquare, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

function HomePage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <img src="/logo.png" alt="PastorAgenda" className="h-12 w-auto" />
            </div>
            <div className="flex items-center space-x-6">
              <LanguageSwitcher dropdownPosition="below" />
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('navigation.dashboard')}
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('navigation.signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-sm font-medium mb-8">
              {t('home.hero.badge')}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              <span className="block">{t('home.hero.title')}</span>
              <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 dark:from-blue-400 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent">
                {t('home.hero.subtitle')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              {t('home.hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/auth"
                className="group inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                {t('home.hero.cta')} +
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-8 py-4 border-2 border-white dark:border-gray-300 text-white dark:text-gray-300 font-semibold rounded-xl text-lg hover:border-teal-500 hover:text-teal-400 transition-colors duration-200"
              >
                {t('home.learnMore')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-teal-200 dark:bg-teal-800 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-teal-300 dark:bg-teal-700 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-teal-400 dark:bg-teal-600 rounded-full opacity-20 animate-pulse delay-2000"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-sm font-medium mb-6">
              {t('home.features.badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('home.features.subtitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('home.features.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.features.feature1.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature1.description')}
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.features.feature2.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature2.description')}
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.features.feature3.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature3.description')}
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.features.feature4.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature4.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {t('home.stats.pastors')}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {t('home.stats.pastorsLabel')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {t('home.stats.appointments')}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {t('home.stats.appointmentsLabel')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {t('home.stats.satisfaction')}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {t('home.stats.satisfactionLabel')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-3xl mx-auto">
            {t('home.cta.description')}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            {t('home.cta.button')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('home.pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('home.pricing.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('home.pricing.free.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('home.pricing.free.description')}
                </p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  $0
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-8">
                  /{t('home.pricing.month')}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.free.features.feature1')}
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.free.features.feature2')}
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.free.features.feature3')}
                  </li>
                </ul>
                <Link
                  to="/auth"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('home.pricing.free.button')}
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-primary-600 dark:bg-primary-700 rounded-2xl p-8 shadow-xl border-2 border-primary-500 dark:border-primary-400 transform scale-105">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 text-sm font-medium mb-4">
                  {t('home.pricing.pro.badge')}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('home.pricing.pro.title')}
                </h3>
                <p className="text-primary-100 mb-6">
                  {t('home.pricing.pro.description')}
                </p>
                <div className="text-4xl font-bold text-white mb-2">
                  $19
                </div>
                <div className="text-primary-200 mb-8">
                  /{t('home.pricing.month')}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                    {t('home.pricing.pro.features.feature1')}
                  </li>
                  <li className="flex items-center text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                    {t('home.pricing.pro.features.feature2')}
                  </li>
                  <li className="flex items-center text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                    {t('home.pricing.pro.features.feature3')}
                  </li>
                  <li className="flex items-center text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                    {t('home.pricing.pro.features.feature4')}
                  </li>
                </ul>
                <Link
                  to="/auth"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-primary-600 font-medium rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  {t('home.pricing.pro.button')}
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('home.pricing.enterprise.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('home.pricing.enterprise.description')}
                </p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('home.pricing.enterprise.price')}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-8">
                  {t('home.pricing.enterprise.period')}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.enterprise.features.feature1')}
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.enterprise.features.feature2')}
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.enterprise.features.feature3')}
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {t('home.pricing.enterprise.features.feature4')}
                  </li>
                </ul>
                <Link
                  to="/auth"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('home.pricing.enterprise.button')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('home.support.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('home.support.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.support.chat.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('home.support.chat.description')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('home.support.chat.availability')}
              </p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.support.email.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('home.support.email.description')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('home.support.email.response')}
              </p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('home.support.community.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('home.support.community.description')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('home.support.community.access')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/logo.png" alt="PastorAgenda" className="h-12 w-auto mb-4" />
              <p className="text-gray-400 text-sm">
                {t('home.footer.description')}
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.footer.product.title')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.product.features')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.product.pricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.product.updates')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.footer.support.title')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.support.help')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.support.contact')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.support.community')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.footer.company.title')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.company.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.company.blog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.company.careers')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 sm:mb-0">
                {t('home.footer.copyright')}
              </p>
              <LanguageSwitcher dropdownPosition="above" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
         