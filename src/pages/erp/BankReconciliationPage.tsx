import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Search, Download, CheckCircle } from 'lucide-react'
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

export function BankReconciliationPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    account_id: '',
    reconciliation_date: format(new Date(), 'yyyy-MM-dd'),
    opening_balance: '0',
    closing_balance: '0',
    bank_statement_balance: '0',
  })

  const { data: reconciliations = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['bank_reconciliations', companyId!],
    'bank_reconciliations',
    {
      filters: (query) => query.eq('company_id', companyId!).order('reconciliation_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: accounts = [] } = useSupabaseQuery<any>(
    ['chart_of_accounts', companyId!],
    'chart_of_accounts',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('account_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createReconciliation } = useSupabaseMutation('bank_reconciliations', {
    onSuccess: () => {
      toast('Bank reconciliation created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create reconciliation', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      account_id: '',
      reconciliation_date: format(new Date(), 'yyyy-MM-dd'),
      opening_balance: '0',
      closing_balance: '0',
      bank_statement_balance: '0',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      const openingBalance = parseFloat(formData.opening_balance) || 0
      const closingBalance = parseFloat(formData.closing_balance) || 0
      const bankStatementBalance = parseFloat(formData.bank_statement_balance) || 0
      const difference = bankStatementBalance - closingBalance

      createReconciliation({
        type: 'insert',
        payload: {
          company_id: companyId,
          account_id: formData.account_id,
          reconciliation_date: formData.reconciliation_date,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          bank_statement_balance: bankStatementBalance,
          difference: difference,
          status: Math.abs(difference) < 0.01 ? 'reconciled' : 'pending',
          reconciled_by: Math.abs(difference) < 0.01 ? user.id : null,
          reconciled_at: Math.abs(difference) < 0.01 ? new Date().toISOString() : null,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create reconciliation', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'Account', accessor: (row: any) => row.account_name || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.reconciliation_date ? format(new Date(row.reconciliation_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Bank Balance', accessor: (row: any) => `$${parseFloat(row.bank_statement_balance?.toString() || '0').toFixed(2)}` },
      { header: 'Book Balance', accessor: (row: any) => `$${parseFloat(row.closing_balance?.toString() || '0').toFixed(2)}` },
      { header: 'Difference', accessor: (row: any) => {
        const diff = parseFloat(row.difference?.toString() || '0')
        return `$${diff.toFixed(2)}`
      }},
      { header: 'Status', accessor: (row: any) => {
        const diff = Math.abs(parseFloat(row.difference?.toString() || '0'))
        return diff < 0.01 ? 'Reconciled' : 'Pending'
      }},
    ]
    exportTableToCSV(columns, reconciliations, 'bank_reconciliations')
    toast('Export data downloaded', 'success')
  }

  const filteredReconciliations = reconciliations.filter((rec: any) =>
    rec.account_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Account', accessor: (row: any) => row.account_name || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.reconciliation_date ? format(new Date(row.reconciliation_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Bank Balance', accessor: (row: any) => `$${parseFloat(row.bank_statement_balance?.toString() || '0').toFixed(2)}` },
    { header: 'Book Balance', accessor: (row: any) => `$${parseFloat(row.closing_balance?.toString() || '0').toFixed(2)}` },
    { header: 'Difference', accessor: (row: any) => {
      const diff = parseFloat(row.difference?.toString() || '0')
      return `$${diff.toFixed(2)}`
    }},
    { header: 'Status', accessor: (row: any) => {
      const diff = Math.abs(parseFloat(row.difference?.toString() || '0'))
      return diff < 0.01 ? 'Reconciled' : 'Pending'
    }},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600" />
            Bank Reconciliation
          </h1>
          <p className="text-gray-600 mt-1">Reconcile bank accounts with book balances</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Reconcile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Bank Reconciliation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="account_id">Bank Account *</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })} required>
                  <SelectTrigger id="account_id">
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((acc: any) => acc.account_type === 'asset' && acc.account_name.toLowerCase().includes('bank'))
                      .map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reconciliation_date">Reconciliation Date *</Label>
                <Input
                  id="reconciliation_date"
                  type="date"
                  value={formData.reconciliation_date}
                  onChange={(e) => setFormData({ ...formData, reconciliation_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="opening_balance">Opening Balance</Label>
                  <Input
                    id="opening_balance"
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="closing_balance">Book Balance *</Label>
                  <Input
                    id="closing_balance"
                    type="number"
                    step="0.01"
                    value={formData.closing_balance}
                    onChange={(e) => setFormData({ ...formData, closing_balance: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bank_statement_balance">Bank Statement Balance *</Label>
                  <Input
                    id="bank_statement_balance"
                    type="number"
                    step="0.01"
                    value={formData.bank_statement_balance}
                    onChange={(e) => setFormData({ ...formData, bank_statement_balance: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Reconciliation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bank Reconciliations</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search reconciliations..."
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
            data={filteredReconciliations}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
