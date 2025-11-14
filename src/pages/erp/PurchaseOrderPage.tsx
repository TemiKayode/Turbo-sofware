import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'

interface PurchaseOrder {
  id: string
  po_no: string
  supplier_id: string
  po_date: string
  expected_delivery_date: string | null
  status: string
  total_amount: number
  suppliers?: { supplier_name: string }
}

interface PurchaseOrderItem {
  id: string
  po_id: string
  item_id: string
  quantity: number
  unit_price: number
  total_amount: number
  items?: { item_name: string; part_no: string }
}

export function PurchaseOrderPage() {
  const { companyId } = useAuth()
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    supplier_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    location_id: '',
    notes: '',
  })

  const { data: purchaseOrders = [], isLoading, refetch } = useSupabaseQuery<PurchaseOrder>(
    ['purchase_orders', companyId!],
    'purchase_orders',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, suppliers(supplier_name)')
          .order('po_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: suppliers = [] } = useSupabaseQuery<any>(
    ['suppliers', companyId!],
    'suppliers',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { data: items = [] } = useSupabaseQuery<any>(
    ['items', companyId!],
    'items',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { data: poItems = [], refetch: refetchItems } = useSupabaseQuery<PurchaseOrderItem>(
    ['purchase_order_items', selectedPO?.id || ''],
    'purchase_order_items',
    {
      filters: (query) =>
        query
          .eq('po_id', selectedPO?.id || '')
          .select('*, items(item_name, part_no)')
          .order('created_at'),
      enabled: !!selectedPO?.id,
    }
  )

  const mutation = useSupabaseMutation<PurchaseOrder>('purchase_orders', [
    ['purchase_orders', companyId!],
  ])

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const { data: po, error } = await supabase
        .from('purchase_orders')
        .insert({
          company_id: companyId,
          po_no: `PO-${Date.now()}`,
          supplier_id: formData.supplier_id,
          po_date: formData.po_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          location_id: formData.location_id || null,
          notes: formData.notes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      toast('Purchase Order created successfully', 'success')
      setShowCreate(false)
      setSelectedPO(po)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to create purchase order', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'approved':
        return 'default'
      case 'partially_received':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const columns = [
    { header: 'PO No', accessor: 'po_no' as keyof PurchaseOrder },
    {
      header: 'Supplier',
      accessor: (row: PurchaseOrder) => row.suppliers?.supplier_name || 'N/A',
    },
    {
      header: 'Date',
      accessor: (row: PurchaseOrder) => format(new Date(row.po_date), 'MMM dd, yyyy'),
    },
    {
      header: 'Total Amount',
      accessor: (row: PurchaseOrder) => `$${row.total_amount.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (row: PurchaseOrder) => (
        <Badge variant={getStatusColor(row.status) as any}>{row.status}</Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button onClick={() => setShowCreate(true)}>Create Purchase Order</Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Purchase Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_id">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="po_date">PO Date *</Label>
                  <Input
                    id="po_date"
                    type="date"
                    value={formData.po_date}
                    onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                  <Input
                    id="expected_delivery_date"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <DataTable
            data={purchaseOrders}
            columns={columns}
            searchable
            searchPlaceholder="Search purchase orders..."
            loading={isLoading}
            onRowClick={(row) => setSelectedPO(row)}
          />
        </div>

        {selectedPO && (
          <Card>
            <CardHeader>
              <CardTitle>PO Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">PO No:</span> {selectedPO.po_no}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{' '}
                  {format(new Date(selectedPO.po_date), 'PP')}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant={getStatusColor(selectedPO.status) as any}>
                    {selectedPO.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Total:</span> ${selectedPO.total_amount.toFixed(2)}
                </div>
              </div>

              {poItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="space-y-1">
                    {poItems.map((item) => (
                      <div key={item.id} className="text-sm border-b pb-1">
                        {item.items?.item_name} - Qty: {item.quantity} @ ${item.unit_price.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
