import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Currency {
  id: string
  currency_code: string
  currency_name: string
  symbol: string
  is_base_currency: boolean
  exchange_rate: number
  is_active: boolean
}

export function CurrencyPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    symbol: '',
    is_base_currency: false,
    exchange_rate: '1',
  })

  const { data: currencies = [], isLoading, refetch } = useSupabaseQuery<Currency>(
    ['currencies', companyId!],
    'currencies',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('currency_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createCurrency } = useSupabaseMutation('currencies', {
    onSuccess: () => {
      toast('Currency created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create currency', 'error')
    },
  })

  const { mutate: updateCurrency } = useSupabaseMutation('currencies', {
    onSuccess: () => {
      toast('Currency updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update currency', 'error')
    },
  })

  const { mutate: deleteCurrency } = useSupabaseMutation('currencies', {
    onSuccess: () => {
      toast('Currency deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete currency', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      currency_code: '',
      currency_name: '',
      symbol: '',
      is_base_currency: false,
      exchange_rate: '1',
    })
    setEditingCurrency(null)
  }

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      currency_code: currency.currency_code,
      currency_name: currency.currency_name,
      symbol: currency.symbol,
      is_base_currency: currency.is_base_currency,
      exchange_rate: currency.exchange_rate.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this currency?')) {
      deleteCurrency({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      currency_code: formData.currency_code,
      currency_name: formData.currency_name,
      symbol: formData.symbol,
      is_base_currency: formData.is_base_currency,
      exchange_rate: parseFloat(formData.exchange_rate),
      is_active: true,
    }

    if (editingCurrency) {
      updateCurrency({ id: editingCurrency.id, data: payload, method: 'PATCH' })
    } else {
      createCurrency({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'currency_code',
      header: 'Code',
    },
    {
      accessorKey: 'currency_name',
      header: 'Currency Name',
    },
    {
      accessorKey: 'symbol',
      header: 'Symbol',
    },
    {
      accessorKey: 'exchange_rate',
      header: 'Exchange Rate',
    },
    {
      accessorKey: 'is_base_currency',
      header: 'Base Currency',
      cell: ({ row }: any) => row.original.is_base_currency ? 'Yes' : 'No',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Currency</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Currency Code *</Label>
                <Input
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                  placeholder="USD, EUR, GBP"
                  required
                  maxLength={3}
                />
              </div>
              <div>
                <Label>Currency Name *</Label>
                <Input
                  value={formData.currency_name}
                  onChange={(e) => setFormData({ ...formData, currency_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Symbol *</Label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="$"
                  required
                />
              </div>
              <div>
                <Label>Exchange Rate *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.exchange_rate}
                  onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_base_currency"
                  checked={formData.is_base_currency}
                  onChange={(e) => setFormData({ ...formData, is_base_currency: e.target.checked })}
                  className="w-4 h-4 text-[#2CA01C] border-gray-300 rounded"
                />
                <Label htmlFor="is_base_currency" className="ml-2">
                  Base Currency
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {editingCurrency ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={currencies} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

