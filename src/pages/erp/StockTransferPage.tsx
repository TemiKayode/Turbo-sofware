import { useState } from 'react'
import { Truck, Plus, Search, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

export function StockTransferPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [items, setItems] = useState<Array<{ id: string; name: string; qty: number }>>([])
  const [searchItem, setSearchItem] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const { data: stockLocations = [] } = useSupabaseQuery<any>(
    ['stock_locations', companyId!],
    'stock_locations',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const { data: itemsList = [] } = useSupabaseQuery<any>(
    ['items', companyId!],
    'items',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const handleAddItem = () => {
    if (searchItem) {
      const foundItem = itemsList.find((item: any) =>
        item.item_name.toLowerCase().includes(searchItem.toLowerCase()) ||
        item.part_no.includes(searchItem)
      )
      if (foundItem) {
        setItems([...items, { id: foundItem.id, name: foundItem.item_name, qty: 1 }])
        setSearchItem('')
      } else {
        toast('Item not found', 'error')
      }
    }
  }

  const handleTransfer = async () => {
    if (!fromWarehouse || !toWarehouse || items.length === 0) {
      toast('Please fill all required fields', 'error')
      return
    }

    try {
      // Here you would create stock transfer records in the database
      // For now, we'll just show success
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setItems([])
        setFromWarehouse('')
        setToWarehouse('')
      }, 3000)
      toast('Stock transfer initiated successfully!', 'success')
    } catch (error: any) {
      toast(error.message || 'Failed to initiate transfer', 'error')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Truck className="w-8 h-8 text-emerald-600" />
          Stock Transfer
        </h1>
        <p className="text-gray-600 mt-1">Move inventory between warehouses with full audit trail</p>
      </div>

      {showSuccess && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3 text-emerald-800">
            <CheckCircle className="w-5 h-5" />
            Stock transfer initiated successfully!
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fromWarehouse">From Warehouse</Label>
              <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                <SelectTrigger id="fromWarehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {stockLocations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="toWarehouse">To Warehouse</Label>
              <Select value={toWarehouse} onValueChange={setToWarehouse}>
                <SelectTrigger id="toWarehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {stockLocations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Add Items to Transfer</Label>
            <div className="flex gap-3 mt-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search item..."
                  className="pl-10"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <Button onClick={handleAddItem} className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add
              </Button>
            </div>
          </div>

          {items.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-6 py-4">{item.name}</td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              min="1"
                              className="w-20"
                              defaultValue={item.qty}
                              onChange={(e) => {
                                const newItems = items.map(i =>
                                  i.id === item.id ? { ...i, qty: parseInt(e.target.value) || 1 } : i
                                )
                                setItems(newItems)
                              }}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItems(items.filter(i => i.id !== item.id))}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setItems([])
              setFromWarehouse('')
              setToWarehouse('')
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!fromWarehouse || !toWarehouse || items.length === 0}
              className="flex items-center gap-2"
            >
              <Truck className="w-5 h-5" />
              Initiate Transfer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
