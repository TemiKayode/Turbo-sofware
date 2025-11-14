import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Plus, Download, Search } from 'lucide-react'
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
import { supabase } from '@/lib/supabase'
import { exportTableToCSV } from '@/lib/exportUtils'

export function SalesInvoicePage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    invoice_no: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    customer_id: '',
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    subtotal: '0',
    discount_percent: '0',
    discount_amount: '0',
    tax_amount: '0',
    total_amount: '0',
    notes: '',
  })

  const { data: invoices = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['sales_invoices', companyId!],
    'sales_invoices',
    {
      filters: (query) => query.eq('company_id', companyId!).order('invoice_date', { ascending: false }),
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

  const { mutate: createInvoice } = useSupabaseMutation('sales_invoices', {
    onSuccess: () => {
      toast('Sales invoice created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create invoice', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      invoice_no: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      customer_id: '',
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      subtotal: '0',
      discount_percent: '0',
      discount_amount: '0',
      tax_amount: '0',
      total_amount: '0',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let invoiceNumber = formData.invoice_no
      if (!invoiceNumber) {
        const { count } = await supabase
          .from('sales_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        invoiceNumber = `SI-${String((count || 0) + 1).padStart(6, '0')}`
      }

      const subtotal = parseFloat(formData.subtotal) || 0
      const discountAmount = parseFloat(formData.discount_amount) || 0
      const taxAmount = parseFloat(formData.tax_amount) || 0
      const totalAmount = subtotal - discountAmount + taxAmount

      createInvoice({
        type: 'insert',
        payload: {
          company_id: companyId,
          invoice_no: invoiceNumber,
          customer_id: formData.customer_id,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || null,
          subtotal: subtotal,
          discount_percent: parseFloat(formData.discount_percent) || 0,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          paid_amount: 0,
          balance_amount: totalAmount,
          notes: formData.notes || null,
          status: 'pending',
          created_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create invoice', 'error')
    }
  }

  const filteredInvoices = invoices.filter((inv: any) =>
    inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Invoice #', accessor: (row: any) => row.invoice_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.invoice_date ? format(new Date(row.invoice_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Customer', accessor: (row: any) => row.customer_name || 'N/A' },
    { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.total_amount?.toString() || '0').toFixed(2)}` },
    { header: 'Status', accessor: (row: any) => row.status || 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-purple-600" />
            Sales Invoice
          </h1>
          <p className="text-gray-600 mt-1">Create and manage sales invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_no">Invoice Number</Label>
                  <Input
                    id="invoice_no"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_date">Invoice Date *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
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
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discount_percent">Discount %</Label>
                  <Input
                    id="discount_percent"
                    type="number"
                    step="0.01"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_amount">Discount Amount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tax_amount">Tax Amount</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
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
                <Button type="submit">Create Invoice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoices</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => {
                exportTableToCSV(columns, invoices, 'sales_invoices')
                toast('Sales invoices exported', 'success')
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredInvoices}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
