import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { clsx } from 'clsx'
import { useState } from 'react'

export function ERPLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/erp',
      children: []
    },
    {
      title: 'Inventory',
      icon: '📦',
      path: '/erp/inventory',
      children: [
        { title: 'Items', path: '/erp/inventory/items' },
        { title: 'Stock Register', path: '/erp/inventory/stock-register' },
        { title: 'Stock Transfer', path: '/erp/inventory/stock-transfer' },
        { title: 'Stock Adjustment', path: '/erp/inventory/stock-adjustment' },
      ]
    },
    {
      title: 'Procurement',
      icon: '🛒',
      path: '/erp/procurement',
      children: [
        { title: 'Suppliers', path: '/erp/procurement/suppliers' },
        { title: 'Purchase Requisition', path: '/erp/procurement/purchase-requisition' },
        { title: 'Purchase Quotation', path: '/erp/procurement/purchase-quotation' },
        { title: 'Purchase Order', path: '/erp/procurement/purchase-order' },
        { title: 'GRN', path: '/erp/procurement/grn' },
        { title: 'Purchase Invoice', path: '/erp/procurement/purchase-invoice' },
      ]
    },
    {
      title: 'Sales',
      icon: '💰',
      path: '/erp/sales',
      children: [
        { title: 'Customers', path: '/erp/sales/customers' },
        { title: 'Enquiry', path: '/erp/sales/enquiry' },
        { title: 'Quotation', path: '/erp/sales/quotation' },
        { title: 'Sales Order', path: '/erp/sales/order' },
        { title: 'Delivery Order', path: '/erp/sales/delivery' },
        { title: 'Sales Invoice', path: '/erp/sales/invoice' },
        { title: 'Cash Sales', path: '/erp/sales/cash-sales' },
        { title: 'Export Sales', path: '/erp/sales/export' },
      ]
    },
    {
      title: 'Financials',
      icon: '💳',
      path: '/erp/financials',
      children: [
        { title: 'Chart of Accounts', path: '/erp/financials/chart-of-accounts' },
        { title: 'Journal Voucher', path: '/erp/financials/journal-voucher' },
        { title: 'Bank Payment', path: '/erp/financials/bank-payment' },
        { title: 'Receipt', path: '/erp/financials/receipt' },
        { title: 'Bank Reconciliation', path: '/erp/financials/bank-reconciliation' },
        { title: 'Trial Balance', path: '/erp/financials/trial-balance' },
        { title: 'Balance Sheet', path: '/erp/financials/balance-sheet' },
        { title: 'Profit & Loss', path: '/erp/financials/profit-loss' },
      ]
    },
    {
      title: 'HR & Payroll',
      icon: '👥',
      path: '/erp/hr',
      children: [
        { title: 'Employees', path: '/erp/hr/employees' },
        { title: 'Attendance', path: '/erp/hr/attendance' },
        { title: 'Leave Requests', path: '/erp/hr/leave' },
        { title: 'Payroll', path: '/erp/hr/payroll' },
      ]
    },
    {
      title: 'Projects',
      icon: '📋',
      path: '/erp/projects',
      children: []
    },
    {
      title: 'Control Panel',
      icon: '⚙️',
      path: '/erp/control-panel',
      children: [
        { title: 'Branches', path: '/erp/control-panel/branches' },
        { title: 'Departments', path: '/erp/control-panel/departments' },
        { title: 'Users', path: '/erp/control-panel/users' },
        { title: 'Roles', path: '/erp/control-panel/roles' },
        { title: 'Settings', path: '/erp/control-panel/settings' },
      ]
    },
    {
      title: 'Reports',
      icon: '📈',
      path: '/erp/reports',
      children: []
    },
  ]

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={clsx(
        'bg-white border-r transition-all duration-300 overflow-y-auto',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">ERP System</h1>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? '←' : '→'}
            </Button>
          </div>
        </div>

        <nav className="p-2">
          {menuItems.map((item) => (
            <div key={item.path} className="mb-1">
              <Link
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
              
              {sidebarOpen && item.children.length > 0 && isActive(item.path) && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={clsx(
                        'block px-3 py-1.5 rounded text-sm transition-colors',
                        location.pathname === child.path
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              ← Back to Dashboard
            </Link>
            <h2 className="text-lg font-semibold">
              {menuItems.find(item => isActive(item.path))?.title || 'ERP System'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}



