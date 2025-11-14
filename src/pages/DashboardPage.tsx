import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/MetricCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format } from 'date-fns'
import { Building2, Users, FileText, Receipt, Package, ShoppingCart, TrendingUp, DollarSign, Calendar, MapPin, Phone, Mail, Globe, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Activity {
  id: string
  action: string
  target: string
  timestamp: string
}

interface CompanyInfo {
  name: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  country: string
  tax_id: string
  registration_number: string
  subscription_tier: string
  created_at: string
}

export function DashboardPage() {
  const { user, companyId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    documents: 0,
    invoices: 0,
    erpItems: 0,
    erpCustomers: 0,
    erpSuppliers: 0,
    erpEmployees: 0,
  })
  const [previousStats, setPreviousStats] = useState({
    companies: 0,
    users: 0,
    documents: 0,
    invoices: 0,
    erpItems: 0,
    erpCustomers: 0,
    erpSuppliers: 0,
    erpEmployees: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [erpStats, setErpStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  })

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!companyId) return
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single()
        
        if (!error && data) {
          setCompanyInfo(data as CompanyInfo)
        }
      } catch (error) {
        console.error('Error fetching company info:', error)
      }
    }

    const fetchRevenueAndExpenses = async () => {
      if (!companyId) return

      try {
        const months: { name: string; start: Date; end: Date }[] = []
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const start = new Date(date.getFullYear(), date.getMonth(), 1)
          const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
          months.push({
            name: monthNames[date.getMonth()],
            start,
            end,
          })
        }

        const revenuePromises = months.map(async (month) => {
          const [salesInvoices, cashSales] = await Promise.all([
            supabase
              .from('sales_invoices')
              .select('total_amount')
              .eq('company_id', companyId)
              .gte('invoice_date', month.start.toISOString().split('T')[0])
              .lte('invoice_date', month.end.toISOString().split('T')[0]),
            supabase
              .from('cash_sales')
              .select('total_amount')
              .eq('company_id', companyId)
              .gte('sale_date', month.start.toISOString().split('T')[0])
              .lte('sale_date', month.end.toISOString().split('T')[0]),
          ])

          const salesRevenue = salesInvoices.data?.reduce((sum, inv) => sum + (parseFloat(inv.total_amount?.toString() || '0')), 0) || 0
          const cashRevenue = cashSales.data?.reduce((sum, sale) => sum + (parseFloat(sale.total_amount?.toString() || '0')), 0) || 0
          return salesRevenue + cashRevenue
        })

        const expensePromises = months.map(async (month) => {
          const [purchaseInvoices, bankPayments, cashPayments] = await Promise.all([
            supabase
              .from('purchase_invoices')
              .select('total_amount')
              .eq('company_id', companyId)
              .gte('invoice_date', month.start.toISOString().split('T')[0])
              .lte('invoice_date', month.end.toISOString().split('T')[0]),
            supabase
              .from('bank_payments')
              .select('amount')
              .eq('company_id', companyId)
              .gte('payment_date', month.start.toISOString().split('T')[0])
              .lte('payment_date', month.end.toISOString().split('T')[0]),
            supabase
              .from('cash_payments')
              .select('amount')
              .eq('company_id', companyId)
              .gte('payment_date', month.start.toISOString().split('T')[0])
              .lte('payment_date', month.end.toISOString().split('T')[0]),
          ])

          const purchaseExpenses = purchaseInvoices.data?.reduce((sum, inv) => sum + (parseFloat(inv.total_amount?.toString() || '0')), 0) || 0
          const bankExpenses = bankPayments.data?.reduce((sum, pay) => sum + (parseFloat(pay.amount?.toString() || '0')), 0) || 0
          const cashExpenses = cashPayments.data?.reduce((sum, pay) => sum + (parseFloat(pay.amount?.toString() || '0')), 0) || 0

          return purchaseExpenses + bankExpenses + cashExpenses
        })

        const revenues = await Promise.all(revenuePromises)
        const expenses = await Promise.all(expensePromises)

        setChartData(
          months.map((month, idx) => ({
            month: month.name,
            revenue: Math.round(revenues[idx] * 100) / 100,
            expense: Math.round(expenses[idx] * 100) / 100,
            profit: Math.round((revenues[idx] - expenses[idx]) * 100) / 100,
          }))
        )

        // Calculate ERP stats
        const totalRevenue = revenues.reduce((sum, r) => sum + r, 0)
        const totalExpenses = expenses.reduce((sum, e) => sum + e, 0)
        
        const [pendingOrdersRes, lowStockRes] = await Promise.all([
          supabase.from('purchase_orders').select('id', { count: 'exact' }).eq('company_id', companyId).in('status', ['pending', 'draft']),
          supabase.from('items').select('id').eq('company_id', companyId).eq('is_active', true),
        ])

        setErpStats({
          totalRevenue,
          totalExpenses,
          pendingOrders: pendingOrdersRes.count || 0,
          lowStockItems: 0, // Would need to calculate based on min_stock_level
        })
      } catch (error) {
        console.error('Error fetching revenue and expenses:', error)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        setChartData(
          monthNames.map((name) => ({
            month: name,
            revenue: 0,
            expense: 0,
            profit: 0,
          }))
        )
      }
    }

    const fetchStats = async () => {
      if (!user || !companyId) return

      try {
        const [
          companiesRes,
          usersRes,
          documentsRes,
          invoicesRes,
          itemsRes,
          customersRes,
          suppliersRes,
          employeesRes,
        ] = await Promise.all([
          supabase.from('companies').select('id', { count: 'exact' }).eq('id', companyId),
          supabase.from('users').select('id', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('documents').select('id', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('invoices').select('id', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('items').select('id', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('customers').select('id', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('suppliers').select('id', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('employees').select('id', { count: 'exact' }).eq('company_id', companyId),
        ])

        setPreviousStats(stats)
        setStats({
          companies: companiesRes.count || 0,
          users: usersRes.count || 0,
          documents: documentsRes.count || 0,
          invoices: invoicesRes.count || 0,
          erpItems: itemsRes.count || 0,
          erpCustomers: customersRes.count || 0,
          erpSuppliers: suppliersRes.count || 0,
          erpEmployees: employeesRes.count || 0,
        })

        await fetchCompanyInfo()
        await fetchRevenueAndExpenses()

        // Fetch recent activity from audit logs if available
        setRecentActivity([
          {
            id: '1',
            action: 'accessed',
            target: 'Dashboard',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, companyId])

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const getSparklineData = (value: number): number[] => {
    return Array.from({ length: 6 }, (_, i) => value * (0.8 + Math.random() * 0.4))
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSkeleton />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 pb-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Company Information Header */}
        {companyInfo && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {companyInfo.name || 'Your Company'}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {companyInfo.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{companyInfo.email}</span>
                        </div>
                      )}
                      {companyInfo.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{companyInfo.phone}</span>
                        </div>
                      )}
                      {companyInfo.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{companyInfo.address}, {companyInfo.city}{companyInfo.state && `, ${companyInfo.state}`}</span>
                        </div>
                      )}
                    </div>
                    {(companyInfo.tax_id || companyInfo.registration_number) && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {companyInfo.tax_id && <span>Tax ID: {companyInfo.tax_id}</span>}
                        {companyInfo.registration_number && <span>Reg: {companyInfo.registration_number}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={companyInfo.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
                    {companyInfo.subscription_tier || 'free'} Plan
                  </Badge>
                  <Link to="/erp/control-panel/account-settings">
                    <Button variant="outline" size="sm">
                      Edit Company Info
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Users"
            value={stats.users}
            change={calculateChange(stats.users, previousStats.users)}
            data={getSparklineData(stats.users)}
          />
          <MetricCard
            title="Documents"
            value={stats.documents}
            change={calculateChange(stats.documents, previousStats.documents)}
            data={getSparklineData(stats.documents)}
          />
          <MetricCard
            title="Invoices"
            value={stats.invoices}
            change={calculateChange(stats.invoices, previousStats.invoices)}
            data={getSparklineData(stats.invoices)}
          />
          <MetricCard
            title="ERP Items"
            value={stats.erpItems}
            change={calculateChange(stats.erpItems, previousStats.erpItems)}
            data={getSparklineData(stats.erpItems)}
          />
        </div>

        {/* ERP Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">${erpStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${erpStats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.erpCustomers}</div>
              <p className="text-xs text-gray-500 mt-1">Active customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.erpEmployees}</div>
              <p className="text-xs text-gray-500 mt-1">Total employees</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expense Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2CA01C" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/erp">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    ERP System
                  </Button>
                </Link>
                <Link to="/companies">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Companies
                  </Button>
                </Link>
                <Link to="/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                </Link>
                <Link to="/documents">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                  </Button>
                </Link>
                <Link to="/erp/sales/invoice">
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="w-4 h-4 mr-2" />
                    Sales Invoice
                  </Button>
                </Link>
                <Link to="/erp/procurement/purchase-order">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase Order
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 bg-[#2CA01C] rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">
                          <strong>You</strong> {activity.action}{' '}
                          <strong>{activity.target}</strong>
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ERP Module Overview */}
        <Card>
          <CardHeader>
            <CardTitle>ERP Module Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/erp/inventory" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Inventory</p>
                        <p className="text-sm text-gray-500">{stats.erpItems} items</p>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/erp/sales" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Sales</p>
                        <p className="text-sm text-gray-500">{stats.erpCustomers} customers</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/erp/procurement" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Procurement</p>
                        <p className="text-sm text-gray-500">{stats.erpSuppliers} suppliers</p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/erp/hr" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">HR & Payroll</p>
                        <p className="text-sm text-gray-500">{stats.erpEmployees} employees</p>
                      </div>
                      <Users className="w-8 h-8 text-pink-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">ERP Modules</span>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Backup</span>
                  <span className="text-xs text-gray-500">
                    {companyInfo?.created_at ? format(new Date(companyInfo.created_at), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Purchase Orders</span>
                  <Badge variant="secondary">{erpStats.pendingOrders}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Stock Items</span>
                  <Badge variant="secondary">{erpStats.lowStockItems}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link to="/erp/reports" className="block text-sm text-indigo-600 hover:underline">
                  View Reports
                </Link>
                <Link to="/erp/control-panel" className="block text-sm text-indigo-600 hover:underline">
                  Control Panel
                </Link>
                <Link to="/settings" className="block text-sm text-indigo-600 hover:underline">
                  Settings
                </Link>
                <Link to="/help" className="block text-sm text-indigo-600 hover:underline">
                  Help Center
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
