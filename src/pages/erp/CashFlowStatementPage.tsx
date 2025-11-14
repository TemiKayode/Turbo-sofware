import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CashFlowEntry {
  id: string
  category_id: string
  entry_date: string
  amount: number
  entry_type: string
  cash_flow_categories?: { category_name: string; category_type: string }
}

export function CashFlowStatementPage() {
  const { companyId } = useAuth()
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const { data: cashFlowEntries = [], isLoading } = useSupabaseQuery<CashFlowEntry>(
    ['cash_flow_entries', companyId!, startDate, endDate],
    'cash_flow_entries',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .gte('entry_date', startDate)
          .lte('entry_date', endDate)
          .select('*, cash_flow_categories(category_name, category_type)')
          .order('entry_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  // Calculate cash flow summary
  const operatingActivities = cashFlowEntries
    .filter((e: any) => e.cash_flow_categories?.category_type === 'operating')
    .reduce((sum: number, e: any) => sum + (e.entry_type === 'inflow' ? e.amount : -e.amount), 0)

  const investingActivities = cashFlowEntries
    .filter((e: any) => e.cash_flow_categories?.category_type === 'investing')
    .reduce((sum: number, e: any) => sum + (e.entry_type === 'inflow' ? e.amount : -e.amount), 0)

  const financingActivities = cashFlowEntries
    .filter((e: any) => e.cash_flow_categories?.category_type === 'financing')
    .reduce((sum: number, e: any) => sum + (e.entry_type === 'inflow' ? e.amount : -e.amount), 0)

  const netCashFlow = operatingActivities + investingActivities + financingActivities

  // Prepare chart data
  const chartData = [
    { name: 'Operating', inflow: 0, outflow: 0 },
    { name: 'Investing', inflow: 0, outflow: 0 },
    { name: 'Financing', inflow: 0, outflow: 0 },
  ]

  cashFlowEntries.forEach((entry: any) => {
    const type = entry.cash_flow_categories?.category_type
    if (type === 'operating') {
      if (entry.flow_type === 'inflow') chartData[0].inflow += entry.amount
      else chartData[0].outflow += entry.amount
    } else if (type === 'investing') {
      if (entry.flow_type === 'inflow') chartData[1].inflow += entry.amount
      else chartData[1].outflow += entry.amount
    } else if (type === 'financing') {
      if (entry.flow_type === 'inflow') chartData[2].inflow += entry.amount
      else chartData[2].outflow += entry.amount
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cash Flow Statement</h1>
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Operating Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${operatingActivities >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(operatingActivities).toFixed(2)}
            </div>
            {operatingActivities >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mt-2" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Investing Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${investingActivities >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(investingActivities).toFixed(2)}
            </div>
            {investingActivities >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mt-2" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Financing Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financingActivities >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(financingActivities).toFixed(2)}
            </div>
            {financingActivities >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mt-2" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(netCashFlow).toFixed(2)}
            </div>
            {netCashFlow >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mt-2" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mt-2" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="inflow" fill="#2CA01C" name="Inflow" />
              <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : cashFlowEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No cash flow entries found</div>
          ) : (
            <div className="space-y-4">
              {cashFlowEntries.map((entry: any) => (
                <div key={entry.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{entry.cash_flow_categories?.category_name || 'Uncategorized'}</p>
                    <p className="text-sm text-gray-500">{format(new Date(entry.entry_date), 'PP')}</p>
                  </div>
                  <div className={`text-lg font-semibold ${entry.flow_type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.flow_type === 'inflow' ? '+' : '-'}${entry.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

