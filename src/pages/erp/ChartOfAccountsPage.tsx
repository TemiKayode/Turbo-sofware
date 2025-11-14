import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'

interface ChartOfAccount {
  id: string
  account_code: string
  account_name: string
  account_type: string
  parent_id: string | null
  is_control_account: boolean
  control_account_id: string | null
  opening_balance: number
  current_balance: number
  is_active: boolean
}

export function ChartOfAccountsPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '',
    parent_id: '',
    is_control_account: false,
    control_account_id: '',
    opening_balance: '',
  })

  const { data: accounts = [], isLoading, refetch } = useSupabaseQuery<ChartOfAccount>(
    ['chart_of_accounts', companyId!],
    'chart_of_accounts',
    {
      filters: (query) => query.eq('company_id', companyId!).order('account_code'),
      enabled: !!companyId,
    }
  )

  const mutation = useSupabaseMutation<ChartOfAccount>('chart_of_accounts', [
    ['chart_of_accounts', companyId!],
  ])

  const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ]

  const handleOpenDialog = (account?: ChartOfAccount) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        parent_id: account.parent_id || '',
        is_control_account: account.is_control_account,
        control_account_id: account.control_account_id || '',
        opening_balance: account.opening_balance.toString(),
      })
    } else {
      setEditingAccount(null)
      setFormData({
        account_code: '',
        account_name: '',
        account_type: '',
        parent_id: '',
        is_control_account: false,
        control_account_id: '',
        opening_balance: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const payload = {
        company_id: companyId,
        account_code: formData.account_code,
        account_name: formData.account_name,
        account_type: formData.account_type,
        parent_id: formData.parent_id || null,
        is_control_account: formData.is_control_account,
        control_account_id: formData.control_account_id || null,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        current_balance: parseFloat(formData.opening_balance) || 0,
      }

      if (editingAccount) {
        await mutation.mutateAsync({
          type: 'update',
          id: editingAccount.id,
          payload,
        })
        toast('Account updated successfully', 'success')
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
        toast('Account created successfully', 'success')
      }
      setDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to save account', 'error')
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'default'
      case 'liability':
        return 'destructive'
      case 'equity':
        return 'secondary'
      case 'income':
        return 'success'
      case 'expense':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const columns = [
    { header: 'Code', accessor: 'account_code' as keyof ChartOfAccount },
    { header: 'Account Name', accessor: 'account_name' as keyof ChartOfAccount },
    {
      header: 'Type',
      accessor: (row: ChartOfAccount) => (
        <Badge variant={getAccountTypeColor(row.account_type) as any}>
          {row.account_type.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Balance',
      accessor: (row: ChartOfAccount) => `$${row.current_balance.toFixed(2)}`,
    },
    {
      header: 'Control',
      accessor: (row: ChartOfAccount) => (row.is_control_account ? 'Yes' : 'No'),
    },
    {
      header: 'Status',
      accessor: (row: ChartOfAccount) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>Create Account</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Create New Account'}
              </DialogTitle>
              <DialogDescription>
                {editingAccount
                  ? 'Update account information'
                  : 'Add a new account to the chart of accounts'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_code">Account Code *</Label>
                  <Input
                    id="account_code"
                    value={formData.account_code}
                    onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_name">Account Name *</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_type">Account Type *</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parent_id">Parent Account</Label>
                  <Select
                    value={formData.parent_id || undefined}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accounts
                        .filter((a) => a.id !== editingAccount?.id)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_control_account"
                    checked={formData.is_control_account}
                    onChange={(e) =>
                      setFormData({ ...formData, is_control_account: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="is_control_account">Control Account</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        searchable
        searchPlaceholder="Search accounts..."
        loading={isLoading}
        actions={(account) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(account)}>
              Edit
            </Button>
          </div>
        )}
      />
    </div>
  )
}
