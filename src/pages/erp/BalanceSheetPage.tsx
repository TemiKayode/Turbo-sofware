import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { exportToCSV } from '@/lib/exportUtils'

export function BalanceSheetPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    assets: { current: 0, fixed: 0, total: 0 },
    liabilities: { current: 0, longTerm: 0, total: 0 },
    equity: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchBalanceSheet()
    }
  }, [companyId, asOfDate])

  const fetchBalanceSheet = async () => {
    if (!companyId) return
    setLoading(true)

    try {
      // Get accounts and their balances
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)

      if (!accounts) return

      // Get voucher entries up to the date
      const { data: entries } = await supabase
        .from('voucher_entries')
        .select('*, accounting_vouchers!inner(voucher_date, company_id, status)')
        .eq('accounting_vouchers.company_id', companyId)
        .lte('accounting_vouchers.voucher_date', asOfDate)
        .eq('accounting_vouchers.status', 'posted')

      // Calculate balances for each account
      const balances: Record<string, number> = {}
      
      accounts.forEach((account: any) => {
        const openingBalance = parseFloat(account.opening_balance?.toString() || '0')
        balances[account.id] = openingBalance
      })

      entries?.forEach((entry: any) => {
        const debit = parseFloat(entry.debit_amount?.toString() || '0')
        const credit = parseFloat(entry.credit_amount?.toString() || '0')
        if (!balances[entry.account_id]) balances[entry.account_id] = 0
        
        // Assets and expenses: debit increases, credit decreases
        // Liabilities, equity, income: credit increases, debit decreases
        const account = accounts.find((a: any) => a.id === entry.account_id)
        if (account) {
          if (account.account_type === 'asset' || account.account_type === 'expense') {
            balances[entry.account_id] += debit - credit
          } else {
            balances[entry.account_id] += credit - debit
          }
        }
      })

      // Calculate totals by account type
      let currentAssets = 0
      let fixedAssets = 0
      let currentLiabilities = 0
      let longTermLiabilities = 0
      let equity = 0

      accounts.forEach((account: any) => {
        const balance = balances[account.id] || 0
        if (account.account_type === 'asset') {
          // Simple classification - in real system, use account groups
          if (account.account_name.toLowerCase().includes('cash') || 
              account.account_name.toLowerCase().includes('bank') ||
              account.account_name.toLowerCase().includes('receivable') ||
              account.account_name.toLowerCase().includes('inventory')) {
            currentAssets += Math.max(0, balance)
          } else {
            fixedAssets += Math.max(0, balance)
          }
        } else if (account.account_type === 'liability') {
          if (account.account_name.toLowerCase().includes('payable') ||
              account.account_name.toLowerCase().includes('short')) {
            currentLiabilities += Math.max(0, balance)
          } else {
            longTermLiabilities += Math.max(0, balance)
          }
        } else if (account.account_type === 'equity') {
          equity += Math.max(0, balance)
        }
      })

      // Calculate net profit/loss from income and expenses
      let income = 0
      let expenses = 0
      accounts.forEach((account: any) => {
        const balance = balances[account.id] || 0
        if (account.account_type === 'income') {
          income += Math.max(0, balance)
        } else if (account.account_type === 'expense') {
          expenses += Math.max(0, balance)
        }
      })
      const netProfit = income - expenses
      equity += netProfit

      setData({
        assets: {
          current: currentAssets,
          fixed: fixedAssets,
          total: currentAssets + fixedAssets,
        },
        liabilities: {
          current: currentLiabilities,
          longTerm: longTermLiabilities,
          total: currentLiabilities + longTermLiabilities,
        },
        equity: equity,
      })
    } catch (error: any) {
      console.error('Error fetching balance sheet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const exportData = [
      { Section: 'Assets', Item: 'Current Assets', Amount: `$${data.assets.current.toLocaleString()}` },
      { Section: 'Assets', Item: 'Fixed Assets', Amount: `$${data.assets.fixed.toLocaleString()}` },
      { Section: 'Assets', Item: 'Total Assets', Amount: `$${data.assets.total.toLocaleString()}` },
      { Section: 'Liabilities', Item: 'Current Liabilities', Amount: `$${data.liabilities.current.toLocaleString()}` },
      { Section: 'Liabilities', Item: 'Long-term Liabilities', Amount: `$${data.liabilities.longTerm.toLocaleString()}` },
      { Section: 'Liabilities', Item: 'Total Liabilities', Amount: `$${data.liabilities.total.toLocaleString()}` },
      { Section: 'Equity', Item: 'Equity', Amount: `$${data.equity.toLocaleString()}` },
      { Section: 'Total', Item: 'Total Liabilities & Equity', Amount: `$${(data.liabilities.total + data.equity).toLocaleString()}` },
    ]
    exportToCSV(exportData, 'balance_sheet', ['Section', 'Item', 'Amount'])
    toast('Balance sheet exported', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Balance Sheet
          </h1>
          <p className="text-gray-600 mt-1">Financial position as of a specific date</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Current Assets</span>
                  <span className="font-semibold">${data.assets.current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fixed Assets</span>
                  <span className="font-semibold">${data.assets.fixed.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Assets</span>
                  <span>${data.assets.total.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liabilities & Equity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Current Liabilities</span>
                  <span className="font-semibold">${data.liabilities.current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Long-term Liabilities</span>
                  <span className="font-semibold">${data.liabilities.longTerm.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Liabilities</span>
                  <span className="font-semibold">${data.liabilities.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equity</span>
                  <span className="font-semibold">${data.equity.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Liabilities & Equity</span>
                  <span>${(data.liabilities.total + data.equity).toLocaleString()}</span>
                </div>
                {Math.abs(data.assets.total - (data.liabilities.total + data.equity)) > 0.01 && (
                  <div className="mt-2 text-red-600 text-sm">
                    ⚠️ Balance sheet does not balance! Difference: ${Math.abs(data.assets.total - (data.liabilities.total + data.equity)).toFixed(2)}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
