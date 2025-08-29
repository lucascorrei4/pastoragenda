import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

function AuthPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.png" alt="PastorAgenda" className="h-16 w-auto mx-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {t('auth.signIn.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.signIn.noAccount')}{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.signIn.signUp')}
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0ea5e9',
                    brandAccent: '#0284c7',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin + '/dashboard'}
            showLinks={false}
            view="sign_in"
          />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                                 <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('auth.signUp.hasAccount')}</span>
              </div>
            </div>

            <div className="mt-6">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#0ea5e9',
                        brandAccent: '#0284c7',
                      },
                    },
                  },
                }}
                providers={[]}
                redirectTo={window.location.origin + '/dashboard'}
                showLinks={false}
                view="sign_up"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {t('auth.terms')}{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.termsOfService')}
          </a>{' '}
          {t('common.and')}{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.privacyPolicy')}
          </a>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
