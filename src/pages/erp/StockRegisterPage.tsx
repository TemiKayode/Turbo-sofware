import { useState, useMemo, useEffect } from 'react'
import { Search, Download, Package, Calendar, Warehouse, ArrowUpDown, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface StockItem {
  id: string
  itemCode: string
  itemName: string
  category: string
  brand: string
  unit: string
  warehouse: string
  currentQty: number
  avgCost: number
  totalValue: number
  lastUpdated: Date
}

export function StockRegisterPage() {
  const { companyId } = useAuth()
  const [search, setSearch] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [sortBy, setSortBy] = useState<'qty' | 'value'>('value')

  const { data: items = [] } = useSupabaseQuery<any>(
    ['items', companyId!],
    'items',
    {
      filters: (query) => query.eq('company_id', companyId!).order('part_no'),
      enabled: !!companyId,
    }
  )

  const { data: categories = [] } = useSupabaseQuery<any>(
    ['item_categories', companyId!],
    'item_categories',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const { data: brands = [] } = useSupabaseQuery<any>(
    ['brands', companyId!],
    'brands',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const { data: stockData = [] } = useSupabaseQuery<any>(
    ['stock_register', companyId!],
    'stock_register',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const stockItems: StockItem[] = useMemo(() => {
    return items.map((item: any) => {
      const category = categories.find((cat: any) => cat.id === item.category_id)
      const brand = brands.find((b: any) => b.id === item.brand_id)
      const stock = stockData.find((s: any) => s.item_id === item.id)
      
      return {
        id: item.id,
        itemCode: item.part_no,
        itemName: item.item_name,
        category: category?.name || 'N/A',
        brand: brand?.name || 'N/A',
        unit: 'Nos',
        warehouse: 'Main Warehouse',
        currentQty: parseFloat(stock?.quantity || '0'),
        avgCost: parseFloat(item.average_cost?.toString() || '0'),
        totalValue: parseFloat(stock?.quantity || '0') * parseFloat(item.average_cost?.toString() || '0'),
        lastUpdated: new Date(item.updated_at || item.created_at),
      }
    })
  }, [items, categories, brands, stockData])

  const filteredAndSorted = useMemo(() => {
    let filtered = stockItems

    if (search) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.includes(search)
      )
    }

    if (filterWarehouse !== 'all') {
      filtered = filtered.filter(item => item.warehouse === filterWarehouse)
    }

    return filtered.sort((a, b) =>
      sortBy === 'value' ? b.totalValue - a.totalValue : b.currentQty - a.currentQty
    )
  }, [stockItems, search, filterWarehouse, sortBy])

  const totalStockValue = filteredAndSorted.reduce((sum, item) => sum + item.totalValue, 0)
  const totalItems = filteredAndSorted.length

  const handleExport = () => {
    const csv = [
      ['Item Code', 'Item Name', 'Category', 'Warehouse', 'Qty', 'Avg Cost', 'Total Value'].join(','),
      ...filteredAndSorted.map(item =>
        [item.itemCode, item.itemName, item.category, item.warehouse, item.currentQty, item.avgCost, item.totalValue].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-register-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="w-8 h-8 text-indigo-600" />
          Stock Register
        </h1>
        <p className="text-gray-600 mt-1">Real-time inventory valuation and stock levels across all warehouses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100">Total Items</p>
                <p className="text-3xl font-bold mt-1">{totalItems}</p>
              </div>
              <Package className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Stock Value</p>
                <p className="text-3xl font-bold mt-1">${totalStockValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100">Last Updated</p>
                <p className="text-lg font-semibold mt-1">{format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
              <Calendar className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by item name or code..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
            >
              <option value="all">All Warehouses</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Secondary">Secondary</option>
            </select>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Warehouse</th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortBy(sortBy === 'qty' ? 'value' : 'qty')}
                  >
                    <div className="flex items-center gap-1">
                      Qty <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Cost</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No stock items found
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-indigo-600">{item.itemCode}</td>
                      <td className="px-6 py-4">{item.itemName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                          <Warehouse className="w-3 h-3" />
                          {item.warehouse}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{item.currentQty}</td>
                      <td className="px-6 py-4">${item.avgCost.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-indigo-600">${item.totalValue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
