import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, FileText } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ChequeDeposit {
  id: string
  deposit_no: string
  account_id: string
  cheque_no: string
  cheque_date: string
  deposit_date: string
  drawer_name: string
  bank_name: string
  amount: number
  status: string
  chart_of_accounts?: { account_name: string }
}

export function ChequeDepositPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    account_id: '',
    cheque_no: '',
    cheque_date: format(new Date(), 'yyyy-MM-dd'),
    deposit_date: format(new Date(), 'yyyy-MM-dd'),
    drawer_name: '',
    bank_name: '',
    amount: '',
  })

  const { data: deposits = [], isLoading, refetch } = useSupabaseQuery<ChequeDeposit>(
    ['cheque_deposits', companyId!],
    'cheque_deposits',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, chart_of_accounts(account_name)')
          .order('deposit_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: bankAccounts = [] } = useSupabaseQuery<any>(
    ['bank_accounts', companyId!],
    'chart_of_accounts',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .eq('account_type', 'asset')
          .ilike('account_name', '%bank%')
          .eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: createDeposit } = useSupabaseMutation('cheque_deposits', {
    onSuccess: () => {
      toast('Cheque deposit created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create cheque deposit', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      account_id: '',
      cheque_no: '',
      cheque_date: format(new Date(), 'yyyy-MM-dd'),
      deposit_date: format(new Date(), 'yyyy-MM-dd'),
      drawer_name: '',
      bank_name: '',
      amount: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    const depositNo = `CHQ-${Date.now()}`
    const payload = {
      company_id: companyId,
      deposit_no: depositNo,
      account_id: formData.account_id,
      cheque_no: formData.cheque_no,
      cheque_date: formData.cheque_date,
      deposit_date: formData.deposit_date,
      drawer_name: formData.drawer_name,
      bank_name: formData.bank_name,
      amount: parseFloat(formData.amount),
      status: 'pending',
      created_by: user.id,
    }

    createDeposit({ data: payload, method: 'POST' })
  }

  const columns = [
    {
      accessorKey: 'deposit_no',
      header: 'Deposit No',
    },
    {
      accessorKey: 'cheque_no',
      header: 'Cheque No',
    },
    {
      accessorKey: 'deposit_date',
      header: 'Deposit Date',
      cell: ({ row }: any) => format(new Date(row.original.deposit_date), 'PP'),
    },
    {
      accessorKey: 'drawer_name',
      header: 'Drawer',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => `$${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={
          row.original.status === 'cleared' ? 'bg-green-100 text-green-800' :
          row.original.status === 'bounced' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cheque Deposit</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Cheque Deposit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Bank Account *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  required
                >
                  <option value="">Select Account</option>
                  {bankAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cheque No *</Label>
                  <Input
                    value={formData.cheque_no}
                    onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Cheque Date *</Label>
                  <Input
                    type="date"
                    value={formData.cheque_date}
                    onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Deposit Date *</Label>
                <Input
                  type="date"
                  value={formData.deposit_date}
                  onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Drawer Name *</Label>
                  <Input
                    value={formData.drawer_name}
                    onChange={(e) => setFormData({ ...formData, drawer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Deposit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cheque Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={deposits} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

