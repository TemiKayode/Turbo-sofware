import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, Users, FileText, Settings, TrendingUp, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ERPDashboardPage() {
  const modules = [
    {
      title: 'Inventory',
      description: 'Manage stock, items, and warehouse operations',
      icon: Package,
      href: '/erp/inventory',
      color: 'bg-blue-500',
    },
    {
      title: 'Procurement',
      description: 'Purchase orders, suppliers, and procurement',
      icon: ShoppingCart,
      href: '/erp/procurement',
      color: 'bg-green-500',
    },
    {
      title: 'Sales',
      description: 'Sales orders, customers, and invoicing',
      icon: TrendingUp,
      href: '/erp/sales',
      color: 'bg-purple-500',
    },
    {
      title: 'Financials',
      description: 'Accounting, ledgers, and financial reports',
      icon: DollarSign,
      href: '/erp/financials',
      color: 'bg-yellow-500',
    },
    {
      title: 'HR & Payroll',
      description: 'Employees, attendance, and payroll management',
      icon: Users,
      href: '/erp/hr',
      color: 'bg-pink-500',
    },
    {
      title: 'Reports',
      description: 'Comprehensive reporting and analytics',
      icon: FileText,
      href: '/erp/reports',
      color: 'bg-indigo-500',
    },
    {
      title: 'Control Panel',
      description: 'System settings and configuration',
      icon: Settings,
      href: '/erp/control-panel',
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ERP Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome to Turbo Software ERP System. Manage your business operations from here.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Main Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link
              key={module.href}
              to={module.href}
              className="block"
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`${module.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

