import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Search, ChevronRight, User, Moon, Sun, HelpCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/companies': 'Companies',
  '/users': 'Users',
  '/documents': 'Documents',
  '/subscription': 'Subscription',
  '/invoices': 'Invoices',
  '/settings': 'Settings',
  '/data-breach': 'Data Breach',
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference
    const isDark = localStorage.getItem('theme') === 'dark'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x)
    const breadcrumbs = []

    // Always start with Dashboard (unless we're on the root)
    if (location.pathname !== '/') {
      breadcrumbs.push({ label: 'Dashboard', path: '/dashboard' })
    }

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathnames.forEach((pathname) => {
      currentPath += `/${pathname}`
      // Skip if this is the dashboard path (already added)
      if (currentPath !== '/dashboard') {
        const label = breadcrumbMap[currentPath] || pathname.charAt(0).toUpperCase() + pathname.slice(1)
        breadcrumbs.push({ label, path: currentPath })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()
  const userInitials = user?.email
    ?.split('@')[0]
    .substring(0, 2)
    .toUpperCase() || 'U'

  return (
    <header className="ml-0 lg:ml-64 border-b border-gray-200 bg-white dark:bg-gray-900 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.path}-${index}`} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900 dark:text-white font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-[#2CA01C] transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-[#2CA01C] focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-[#2CA01C] text-white text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300">
                {user?.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleDarkMode}>
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/help')}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Help Center
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

