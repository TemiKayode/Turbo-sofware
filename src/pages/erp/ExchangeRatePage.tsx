import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ExchangeRate {
  id: string
  currency_id: string
  rate_date: string
  exchange_rate: number
  currencies?: { currency_code: string; currency_name: string }
}

export function ExchangeRatePage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    currency_id: '',
    rate_date: format(new Date(), 'yyyy-MM-dd'),
    exchange_rate: '',
  })

  const { data: exchangeRates = [], isLoading, refetch } = useSupabaseQuery<ExchangeRate>(
    ['exchange_rates', companyId!],
    'exchange_rates',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, currencies(currency_code, currency_name)')
          .order('rate_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: currencies = [] } = useSupabaseQuery<any>(
    ['currencies', companyId!],
    'currencies',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: createRate } = useSupabaseMutation('exchange_rates', {
    onSuccess: () => {
      toast('Exchange rate created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create exchange rate', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      currency_id: '',
      rate_date: format(new Date(), 'yyyy-MM-dd'),
      exchange_rate: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    const payload = {
      company_id: companyId,
      currency_id: formData.currency_id,
      rate_date: formData.rate_date,
      exchange_rate: parseFloat(formData.exchange_rate),
      created_by: user.id,
    }

    createRate({ data: payload, method: 'POST' })
  }

  const columns = [
    {
      accessorKey: 'rate_date',
      header: 'Date',
      cell: ({ row }: any) => format(new Date(row.original.rate_date), 'PP'),
    },
    {
      accessorKey: 'currencies.currency_code',
      header: 'Currency',
      cell: ({ row }: any) => row.original.currencies?.currency_code || '-',
    },
    {
      accessorKey: 'currencies.currency_name',
      header: 'Currency Name',
      cell: ({ row }: any) => row.original.currencies?.currency_name || '-',
    },
    {
      accessorKey: 'exchange_rate',
      header: 'Exchange Rate',
      cell: ({ row }: any) => row.original.exchange_rate.toFixed(4),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exchange Rate</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Exchange Rate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Currency *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.currency_id}
                  onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                  required
                >
                  <option value="">Select Currency</option>
                  {currencies.map((curr: any) => (
                    <option key={curr.id} value={curr.id}>
                      {curr.currency_code} - {curr.currency_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Rate Date *</Label>
                <Input
                  type="date"
                  value={formData.rate_date}
                  onChange={(e) => setFormData({ ...formData, rate_date: e.target.value })}
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Create Rate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={exchangeRates} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

