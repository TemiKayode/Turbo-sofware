import { Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user' | 'viewer'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // Use useContext directly to avoid throwing error during React refresh
  const context = useContext(AuthContext)
  
  // If context is undefined, show loading (during React refresh)
  if (context === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  const { user, loading, userRole } = context

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
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
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}


