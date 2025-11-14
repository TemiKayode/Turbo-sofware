import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'

interface Item {
  id: string
  part_no: string
  item_name: string
  barcode: string | null
  category_id: string | null
  brand_id: string | null
  unit_id: string | null
  average_cost: number
  selling_price: number
  min_stock_level: number
  max_stock_level: number
  track_batch: boolean
  track_expiry: boolean
  is_active: boolean
  item_categories?: { name: string }
  brands?: { name: string }
  units?: { name: string }
}

export function ItemsPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    part_no: '',
    item_name: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    selling_price: '',
    min_stock_level: '',
    max_stock_level: '',
    track_batch: false,
    track_expiry: false,
  })

  const { data: items = [], isLoading, refetch } = useSupabaseQuery<Item>(
    ['items', companyId!],
    'items',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('part_no'),
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

  const { data: units = [] } = useSupabaseQuery<any>(
    ['units', companyId!],
    'units',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const mutation = useSupabaseMutation<Item>('items', [['items', companyId!]])

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        part_no: item.part_no,
        item_name: item.item_name,
        barcode: item.barcode || '',
        category_id: item.category_id || '',
        brand_id: item.brand_id || '',
        unit_id: item.unit_id || '',
        selling_price: item.selling_price.toString(),
        min_stock_level: item.min_stock_level.toString(),
        max_stock_level: item.max_stock_level.toString(),
        track_batch: item.track_batch,
        track_expiry: item.track_expiry,
      })
    } else {
      setEditingItem(null)
      setFormData({
        part_no: '',
        item_name: '',
        barcode: '',
        category_id: '',
        brand_id: '',
        unit_id: '',
        selling_price: '',
        min_stock_level: '',
        max_stock_level: '',
        track_batch: false,
        track_expiry: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const payload = {
        company_id: companyId,
        part_no: formData.part_no,
        item_name: formData.item_name,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        unit_id: formData.unit_id || null,
        selling_price: parseFloat(formData.selling_price) || 0,
        min_stock_level: parseFloat(formData.min_stock_level) || 0,
        max_stock_level: parseFloat(formData.max_stock_level) || 0,
        track_batch: formData.track_batch,
        track_expiry: formData.track_expiry,
      }

      if (editingItem) {
        await mutation.mutateAsync({
          type: 'update',
          id: editingItem.id,
          payload,
        })
        toast('Item updated successfully', 'success')
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
        toast('Item created successfully', 'success')
      }
      setDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to save item', 'error')
    }
  }

  const handleBarcodeScan = () => {
    toast('Barcode scanner activated. Point at barcode...', 'default')
  }

  // Enrich items with related data
  const enrichedItems = items.map((item) => {
    const category = categories.find((cat) => cat.id === item.category_id)
    const brand = brands.find((b) => b.id === item.brand_id)
    const unit = units.find((u) => u.id === item.unit_id)
    return {
      ...item,
      item_categories: category ? { name: category.name } : undefined,
      brands: brand ? { name: brand.name } : undefined,
      units: unit ? { name: unit.name } : undefined,
    }
  })

  const columns = [
    { header: 'Part No', accessor: 'part_no' as keyof Item },
    { header: 'Item Name', accessor: 'item_name' as keyof Item },
    { header: 'Barcode', accessor: 'barcode' as keyof Item },
    {
      header: 'Category',
      accessor: (row: Item) => row.item_categories?.name || 'N/A',
    },
    {
      header: 'Brand',
      accessor: (row: Item) => row.brands?.name || 'N/A',
    },
    {
      header: 'Selling Price',
      accessor: (row: Item) => `$${row.selling_price.toFixed(2)}`,
    },
    {
      header: 'Cost',
      accessor: (row: Item) => `$${row.average_cost.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (row: Item) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Items Master</h1>
        <div className="flex gap-2">
          <Button onClick={handleBarcodeScan} variant="outline">
            📷 Scan Barcode
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>Create Item</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update item information' : 'Add a new item to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="part_no">Part No *</Label>
                    <Input
                      id="part_no"
                      value={formData.part_no}
                      onChange={(e) => setFormData({ ...formData, part_no: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="item_name">Item Name *</Label>
                    <Input
                      id="item_name"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category_id">Category</Label>
                    <Select
                      value={formData.category_id || undefined}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="brand_id">Brand</Label>
                    <Select
                      value={formData.brand_id || undefined}
                      onValueChange={(value) => setFormData({ ...formData, brand_id: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit_id">Unit</Label>
                    <Select
                      value={formData.unit_id || undefined}
                      onValueChange={(value) => setFormData({ ...formData, unit_id: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="selling_price">Selling Price</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_stock_level">Min Stock Level</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stock_level">Max Stock Level</Label>
                    <Input
                      id="max_stock_level"
                      type="number"
                      value={formData.max_stock_level}
                      onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.track_batch}
                        onChange={(e) => setFormData({ ...formData, track_batch: e.target.checked })}
                        className="rounded"
                      />
                      Track Batch
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.track_expiry}
                        onChange={(e) => setFormData({ ...formData, track_expiry: e.target.checked })}
                        className="rounded"
                      />
                      Track Expiry
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        data={enrichedItems}
        columns={columns}
        searchable
        searchPlaceholder="Search items by part no, name, or barcode..."
        loading={isLoading}
        actions={(item) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
              Edit
            </Button>
          </div>
        )}
      />
    </div>
  )
}


