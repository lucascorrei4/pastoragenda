import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, Clock, Shield, ArrowRight, CheckCircle, MessageSquare, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PublicProfilePage from './PublicProfilePage'
import packageJson from '../../package.json'

function HomePage() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Navigation */}
      <nav className="p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between">
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
        {/* Enhanced Wave Background */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]">
          <svg className="w-full h-full" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* First wave - more organic curve */}
            <path
              d="M0,600 C200,500 400,650 600,600 S800,500 1000,600 S1200,700 1200,600 L1200,800 L0,800 Z"
              fill="url(#waveGradient1)"
              className="animate-pulse"
              style={{ animationDuration: '15s', animationTimingFunction: 'ease-in-out' }}
            />
            {/* Second wave - overlapping for depth */}
            <path
              d="M0,650 C300,550 600,700 900,650 S1200,600 1200,650 L1200,800 L0,800 Z"
              fill="url(#waveGradient2)"
              className="animate-pulse"
              style={{ animationDuration: '20s', animationTimingFunction: 'ease-in-out', animationDelay: '3s' }}
            />
            {/* Third subtle wave for extra depth */}
            <path
              d="M0,700 C250,650 500,750 750,700 S1000,650 1200,700 L1200,800 L0,800 Z"
              fill="url(#waveGradient1)"
              className="animate-pulse"
              style={{ animationDuration: '25s', animationTimingFunction: 'ease-in-out', animationDelay: '6s' }}
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-sm font-medium mb-8">
              {t('home.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
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
                {t('home.hero.cta')} →
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>

              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-8 py-4 border-2 border-white dark:border-gray-300 text-white dark:text-gray-300 font-semibold rounded-xl text-lg hover:border-teal-500 hover:text-teal-400 transition-colors duration-200"
              >
                {t('home.learnMore')}
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-8 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                {t('home.hero.socialProof')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('home.problem.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
              {t('home.problem.description')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6 mb-12">
              {(t('home.problem.problems', { returnObjects: true }) as string[]).map((problem: string, index: number) => (
                <div key={index} className="flex items-start space-x-4 p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1">
                    <span className="text-red-600 dark:text-red-400 text-lg font-bold">❌</span>
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                    {problem}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-white-600 dark:text-white-400">
                {t('home.problem.solution')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-teal-900/20 dark:via-gray-800 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-sm font-medium mb-8">
              ✨ Reflexão Ministerial
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              {t('home.growth.title')}
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                {t('home.growth.message')}
              </p>
            </div>
            
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
              {t('home.features.subtitle')}
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t('home.features.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.features.feature1.title')}
              </h3>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-4">
                {t('home.features.feature1.subtitle')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature1.description')}
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.features.feature2.title')}
              </h3>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-4">
                {t('home.features.feature2.subtitle')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature2.description')}
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.features.feature3.title')}
              </h3>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-4">
                {t('home.features.feature3.subtitle')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature3.description')}
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.features.feature4.title')}
              </h3>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-4">
                {t('home.features.feature4.subtitle')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.feature4.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-teal-900/20 dark:via-gray-800 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('home.preview.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
              {t('home.preview.description')}
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t('home.preview.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <PublicProfilePage 
              key={i18n.language} 
              pastorId="b4b4fab2-3635-4c79-a912-1af234b08e83" 
              isPreview={true} 
            />
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
          <p className="text-xl text-primary-100 mb-10 max-w-4xl mx-auto leading-relaxed">
            {t('home.cta.subtitle')}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            {t('home.cta.button')} →
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Pricing Section 
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                  $7.99
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
          </div>
        </div>
      </div>
      */}
      
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
          <div className="text-center mb-8">
            <img src="/logo.png" alt="PastorAgenda" className="h-12 w-auto mx-auto mb-4" />
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {t('home.footer.description')}
            </p>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4 sm:mb-0">
                <p className="text-gray-400">
                  {t('home.footer.copyright')} v. {packageJson.version}
                </p>
                <div className="flex items-center space-x-4">
                  <a 
                    href="/support" 
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {t('home.footer.support')}
                  </a>
                  <a 
                    href="https://docs.google.com/document/d/1SP93ZdXu9PSc2yrrLJuSJBRKpHNjyXW2lc5kSYN2mOI/edit?usp=sharing" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {t('home.footer.privacyPolicy')}
                  </a>
                </div>
              </div>
              <LanguageSwitcher dropdownPosition="above" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
