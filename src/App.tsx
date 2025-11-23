import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { QueryProvider } from '@/components/QueryProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CommandPalette } from '@/components/CommandPalette'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// Lazy load pages for better performance
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage').then(m => ({ default: m.CompaniesPage })))
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })))
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })))
const DataBreachDashboardPage = lazy(() => import('@/pages/DataBreachDashboardPage').then(m => ({ default: m.DataBreachDashboardPage })))
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })))
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })))
const ERPApp = lazy(() => import('@/pages/ERPApp'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSkeleton />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary>
                      <LandingPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <ErrorBoundary>
                      <LoginPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <ErrorBoundary>
                      <RegisterPage />
                    </ErrorBoundary>
                  } 
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <DashboardPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/companies"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CompaniesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <UsersPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <DocumentsPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <SubscriptionPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <InvoicesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/data-breach"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ErrorBoundary>
                        <DataBreachDashboardPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <SettingsPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <HelpCenterPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                {/* ERP Routes */}
                <Route 
                  path="/erp/*" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ERPApp />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Suspense>
            <Toaster />
            <CommandPalette />
          </BrowserRouter>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App


