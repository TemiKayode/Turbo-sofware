import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { useToast } from '@/components/ui/toaster'
import { DataTable } from '@/components/DataTable'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportTableToCSV } from '@/lib/exportUtils'
import { supabase } from '@/lib/supabase'

export function DeliveryOrderPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    do_no: '',
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    sales_order_id: '',
    location_id: '',
    delivery_address: '',
    notes: '',
  })

  const { data: orders = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['delivery_orders', companyId!],
    'delivery_orders',
    {
      filters: (query) => query.eq('company_id', companyId!).order('delivery_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: salesOrders = [] } = useSupabaseQuery<any>(
    ['sales_orders', companyId!],
    'sales_orders',
    {
      filters: (query) => query.eq('company_id', companyId!).order('order_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: locations = [] } = useSupabaseQuery<any>(
    ['stock_locations', companyId!],
    'stock_locations',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const { mutate: createOrder } = useSupabaseMutation('delivery_orders', {
    onSuccess: () => {
      toast('Delivery order created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create delivery order', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      do_no: '',
      delivery_date: format(new Date(), 'yyyy-MM-dd'),
      sales_order_id: '',
      location_id: '',
      delivery_address: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let doNumber = formData.do_no
      if (!doNumber) {
        const { count } = await supabase
          .from('delivery_orders')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        doNumber = `DO-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createOrder({
        type: 'insert',
        payload: {
          company_id: companyId,
          do_no: doNumber,
          sales_order_id: formData.sales_order_id,
          location_id: formData.location_id,
          delivery_date: formData.delivery_date,
          delivery_address: formData.delivery_address || null,
          notes: formData.notes || null,
          status: 'pending',
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create delivery order', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'DO #', accessor: (row: any) => row.do_no || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.delivery_date ? format(new Date(row.delivery_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Sales Order', accessor: (row: any) => row.sales_order_no || 'N/A' },
      { header: 'Status', accessor: (row: any) => row.status || 'pending' },
    ]
    exportTableToCSV(columns, orders, 'delivery_orders')
    toast('Export data downloaded', 'success')
  }

  const filteredOrders = orders.filter((order: any) =>
    order.do_no?.toLowerCase().includes(search.toLowerCase()) ||
    order.sales_order_no?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'DO #', accessor: (row: any) => row.do_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.delivery_date ? format(new Date(row.delivery_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Sales Order', accessor: (row: any) => row.sales_order_no || 'N/A' },
    { header: 'Status', accessor: (row: any) => row.status || 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="w-8 h-8 text-emerald-600" />
            Delivery Order
          </h1>
          <p className="text-gray-600 mt-1">Manage delivery orders and shipments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Delivery Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Delivery Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="do_no">DO Number</Label>
                  <Input
                    id="do_no"
                    value={formData.do_no}
                    onChange={(e) => setFormData({ ...formData, do_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sales_order_id">Sales Order *</Label>
                <Select value={formData.sales_order_id} onValueChange={(value) => setFormData({ ...formData, sales_order_id: value })} required>
                  <SelectTrigger id="sales_order_id">
                    <SelectValue placeholder="Select sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOrders.map((order: any) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_no} - {order.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location_id">Location *</Label>
                <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })} required>
                  <SelectTrigger id="location_id">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delivery_address">Delivery Address</Label>
                <Input
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  placeholder="Delivery address"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Delivery Order</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Delivery Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOrders}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
