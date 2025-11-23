import { Navigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import { Spinner } from './LoadingSkeleton'
import { Card, CardContent } from './ui/card'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user' | 'viewer'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const context = useContext(AuthContext)
  
  // If context is undefined, show loading (during React refresh)
  if (context === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading authentication">
        <Spinner size="lg" />
      </div>
    )
  }
  
  const { user, loading, userRole } = context

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading authentication">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    // Save the attempted location to redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      user: 2,
      admin: 3,
    }

    const userRoleLevel = userRole ? roleHierarchy[userRole] : 0
    const requiredRoleLevel = roleHierarchy[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Access Denied
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have permission to access this page. This page requires {requiredRole} role or higher.
                </p>
                <Navigate to="/dashboard" replace />
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}


