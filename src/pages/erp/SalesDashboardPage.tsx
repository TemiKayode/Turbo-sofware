import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, ShoppingBag, FileText, Receipt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function SalesDashboardPage() {
  const { companyId } = useAuth()
  const [stats, setStats] = useState({
    totalSales: 0,
    thisMonth: 0,
    customers: 0,
    pendingOrders: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchStats()
    }
  }, [companyId])

  const fetchStats = async () => {
    try {
      const [salesRes, customersRes, ordersRes] = await Promise.all([
        supabase.from('sales_invoices').select('total_amount, invoice_date').eq('company_id', companyId!),
        supabase.from('customers').select('id', { count: 'exact' }).eq('company_id', companyId!),
        supabase.from('sales_orders').select('id', { count: 'exact' }).eq('company_id', companyId!).eq('status', 'pending'),
      ])

      const sales = salesRes.data || []
      const totalSales = sales.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount?.toString() || '0'), 0)
      const thisMonth = new Date().getMonth()
      const thisMonthSales = sales
        .filter((s: any) => new Date(s.invoice_date).getMonth() === thisMonth)
        .reduce((sum: number, s: any) => sum + parseFloat(s.total_amount?.toString() || '0'), 0)
      const customers = customersRes.count || 0
      const pendingOrders = ordersRes.count || 0

      setStats({ totalSales, thisMonth: thisMonthSales, customers, pendingOrders })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            Sales Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track sales performance, customers, and revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">${stats.totalSales.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">All time revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${stats.thisMonth.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">Current month sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.customers}</div>
            <p className="text-sm text-muted-foreground mt-1">Active customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingOrders}</div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting fulfillment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/sales/customers">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Customers
              </Button>
            </Link>
            <Link to="/erp/sales/invoice">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
            <Link to="/erp/sales/cash-sales">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Cash Sales
              </Button>
            </Link>
            <Link to="/erp/sales/quotation">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Create Quotation
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                Recent sales transactions will appear here
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
