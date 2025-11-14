import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function InventoryDashboardPage() {
  const { companyId } = useAuth()
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalStockValue: 0,
    pendingTransfers: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchStats()
    }
  }, [companyId])

  const fetchStats = async () => {
    try {
      const [itemsRes, stockRes] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact' }).eq('company_id', companyId!),
        supabase.from('stock_register').select('quantity, unit_cost').eq('company_id', companyId!),
      ])

      const totalItems = itemsRes.count || 0
      const stockValue = (stockRes.data || []).reduce(
        (sum, s) => sum + (parseFloat(s.quantity) * parseFloat(s.unit_cost)),
        0
      )

      setStats({
        totalItems,
        lowStockItems: 0, // Calculate based on min_stock_level
        totalStockValue: stockValue,
        pendingTransfers: 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalStockValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransfers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/inventory/items">
              <Button variant="outline" className="w-full justify-start">Items Master</Button>
            </Link>
            <Link to="/erp/inventory/stock-register">
              <Button variant="outline" className="w-full justify-start">Stock Register</Button>
            </Link>
            <Link to="/erp/inventory/stock-transfer">
              <Button variant="outline" className="w-full justify-start">Stock Transfer</Button>
            </Link>
            <Link to="/erp/inventory/stock-adjustment">
              <Button variant="outline" className="w-full justify-start">Stock Adjustment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


