import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallPromptProps {
  showOnPublicPages?: boolean
}

export function PWAInstallPrompt({ showOnPublicPages = true }: PWAInstallPromptProps) {
  const location = useLocation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // Check if we're on a public page (pastor profile, booking pages)
  const isPublicPage = location.pathname !== '/' && 
                      !location.pathname.startsWith('/dashboard') && 
                      !location.pathname.startsWith('/auth') &&
                      location.pathname !== '/sitemap.xml'

  // Don't show prompt on public pages if showOnPublicPages is false
  if (isPublicPage && !showOnPublicPages) {
    return null
  }

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Don't show prompt if already installed
    if (standalone) return

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show the install prompt
      setShowPrompt(true)
    }

    // For iOS, show custom install instructions
    if (iOS && !standalone) {
      setShowPrompt(true)
    } else {
      // For other browsers, listen for beforeinstallprompt
      window.addEventListener('beforeinstallprompt', handler)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we can't programmatically install, so we just dismiss
      setShowPrompt(false)
      return
    }

    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {isIOS ? <Share className="h-6 w-6 text-primary-600" /> : <Download className="h-6 w-6 text-primary-600" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {isIOS ? 'Add to Home Screen' : 'Install PastorAgenda'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isIOS 
                ? 'Tap the share button and select "Add to Home Screen"'
                : 'Get the best experience by installing our app'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
