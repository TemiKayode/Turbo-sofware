import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Plus, Search, Download } from 'lucide-react'
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

export function ExportSalesPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    export_no: '',
    export_date: format(new Date(), 'yyyy-MM-dd'),
    customer_id: '',
    shipment_date: '',
    port_of_loading: '',
    port_of_discharge: '',
    incoterms: 'FOB',
    currency: 'USD',
    exchange_rate: '1',
    notes: '',
  })

  const { data: exports = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['export_sales', companyId!],
    'export_sales',
    {
      filters: (query) => query.eq('company_id', companyId!).order('export_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: customers = [] } = useSupabaseQuery<any>(
    ['customers', companyId!],
    'customers',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('customer_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createExport } = useSupabaseMutation('export_sales', {
    onSuccess: () => {
      toast('Export sale created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create export sale', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      export_no: '',
      export_date: format(new Date(), 'yyyy-MM-dd'),
      customer_id: '',
      shipment_date: '',
      port_of_loading: '',
      port_of_discharge: '',
      incoterms: 'FOB',
      currency: 'USD',
      exchange_rate: '1',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let exportNumber = formData.export_no
      if (!exportNumber) {
        const { count } = await supabase
          .from('export_sales')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        exportNumber = `EXP-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createExport({
        type: 'insert',
        payload: {
          company_id: companyId,
          export_no: exportNumber,
          customer_id: formData.customer_id,
          export_date: formData.export_date,
          shipment_date: formData.shipment_date || null,
          port_of_loading: formData.port_of_loading || null,
          port_of_discharge: formData.port_of_discharge || null,
          incoterms: formData.incoterms || null,
          currency: formData.currency,
          exchange_rate: parseFloat(formData.exchange_rate) || 1,
          notes: formData.notes || null,
          status: 'pending',
          created_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create export sale', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'Export #', accessor: (row: any) => row.export_no || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.export_date ? format(new Date(row.export_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Customer', accessor: (row: any) => row.customer_name || 'N/A' },
      { header: 'Country', accessor: (row: any) => row.destination_country || 'N/A' },
      { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.total_amount?.toString() || '0').toFixed(2)}` },
      { header: 'Status', accessor: (row: any) => row.status || 'pending' },
    ]
    exportTableToCSV(columns, exports, 'export_sales')
    toast('Export data downloaded', 'success')
  }

  const filteredExports = exports.filter((exp: any) =>
    exp.export_no?.toLowerCase().includes(search.toLowerCase()) ||
    exp.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Export #', accessor: (row: any) => row.export_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.export_date ? format(new Date(row.export_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Customer', accessor: (row: any) => row.customer_name || 'N/A' },
    { header: 'Country', accessor: (row: any) => row.destination_country || 'N/A' },
    { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.total_amount?.toString() || '0').toFixed(2)}` },
    { header: 'Status', accessor: (row: any) => row.status || 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            Export Sales
          </h1>
          <p className="text-gray-600 mt-1">Manage international sales and exports</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Export Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Export Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export_no">Export Number</Label>
                  <Input
                    id="export_no"
                    value={formData.export_no}
                    onChange={(e) => setFormData({ ...formData, export_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="export_date">Export Date *</Label>
                  <Input
                    id="export_date"
                    type="date"
                    value={formData.export_date}
                    onChange={(e) => setFormData({ ...formData, export_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_id">Customer *</Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })} required>
                  <SelectTrigger id="customer_id">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipment_date">Shipment Date</Label>
                  <Input
                    id="shipment_date"
                    type="date"
                    value={formData.shipment_date}
                    onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="incoterms">Incoterms</Label>
                  <Select value={formData.incoterms} onValueChange={(value) => setFormData({ ...formData, incoterms: value })}>
                    <SelectTrigger id="incoterms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                      <SelectItem value="DDP">DDP</SelectItem>
                      <SelectItem value="DAP">DAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="port_of_loading">Port of Loading</Label>
                  <Input
                    id="port_of_loading"
                    value={formData.port_of_loading}
                    onChange={(e) => setFormData({ ...formData, port_of_loading: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="port_of_discharge">Port of Discharge</Label>
                  <Input
                    id="port_of_discharge"
                    value={formData.port_of_discharge}
                    onChange={(e) => setFormData({ ...formData, port_of_discharge: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="exchange_rate">Exchange Rate</Label>
                  <Input
                    id="exchange_rate"
                    type="number"
                    step="0.0001"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                  />
                </div>
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
                <Button type="submit">Create Export Sale</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Export Sales</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search exports..."
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
            data={filteredExports}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
