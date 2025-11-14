import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, Wallet, FileText, Receipt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function FinancialsDashboardPage() {
  const { companyId } = useAuth()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    accounts: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchStats()
    }
  }, [companyId])

  const fetchStats = async () => {
    try {
      const [salesRes, purchaseRes, accountsRes] = await Promise.all([
        supabase.from('sales_invoices').select('total_amount').eq('company_id', companyId!),
        supabase.from('purchase_invoices').select('total_amount').eq('company_id', companyId!),
        supabase.from('chart_of_accounts').select('id', { count: 'exact' }).eq('company_id', companyId!),
      ])

      const sales = salesRes.data || []
      const purchases = purchaseRes.data || []
      const totalRevenue = sales.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount?.toString() || '0'), 0)
      const totalExpenses = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_amount?.toString() || '0'), 0)
      const netProfit = totalRevenue - totalExpenses
      const accounts = accountsRes.count || 0

      setStats({ totalRevenue, totalExpenses, netProfit, accounts })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            Financials Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor financial performance and accounting operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Income
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">${stats.totalExpenses.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              Outgoing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${stats.netProfit.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Profit/Loss</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chart of Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.accounts}</div>
            <p className="text-sm text-muted-foreground mt-1">Total accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/financials/chart-of-accounts">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="w-4 h-4 mr-2" />
                Chart of Accounts
              </Button>
            </Link>
            <Link to="/erp/financials/journal-voucher">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Journal Voucher
              </Button>
            </Link>
            <Link to="/erp/financials/bank-payment">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                Bank Payment
              </Button>
            </Link>
            <Link to="/erp/financials/trial-balance">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Trial Balance
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/financials/balance-sheet">
              <Button variant="outline" className="w-full justify-start">
                Balance Sheet
              </Button>
            </Link>
            <Link to="/erp/financials/profit-loss">
              <Button variant="outline" className="w-full justify-start">
                Profit & Loss
              </Button>
            </Link>
            <Link to="/erp/financials/cash-flow">
              <Button variant="outline" className="w-full justify-start">
                Cash Flow Statement
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
