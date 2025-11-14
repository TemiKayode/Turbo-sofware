import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PackageCheck, Plus, Search, Download } from 'lucide-react'
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

export function GRNPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    grn_no: '',
    receive_date: format(new Date(), 'yyyy-MM-dd'),
    po_id: '',
    location_id: '',
    notes: '',
  })

  const { data: grns = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['goods_receive_notes', companyId!],
    'goods_receive_notes',
    {
      filters: (query) => query.eq('company_id', companyId!).order('receive_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: purchaseOrders = [] } = useSupabaseQuery<any>(
    ['purchase_orders', companyId!],
    'purchase_orders',
    {
      filters: (query) => query.eq('company_id', companyId!).order('po_date', { ascending: false }),
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

  const { mutate: createGRN } = useSupabaseMutation('goods_receive_notes', {
    onSuccess: () => {
      toast('GRN created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create GRN', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      grn_no: '',
      receive_date: format(new Date(), 'yyyy-MM-dd'),
      po_id: '',
      location_id: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let grnNumber = formData.grn_no
      if (!grnNumber) {
        const { count } = await supabase
          .from('goods_receive_notes')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        grnNumber = `GRN-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createGRN({
        type: 'insert',
        payload: {
          company_id: companyId,
          grn_no: grnNumber,
          po_id: formData.po_id,
          location_id: formData.location_id,
          receive_date: formData.receive_date,
          notes: formData.notes || null,
          status: 'pending',
          received_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create GRN', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'GRN #', accessor: (row: any) => row.grn_no || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.receive_date ? format(new Date(row.receive_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'PO #', accessor: (row: any) => row.po_no || 'N/A' },
      { header: 'Status', accessor: (row: any) => row.status || 'received' },
    ]
    exportTableToCSV(columns, grns, 'goods_receive_notes')
    toast('GRNs exported', 'success')
  }

  const filteredGRNs = grns.filter((grn: any) =>
    grn.grn_no?.toLowerCase().includes(search.toLowerCase()) ||
    grn.po_no?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'GRN #', accessor: (row: any) => row.grn_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.receive_date ? format(new Date(row.receive_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'PO #', accessor: (row: any) => row.po_no || 'N/A' },
    { header: 'Status', accessor: (row: any) => row.status || 'received' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PackageCheck className="w-8 h-8 text-emerald-600" />
            Goods Receive Note
          </h1>
          <p className="text-gray-600 mt-1">Record goods received from suppliers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New GRN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Goods Receive Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grn_no">GRN Number</Label>
                  <Input
                    id="grn_no"
                    value={formData.grn_no}
                    onChange={(e) => setFormData({ ...formData, grn_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="receive_date">Receive Date *</Label>
                  <Input
                    id="receive_date"
                    type="date"
                    value={formData.receive_date}
                    onChange={(e) => setFormData({ ...formData, receive_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="po_id">Purchase Order *</Label>
                <Select value={formData.po_id} onValueChange={(value) => setFormData({ ...formData, po_id: value })} required>
                  <SelectTrigger id="po_id">
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po: any) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.po_no} - {po.supplier_name}
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
                <Button type="submit">Create GRN</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>GRNs</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search GRNs..."
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
            data={filteredGRNs}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
