import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import './i18n'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

// Component to redirect authenticated users away from auth page
function AuthPageWrapper() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <AuthPage />
}
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import EventTypesPage from './pages/EventTypesPage'
import BookingsPage from './pages/BookingsPage'
import PublicProfilePage from './pages/PublicProfilePage'
import EventBookingPage from './pages/EventBookingPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import BookingSuccessPage from './pages/BookingSuccessPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPageWrapper />} />
            <Route path="/:alias" element={<PublicProfilePage />} />
            <Route path="/:alias/:eventTypeId" element={<EventBookingPage />} />
            <Route path="/:alias/:eventTypeId/confirmation" element={<BookingConfirmationPage />} />
            <Route path="/:alias/:eventTypeId/success" element={<BookingSuccessPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ProfileSettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/event-types" element={
              <ProtectedRoute>
                <Layout>
                  <EventTypesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/bookings" element={
              <ProtectedRoute>
                <Layout>
                  <BookingsPage />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        <Toaster position="top-right" />
        <PWAInstallPrompt />
      </Router>
        </AuthProvider>
      </ThemeProvider>
  )
}

export default App
