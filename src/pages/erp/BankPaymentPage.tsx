import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Plus, Search, Download } from 'lucide-react'
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

export function BankPaymentPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    payment_no: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
    amount: '',
    payment_mode: 'transfer',
    cheque_no: '',
    cheque_date: '',
    beneficiary_name: '',
    narration: '',
  })

  const { data: payments = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['bank_payments', companyId!],
    'bank_payments',
    {
      filters: (query) => query.eq('company_id', companyId!).order('payment_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: bankAccounts = [] } = useSupabaseQuery<any>(
    ['chart_of_accounts', companyId!],
    'chart_of_accounts',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('account_type', 'asset').eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: createPayment } = useSupabaseMutation('bank_payments', {
    onSuccess: () => {
      toast('Bank payment created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create payment', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      payment_no: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      account_id: '',
      amount: '',
      payment_mode: 'transfer',
      cheque_no: '',
      cheque_date: '',
      beneficiary_name: '',
      narration: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      // Generate payment number if not provided
      let paymentNumber = formData.payment_no
      if (!paymentNumber) {
        const { count } = await supabase
          .from('bank_payments')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        paymentNumber = `BP-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createPayment({
        data: {
          company_id: companyId,
          payment_no: paymentNumber,
          payment_date: formData.payment_date,
          account_id: formData.account_id,
          amount: parseFloat(formData.amount),
          payment_mode: formData.payment_mode,
          cheque_no: formData.cheque_no || null,
          cheque_date: formData.cheque_date || null,
          beneficiary_name: formData.beneficiary_name || null,
          narration: formData.narration || null,
          created_by: user.id,
        },
        method: 'POST',
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create payment', 'error')
    }
  }

  const filteredPayments = payments.filter((pay: any) =>
    pay.payment_no?.toLowerCase().includes(search.toLowerCase()) ||
    pay.beneficiary_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Payment #', accessor: (row: any) => row.payment_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.payment_date ? format(new Date(row.payment_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Beneficiary', accessor: (row: any) => row.beneficiary_name || 'N/A' },
    { header: 'Amount', accessor: (row: any) => `$${parseFloat(row.amount?.toString() || '0').toFixed(2)}` },
    { header: 'Mode', accessor: (row: any) => row.payment_mode || 'N/A' },
    { header: 'Status', accessor: (row: any) => row.status || 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Bank Payment
          </h1>
          <p className="text-gray-600 mt-1">Record bank payments to suppliers and vendors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bank Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_no">Payment Number</Label>
                  <Input
                    id="payment_no"
                    value={formData.payment_no}
                    onChange={(e) => setFormData({ ...formData, payment_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_date">Payment Date *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="beneficiary_name">Beneficiary Name *</Label>
                <Input
                  id="beneficiary_name"
                  value={formData.beneficiary_name}
                  onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                  placeholder="Enter beneficiary name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_id">Bank Account *</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })} required>
                  <SelectTrigger id="account_id">
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.account_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="payment_mode">Payment Mode *</Label>
                  <Select value={formData.payment_mode} onValueChange={(value) => setFormData({ ...formData, payment_mode: value })} required>
                    <SelectTrigger id="payment_mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.payment_mode === 'cheque' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cheque_no">Cheque Number</Label>
                    <Input
                      id="cheque_no"
                      value={formData.cheque_no}
                      onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cheque_date">Cheque Date</Label>
                    <Input
                      id="cheque_date"
                      type="date"
                      value={formData.cheque_date}
                      onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })}
                    />
                  </div>
                </div>
              )}
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
                <Button type="submit">Create Payment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bank Payments</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => {
                exportTableToCSV(columns, payments, 'bank_payments')
                toast('Bank payments exported', 'success')
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPayments}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
