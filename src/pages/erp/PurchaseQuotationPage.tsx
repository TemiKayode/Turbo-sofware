import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Plus, Search, Download } from 'lucide-react'
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

export function PurchaseQuotationPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    quotation_no: '',
    quotation_date: format(new Date(), 'yyyy-MM-dd'),
    supplier_id: '',
    valid_until: '',
    subtotal: '0',
    tax_amount: '0',
    total_amount: '0',
    notes: '',
  })

  const { data: quotations = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['purchase_quotations', companyId!],
    'purchase_quotations',
    {
      filters: (query) => query.eq('company_id', companyId!).order('quotation_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: suppliers = [] } = useSupabaseQuery<any>(
    ['suppliers', companyId!],
    'suppliers',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('supplier_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createQuotation } = useSupabaseMutation('purchase_quotations', {
    onSuccess: () => {
      toast('Purchase quotation created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create quotation', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      quotation_no: '',
      quotation_date: format(new Date(), 'yyyy-MM-dd'),
      supplier_id: '',
      valid_until: '',
      subtotal: '0',
      tax_amount: '0',
      total_amount: '0',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let quotationNumber = formData.quotation_no
      if (!quotationNumber) {
        const { count } = await supabase
          .from('purchase_quotations')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        quotationNumber = `PQ-${String((count || 0) + 1).padStart(6, '0')}`
      }

      const subtotal = parseFloat(formData.subtotal) || 0
      const taxAmount = parseFloat(formData.tax_amount) || 0
      const totalAmount = subtotal + taxAmount

      createQuotation({
        type: 'insert',
        payload: {
          company_id: companyId,
          quotation_no: quotationNumber,
          supplier_id: formData.supplier_id,
          quotation_date: formData.quotation_date,
          valid_until: formData.valid_until || null,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: formData.notes || null,
          status: 'pending',
          created_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create quotation', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'Quotation #', accessor: (row: any) => row.quotation_no || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.quotation_date ? format(new Date(row.quotation_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Supplier', accessor: (row: any) => row.supplier_name || 'N/A' },
      { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.total_amount?.toString() || '0').toFixed(2)}` },
      { header: 'Status', accessor: (row: any) => row.status || 'pending' },
    ]
    exportTableToCSV(columns, quotations, 'purchase_quotations')
    toast('Purchase quotations exported', 'success')
  }

  const filteredQuotations = quotations.filter((quot: any) =>
    quot.quotation_no?.toLowerCase().includes(search.toLowerCase()) ||
    quot.supplier_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Quotation #', accessor: (row: any) => row.quotation_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.quotation_date ? format(new Date(row.quotation_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Supplier', accessor: (row: any) => row.supplier_name || 'N/A' },
    { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.total_amount?.toString() || '0').toFixed(2)}` },
    { header: 'Status', accessor: (row: any) => row.status || 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Purchase Quotation
          </h1>
          <p className="text-gray-600 mt-1">Manage supplier quotations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Quotation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quotation_no">Quotation Number</Label>
                  <Input
                    id="quotation_no"
                    value={formData.quotation_no}
                    onChange={(e) => setFormData({ ...formData, quotation_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="quotation_date">Quotation Date *</Label>
                  <Input
                    id="quotation_date"
                    type="date"
                    value={formData.quotation_date}
                    onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="supplier_id">Supplier *</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })} required>
                  <SelectTrigger id="supplier_id">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subtotal">Subtotal *</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => {
                      const subtotal = parseFloat(e.target.value) || 0
                      const tax = parseFloat(formData.tax_amount) || 0
                      setFormData({ ...formData, subtotal: e.target.value, total_amount: (subtotal + tax).toString() })
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tax_amount">Tax Amount</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => {
                      const subtotal = parseFloat(formData.subtotal) || 0
                      const tax = parseFloat(e.target.value) || 0
                      setFormData({ ...formData, tax_amount: e.target.value, total_amount: (subtotal + tax).toString() })
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  readOnly
                  className="bg-gray-50"
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
                <Button type="submit">Create Quotation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Purchase Quotations</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search quotations..."
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
            data={filteredQuotations}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
