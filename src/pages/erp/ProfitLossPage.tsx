import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { exportToCSV } from '@/lib/exportUtils'

export function ProfitLossPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    revenue: 0,
    expenses: 0,
    grossProfit: 0,
    netProfit: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchProfitLoss()
    }
  }, [companyId, startDate, endDate])

  const fetchProfitLoss = async () => {
    if (!companyId) return
    setLoading(true)

    try {
      // Fetch revenue from sales invoices and cash sales
      const [salesInvoices, cashSales] = await Promise.all([
        supabase
          .from('sales_invoices')
          .select('total_amount')
          .eq('company_id', companyId)
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate)
          .eq('status', 'posted'),
        supabase
          .from('cash_sales')
          .select('total_amount')
          .eq('company_id', companyId)
          .gte('sale_date', startDate)
          .lte('sale_date', endDate)
          .eq('status', 'posted'),
      ])

      // Fetch expenses from purchase invoices, bank payments, and cash payments
      const [purchaseInvoices, bankPayments, cashPayments] = await Promise.all([
        supabase
          .from('purchase_invoices')
          .select('total_amount')
          .eq('company_id', companyId)
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate)
          .eq('status', 'posted'),
        supabase
          .from('bank_payments')
          .select('amount')
          .eq('company_id', companyId)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate),
        supabase
          .from('cash_payments')
          .select('amount')
          .eq('company_id', companyId)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate),
      ])

      const salesRevenue = salesInvoices.data?.reduce((sum, inv) => sum + parseFloat(inv.total_amount?.toString() || '0'), 0) || 0
      const cashRevenue = cashSales.data?.reduce((sum, sale) => sum + parseFloat(sale.total_amount?.toString() || '0'), 0) || 0
      const revenue = salesRevenue + cashRevenue

      const purchaseExpenses = purchaseInvoices.data?.reduce((sum, inv) => sum + parseFloat(inv.total_amount?.toString() || '0'), 0) || 0
      const bankExpenses = bankPayments.data?.reduce((sum, pay) => sum + parseFloat(pay.amount?.toString() || '0'), 0) || 0
      const cashExpenses = cashPayments.data?.reduce((sum, pay) => sum + parseFloat(pay.amount?.toString() || '0'), 0) || 0
      const expenses = purchaseExpenses + bankExpenses + cashExpenses

      const grossProfit = revenue - purchaseExpenses
      const netProfit = revenue - expenses

      setData({ revenue, expenses, grossProfit, netProfit })
    } catch (error: any) {
      console.error('Error fetching profit & loss:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const exportData = [
      { Item: 'Revenue', Amount: `$${data.revenue.toLocaleString()}` },
      { Item: 'Expenses', Amount: `$${data.expenses.toLocaleString()}` },
      { Item: 'Gross Profit', Amount: `$${data.grossProfit.toLocaleString()}` },
      { Item: 'Net Profit', Amount: `$${data.netProfit.toLocaleString()}` },
    ]
    exportToCSV(exportData, 'profit_loss_statement', ['Item', 'Amount'])
    toast('Profit & Loss statement exported', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            Profit & Loss Statement
          </h1>
          <p className="text-gray-600 mt-1">Financial performance for a period</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span className="self-center">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Profit & Loss Statement ({format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="font-semibold">Revenue</span>
                <span className="font-semibold text-emerald-600">${data.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Expenses</span>
                <span className="font-semibold text-red-600">${data.expenses.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Gross Profit</span>
                <span className="font-semibold">${data.grossProfit.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Net Profit</span>
                <span className={data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  ${data.netProfit.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
