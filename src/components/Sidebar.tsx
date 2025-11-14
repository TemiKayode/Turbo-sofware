import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Package,
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Companies', icon: Building2, href: '/companies' },
  { label: 'Users', icon: Users, href: '/users' },
  { label: 'Documents', icon: FileText, href: '/documents' },
  { label: 'Subscription', icon: DollarSign, href: '/subscription' },
  { label: 'Invoices', icon: Receipt, href: '/invoices' },
  { label: 'ERP System', icon: Package, href: '/erp' },
  { label: 'Data Breach', icon: Shield, href: '/data-breach', adminOnly: true },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, signOut, userRole } = useAuth()

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  )

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300',
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#2CA01C] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">TS</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Turbo</h1>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-[#2CA01C] rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xs">TS</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              // Check if active - for ERP, check if path starts with /erp
              const isActive = item.href === '/erp' 
                ? location.pathname.startsWith('/erp')
                : location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#2CA01C]/10 text-[#2CA01C] font-medium'
                      : 'text-gray-700 hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className={clsx(
              'flex items-center gap-3 text-red-600 hover:bg-red-50 w-full px-3 py-2 rounded-lg transition-colors',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  )
}

