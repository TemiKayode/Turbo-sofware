import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/components/QueryProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CommandPalette } from '@/components/CommandPalette'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { UsersPage } from '@/pages/UsersPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'
import { InvoicesPage } from '@/pages/InvoicesPage'
import { DataBreachDashboardPage } from '@/pages/DataBreachDashboardPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { HelpCenterPage } from '@/pages/HelpCenterPage'
import ERPApp from '@/pages/ERPApp'

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/data-breach"
            element={
              <ProtectedRoute requiredRole="admin">
                <DataBreachDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpCenterPage />
              </ProtectedRoute>
            }
          />
          {/* ERP Routes */}
          <Route path="/erp/*" element={<ERPApp />} />
        </Routes>
        <Toaster />
        <CommandPalette />
      </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App


