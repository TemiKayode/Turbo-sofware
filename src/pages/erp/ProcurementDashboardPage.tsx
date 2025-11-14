import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Package, DollarSign, TrendingUp, FileText, Truck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ProcurementDashboardPage() {
  const { companyId } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalValue: 0,
    suppliers: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchStats()
    }
  }, [companyId])

  const fetchStats = async () => {
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        supabase.from('purchase_orders').select('id, total_amount, status', { count: 'exact' }).eq('company_id', companyId!),
        supabase.from('suppliers').select('id', { count: 'exact' }).eq('company_id', companyId!),
      ])

      const orders = ordersRes.data || []
      const totalOrders = ordersRes.count || 0
      const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'draft').length
      const totalValue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount?.toString() || '0'), 0)
      const suppliers = suppliersRes.count || 0

      setStats({ totalOrders, pendingOrders, totalValue, suppliers })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            Procurement Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage purchases, suppliers, and procurement operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.totalOrders}</div>
            <p className="text-sm text-muted-foreground mt-1">All purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingOrders}</div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${stats.totalValue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">Purchase value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.suppliers}</div>
            <p className="text-sm text-muted-foreground mt-1">Active suppliers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/procurement/suppliers">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Manage Suppliers
              </Button>
            </Link>
            <Link to="/erp/procurement/purchase-order">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Create Purchase Order
              </Button>
            </Link>
            <Link to="/erp/procurement/purchase-requisition">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Purchase Requisition
              </Button>
            </Link>
            <Link to="/erp/procurement/grn">
              <Button variant="outline" className="w-full justify-start">
                <Truck className="w-4 h-4 mr-2" />
                Goods Receipt
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
                Recent purchase orders will appear here
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
