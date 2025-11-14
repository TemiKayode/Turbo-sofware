import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { exportTableToCSV } from '@/lib/exportUtils'

interface TrialBalanceRow {
  account_code: string
  account_name: string
  debit_balance: number
  credit_balance: number
}

export function TrialBalancePage() {
  const { companyId } = useAuth()
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0])
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const { data: accounts = [] } = useSupabaseQuery<any>(
    ['chart_of_accounts', companyId!],
    'chart_of_accounts',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const generateTrialBalance = async () => {
    if (!companyId) return
    setLoading(true)

    try {
      // Get all voucher entries up to the selected date
      const { data: entries, error } = await supabase
        .from('voucher_entries')
        .select('*, accounting_vouchers!inner(voucher_date, company_id)')
        .eq('accounting_vouchers.company_id', companyId!)
        .lte('accounting_vouchers.voucher_date', asOnDate)
        .eq('accounting_vouchers.status', 'posted')

      if (error) throw error

      // Calculate balances for each account
      const balances: Record<string, { debit: number; credit: number }> = {}

      // Initialize with opening balances
      accounts.forEach((account: any) => {
        balances[account.id] = {
          debit: account.account_type === 'asset' || account.account_type === 'expense' 
            ? account.opening_balance : 0,
          credit: account.account_type === 'liability' || account.account_type === 'equity' || account.account_type === 'income'
            ? account.opening_balance : 0,
        }
      })

      // Add transaction amounts
      entries?.forEach((entry: any) => {
        if (!balances[entry.account_id]) {
          balances[entry.account_id] = { debit: 0, credit: 0 }
        }
        balances[entry.account_id].debit += entry.debit_amount || 0
        balances[entry.account_id].credit += entry.credit_amount || 0
      })

      // Format for display
      const trialBalanceData: TrialBalanceRow[] = accounts.map((account: any) => {
        const balance = balances[account.id] || { debit: 0, credit: 0 }
        const netDebit = Math.max(0, balance.debit - balance.credit)
        const netCredit = Math.max(0, balance.credit - balance.debit)

        return {
          account_code: account.account_code,
          account_name: account.account_name,
          debit_balance: netDebit,
          credit_balance: netCredit,
        }
      })

      setTrialBalance(trialBalanceData)
    } catch (error: any) {
      toast(error.message || 'Failed to generate trial balance', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totalDebit = trialBalance.reduce((sum, row) => sum + row.debit_balance, 0)
  const totalCredit = trialBalance.reduce((sum, row) => sum + row.credit_balance, 0)

  const columns = [
    { header: 'Account Code', accessor: 'account_code' as keyof TrialBalanceRow },
    { header: 'Account Name', accessor: 'account_name' as keyof TrialBalanceRow },
    {
      header: 'Debit',
      accessor: (row: TrialBalanceRow) => (row.debit_balance > 0 ? `$${row.debit_balance.toFixed(2)}` : ''),
    },
    {
      header: 'Credit',
      accessor: (row: TrialBalanceRow) => (row.credit_balance > 0 ? `$${row.credit_balance.toFixed(2)}` : ''),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trial Balance</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Trial Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="as_on_date">As On Date</Label>
              <Input
                id="as_on_date"
                type="date"
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
              />
            </div>
            <Button onClick={generateTrialBalance} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Trial Balance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {trialBalance.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Trial Balance as on {format(new Date(asOnDate), 'MMMM dd, yyyy')}
              </CardTitle>
              <Button variant="outline" onClick={() => {
                exportTableToCSV(columns, trialBalance, 'trial_balance')
                toast('Trial balance exported', 'success')
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable data={trialBalance} columns={columns} />
            <div className="mt-4 pt-4 border-t flex justify-end gap-8">
              <div>
                <span className="font-semibold">Total Debit: </span>
                <span className="text-lg">${totalDebit.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-semibold">Total Credit: </span>
                <span className="text-lg">${totalCredit.toFixed(2)}</span>
              </div>
            </div>
            {Math.abs(totalDebit - totalCredit) > 0.01 && (
              <div className="mt-2 text-red-600 text-sm">
                ⚠️ Trial balance does not match! Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
