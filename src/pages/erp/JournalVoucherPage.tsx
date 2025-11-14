import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'

interface Voucher {
  id: string
  voucher_no: string
  voucher_type: string
  voucher_date: string
  status: string
  total_debit: number
  total_credit: number
  narration: string | null
}

interface VoucherEntry {
  id: string
  account_id: string
  debit_amount: number
  credit_amount: number
  narration: string | null
  chart_of_accounts?: { account_name: string; account_code: string }
}

export function JournalVoucherPage() {
  const { companyId } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    narration: '',
  })

  const [entries, setEntries] = useState<Array<{
    account_id: string
    debit_amount: string
    credit_amount: string
    narration: string
  }>>([{ account_id: '', debit_amount: '', credit_amount: '', narration: '' }])

  const { data: vouchers = [], isLoading, refetch } = useSupabaseQuery<Voucher>(
    ['accounting_vouchers', companyId!],
    'accounting_vouchers',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .eq('voucher_type', 'journal')
          .order('voucher_date', { ascending: false }),
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

  const { data: voucherEntries = [] } = useSupabaseQuery<VoucherEntry>(
    ['voucher_entries', selectedVoucher?.id || ''],
    'voucher_entries',
    {
      filters: (query) =>
        query
          .eq('voucher_id', selectedVoucher?.id || '')
          .select('*, chart_of_accounts(account_name, account_code)'),
      enabled: !!selectedVoucher?.id,
    }
  )

  const addEntry = () => {
    setEntries([...entries, { account_id: '', debit_amount: '', credit_amount: '', narration: '' }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: string, value: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setEntries(newEntries)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    // Validate: Total debit must equal total credit
    const totalDebit = entries.reduce(
      (sum, e) => sum + (parseFloat(e.debit_amount) || 0),
      0
    )
    const totalCredit = entries.reduce(
      (sum, e) => sum + (parseFloat(e.credit_amount) || 0),
      0
    )

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast('Total debit must equal total credit', 'error')
      return
    }

    try {
      // Create voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('accounting_vouchers')
        .insert({
          company_id: companyId,
          voucher_no: `JV-${Date.now()}`,
          voucher_type: 'journal',
          voucher_date: formData.voucher_date,
          status: 'draft',
          total_debit: totalDebit,
          total_credit: totalCredit,
          narration: formData.narration || null,
        })
        .select()
        .single()

      if (voucherError) throw voucherError

      // Create entries
      const voucherEntries = entries
        .filter((e) => e.account_id)
        .map((entry) => ({
          voucher_id: voucher.id,
          account_id: entry.account_id,
          debit_amount: parseFloat(entry.debit_amount) || 0,
          credit_amount: parseFloat(entry.credit_amount) || 0,
          narration: entry.narration || null,
        }))

      const { error: entriesError } = await supabase
        .from('voucher_entries')
        .insert(voucherEntries)

      if (entriesError) throw entriesError

      toast('Journal voucher created successfully', 'success')
      setShowCreate(false)
      setEntries([{ account_id: '', debit_amount: '', credit_amount: '', narration: '' }])
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to create journal voucher', 'error')
    }
  }

  const handlePost = async (voucher: Voucher) => {
    try {
      const { error } = await supabase
        .from('accounting_vouchers')
        .update({
          status: 'posted',
          posted_by: (await supabase.auth.getUser()).data.user?.id,
          posted_at: new Date().toISOString(),
        })
        .eq('id', voucher.id)

      if (error) throw error

      toast('Voucher posted successfully', 'success')
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to post voucher', 'error')
    }
  }

  const columns = [
    { header: 'Voucher No', accessor: 'voucher_no' as keyof Voucher },
    {
      header: 'Date',
      accessor: (row: Voucher) => format(new Date(row.voucher_date), 'MMM dd, yyyy'),
    },
    {
      header: 'Debit',
      accessor: (row: Voucher) => `$${row.total_debit.toFixed(2)}`,
    },
    {
      header: 'Credit',
      accessor: (row: Voucher) => `$${row.total_credit.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (row: Voucher) => (
        <Badge variant={row.status === 'posted' ? 'success' : 'secondary'}>
          {row.status}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Journal Vouchers</h1>
        <Button onClick={() => setShowCreate(true)}>Create Journal Voucher</Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Journal Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voucher_date">Voucher Date *</Label>
                  <Input
                    id="voucher_date"
                    type="date"
                    value={formData.voucher_date}
                    onChange={(e) => setFormData({ ...formData, voucher_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="narration">Narration</Label>
                  <Input
                    id="narration"
                    value={formData.narration}
                    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Entries</h3>
                  <Button type="button" variant="outline" onClick={addEntry}>
                    Add Entry
                  </Button>
                </div>

                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label>Account</Label>
                        <Select
                          value={entry.account_id}
                          onValueChange={(value) => updateEntry(index, 'account_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Debit</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={entry.debit_amount}
                          onChange={(e) => updateEntry(index, 'debit_amount', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Credit</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={entry.credit_amount}
                          onChange={(e) => updateEntry(index, 'credit_amount', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Narration</Label>
                        <Input
                          value={entry.narration}
                          onChange={(e) => updateEntry(index, 'narration', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEntry(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <div className="text-sm">
                    <span className="font-medium">Total Debit: </span>
                    ${entries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Total Credit: </span>
                    ${entries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">Create Voucher</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <DataTable
            data={vouchers}
            columns={columns}
            searchable
            searchPlaceholder="Search vouchers..."
            loading={isLoading}
            onRowClick={(row) => setSelectedVoucher(row)}
          />
        </div>

        {selectedVoucher && (
          <Card>
            <CardHeader>
              <CardTitle>Voucher Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <div>
                  <span className="font-medium">Voucher No:</span> {selectedVoucher.voucher_no}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{' '}
                  {format(new Date(selectedVoucher.voucher_date), 'PP')}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant={selectedVoucher.status === 'posted' ? 'success' : 'secondary'}>
                    {selectedVoucher.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Total Debit:</span> $
                  {selectedVoucher.total_debit.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Total Credit:</span> $
                  {selectedVoucher.total_credit.toFixed(2)}
                </div>
              </div>

              {voucherEntries.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Entries</h4>
                  <div className="space-y-1 text-sm">
                    {voucherEntries.map((entry) => (
                      <div key={entry.id} className="border-b pb-1">
                        <div className="font-medium">
                          {entry.chart_of_accounts?.account_code} -{' '}
                          {entry.chart_of_accounts?.account_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Debit: ${entry.debit_amount.toFixed(2)} | Credit: $
                          {entry.credit_amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedVoucher.status === 'draft' && (
                <Button
                  className="w-full mt-4"
                  onClick={() => handlePost(selectedVoucher)}
                >
                  Post Voucher
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
