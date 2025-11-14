import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Save, X } from 'lucide-react'
import { format } from 'date-fns'

interface OpeningStockEntry {
  id: string
  entry_no: string
  item_id: string
  location_id: string
  batch_no: string | null
  manufacture_date: string | null
  expiry_date: string | null
  quantity: number
  unit_cost: number
  total_cost: number
  entry_date: string
  is_posted: boolean
  items?: { part_no: string; item_name: string }
  stock_locations?: { location_name: string }
}

interface OpeningStockItem {
  id?: string
  item_id: string
  location_id: string
  batch_no: string
  manufacture_date: string
  expiry_date: string
  quantity: string
  unit_cost: string
  total_cost: string
  item?: { part_no: string; item_name: string }
}

export function OpeningStockPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [items, setItems] = useState<OpeningStockItem[]>([])
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const { data: stockEntries = [], isLoading, refetch } = useSupabaseQuery<OpeningStockEntry>(
    ['opening_stock_entries', companyId!],
    'opening_stock_entries',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, items(part_no, item_name), stock_locations(location_name)')
          .order('entry_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: allItems = [] } = useSupabaseQuery<any>(
    ['items', companyId!],
    'items',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('part_no'),
      enabled: !!companyId,
    }
  )

  const { data: locations = [] } = useSupabaseQuery<any>(
    ['stock_locations', companyId!],
    'stock_locations',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: createEntry } = useSupabaseMutation('opening_stock_entries', {
    onSuccess: () => {
      toast('Opening stock entry created successfully', 'success')
      setItems([])
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create opening stock entry', 'error')
    },
  })

  const addItem = () => {
    if (!selectedItem || !selectedLocation) {
      toast('Please select item and location', 'error')
      return
    }

    const item = allItems.find((i: any) => i.id === selectedItem)
    if (!item) return

    const newItem: OpeningStockItem = {
      item_id: selectedItem,
      location_id: selectedLocation,
      batch_no: '',
      manufacture_date: '',
      expiry_date: '',
      quantity: '0',
      unit_cost: '0',
      total_cost: '0',
      item: { part_no: item.part_no, item_name: item.item_name },
    }

    setItems([...items, newItem])
    setSelectedItem('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof OpeningStockItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_cost') {
      const qty = parseFloat(updated[index].quantity) || 0
      const cost = parseFloat(updated[index].unit_cost) || 0
      updated[index].total_cost = (qty * cost).toFixed(2)
    }
    
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user || items.length === 0) {
      toast('Please add at least one item', 'error')
      return
    }

    try {
      const entryNo = `OS-${Date.now()}`
      
      for (const item of items) {
        const payload = {
          company_id: companyId,
          entry_no: `${entryNo}-${item.item_id}`,
          item_id: item.item_id,
          location_id: item.location_id,
          batch_no: item.batch_no || null,
          manufacture_date: item.manufacture_date || null,
          expiry_date: item.expiry_date || null,
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
          total_cost: parseFloat(item.total_cost),
          entry_date: entryDate,
          is_posted: false,
          created_by: user.id,
        }

        createEntry({ data: payload, method: 'POST' })
      }
    } catch (error: any) {
      toast(error.message || 'Failed to save opening stock', 'error')
    }
  }

  const columns = [
    {
      accessorKey: 'entry_no',
      header: 'Entry No',
    },
    {
      accessorKey: 'items.part_no',
      header: 'Part No',
      cell: ({ row }: any) => row.original.items?.part_no || '-',
    },
    {
      accessorKey: 'items.item_name',
      header: 'Item Name',
      cell: ({ row }: any) => row.original.items?.item_name || '-',
    },
    {
      accessorKey: 'stock_locations.location_name',
      header: 'Location',
      cell: ({ row }: any) => row.original.stock_locations?.location_name || '-',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'unit_cost',
      header: 'Unit Cost',
      cell: ({ row }: any) => `$${row.original.unit_cost.toFixed(2)}`,
    },
    {
      accessorKey: 'total_cost',
      header: 'Total Cost',
      cell: ({ row }: any) => `$${row.original.total_cost.toFixed(2)}`,
    },
    {
      accessorKey: 'is_posted',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={row.original.is_posted ? 'text-green-600' : 'text-yellow-600'}>
          {row.original.is_posted ? 'Posted' : 'Pending'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Opening Stock Entry</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Opening Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entry Date *</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex gap-2 mb-4">
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {allItems.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.part_no} - {item.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addItem} className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                      <div className="col-span-3">
                        <Label className="text-xs">Item</Label>
                        <p className="text-sm font-medium">{item.item?.part_no} - {item.item?.item_name}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Batch No</Label>
                        <Input
                          value={item.batch_no}
                          onChange={(e) => updateItem(index, 'batch_no', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Quantity *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          required
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Unit Cost *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                          required
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Total Cost</Label>
                        <Input
                          value={item.total_cost}
                          readOnly
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Opening Stock
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opening Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={stockEntries} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

