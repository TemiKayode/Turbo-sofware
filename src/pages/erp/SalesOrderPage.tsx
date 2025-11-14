import { useState } from 'react'
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
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'

interface SalesOrder {
  id: string
  order_no: string
  customer_id: string
  order_date: string
  expected_delivery_date: string | null
  status: string
  total_amount: number
  customers?: { customer_name: string }
}

export function SalesOrderPage() {
  const { companyId } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
  })

  const { data: orders = [], isLoading, refetch } = useSupabaseQuery<SalesOrder>(
    ['sales_orders', companyId!],
    'sales_orders',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, customers(customer_name)')
          .order('order_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: customers = [] } = useSupabaseQuery<any>(
    ['customers', companyId!],
    'customers',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const { data: order, error } = await supabase
        .from('sales_orders')
        .insert({
          company_id: companyId,
          order_no: `SO-${Date.now()}`,
          customer_id: formData.customer_id,
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          notes: formData.notes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      toast('Sales order created successfully', 'success')
      setShowCreate(false)
      setSelectedOrder(order)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to create order', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'approved':
        return 'default'
      case 'partially_delivered':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const columns = [
    { header: 'Order No', accessor: 'order_no' as keyof SalesOrder },
    {
      header: 'Customer',
      accessor: (row: SalesOrder) => row.customers?.customer_name || 'N/A',
    },
    {
      header: 'Date',
      accessor: (row: SalesOrder) => format(new Date(row.order_date), 'MMM dd, yyyy'),
    },
    {
      header: 'Total Amount',
      accessor: (row: SalesOrder) => `$${row.total_amount.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (row: SalesOrder) => (
        <Badge variant={getStatusColor(row.status) as any}>{row.status}</Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Orders</h1>
        <Button onClick={() => setShowCreate(true)}>Create Sales Order</Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Sales Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order_date">Order Date *</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
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

      <DataTable
        data={orders}
        columns={columns}
        searchable
        searchPlaceholder="Search orders..."
        loading={isLoading}
        onRowClick={(row) => setSelectedOrder(row)}
      />
    </div>
  )
}
