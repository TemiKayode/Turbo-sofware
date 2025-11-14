import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Plus, Search, Download } from 'lucide-react'
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

export function ReceiptPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    receipt_no: '',
    receipt_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
    receipt_mode: 'cash',
    payer_name: '',
    amount: '',
    narration: '',
  })

  const { data: receipts = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['receipts', companyId!],
    'receipts',
    {
      filters: (query) => query.eq('company_id', companyId!).order('receipt_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: accounts = [] } = useSupabaseQuery<any>(
    ['chart_of_accounts', companyId!],
    'chart_of_accounts',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: createReceipt } = useSupabaseMutation('receipts', {
    onSuccess: () => {
      toast('Receipt created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create receipt', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      receipt_no: '',
      receipt_date: format(new Date(), 'yyyy-MM-dd'),
      account_id: '',
      receipt_mode: 'cash',
      payer_name: '',
      amount: '',
      narration: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let receiptNumber = formData.receipt_no
      if (!receiptNumber) {
        const { count } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        receiptNumber = `RCP-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createReceipt({
        type: 'insert',
        payload: {
          company_id: companyId,
          receipt_no: receiptNumber,
          receipt_date: formData.receipt_date,
          account_id: formData.account_id,
          receipt_mode: formData.receipt_mode,
          payer_name: formData.payer_name || null,
          amount: parseFloat(formData.amount),
          narration: formData.narration || null,
          created_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create receipt', 'error')
    }
  }

  const filteredReceipts = receipts.filter((rec: any) =>
    rec.receipt_no?.toLowerCase().includes(search.toLowerCase()) ||
    rec.payer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Receipt #', accessor: (row: any) => row.receipt_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.receipt_date ? format(new Date(row.receipt_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Payer', accessor: (row: any) => row.payer_name || 'N/A' },
    { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.amount?.toString() || '0').toFixed(2)}` },
    { header: 'Payment Mode', accessor: (row: any) => row.receipt_mode || 'cash' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-emerald-600" />
            Receipt
          </h1>
          <p className="text-gray-600 mt-1">Record customer payments and receipts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Receipt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receipt_no">Receipt Number</Label>
                  <Input
                    id="receipt_no"
                    value={formData.receipt_no}
                    onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="receipt_date">Receipt Date *</Label>
                  <Input
                    id="receipt_date"
                    type="date"
                    value={formData.receipt_date}
                    onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="account_id">Account *</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })} required>
                  <SelectTrigger id="account_id">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.account_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payer_name">Payer Name *</Label>
                  <Input
                    id="payer_name"
                    value={formData.payer_name}
                    onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="receipt_mode">Payment Mode *</Label>
                  <Select value={formData.receipt_mode} onValueChange={(value) => setFormData({ ...formData, receipt_mode: value })} required>
                    <SelectTrigger id="receipt_mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="narration">Narration</Label>
                <Input
                  id="narration"
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  placeholder="Payment description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Receipt</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Receipts</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search receipts..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => {
                exportTableToCSV(columns, receipts, 'receipts')
                toast('Receipts exported', 'success')
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredReceipts}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
