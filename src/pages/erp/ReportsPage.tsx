import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { FileText, Download } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Report {
  id: string
  name: string
  category: string
  description: string
  icon: React.ElementType
}

const reportCategories = [
  {
    id: 'cash-sales',
    name: 'Cash Sales Reports',
    reports: [
      { id: 'cash-sales', name: 'Cash Sales', description: 'Detailed cash sales report' },
      { id: 'cash-sales-return', name: 'Cash Sales Return', description: 'Cash sales return report' },
      { id: 'net-cash-sales', name: 'Net Cash Sales', description: 'Net cash sales after returns' },
      { id: 'cash-sales-profit', name: 'Cash Sales Profit Analysis', description: 'Profit analysis for cash sales' },
      { id: 'datewise-cash-sales', name: 'Date-wise Cash Sales Summary', description: 'Daily cash sales summary' },
      { id: 'monthwise-cash-sales', name: 'Month-wise Cash Sales Summary', description: 'Monthly cash sales summary' },
      { id: 'cashier-reports', name: 'Cashier Reports', description: 'Cashier-wise sales reports' },
      { id: 'cash-book', name: 'Cash Book', description: 'Complete cash book' },
    ],
  },
  {
    id: 'credit-sales',
    name: 'Credit Sales Reports',
    reports: [
      { id: 'credit-sales', name: 'Credit Sales', description: 'Detailed credit sales report' },
      { id: 'credit-sales-return', name: 'Credit Sales Return', description: 'Credit sales return report' },
      { id: 'net-credit-sales', name: 'Net Credit Sales', description: 'Net credit sales after returns' },
      { id: 'credit-sales-profit', name: 'Credit Sales Profit Analysis', description: 'Profit analysis for credit sales' },
      { id: 'datewise-credit-sales', name: 'Date-wise Credit Sales Summary', description: 'Daily credit sales summary' },
      { id: 'monthwise-credit-sales', name: 'Month-wise Credit Sales Summary', description: 'Monthly credit sales summary' },
    ],
  },
  {
    id: 'export-sales',
    name: 'Export Sales',
    reports: [
      { id: 'export-sales', name: 'Export Sales Report', description: 'Complete export sales report' },
    ],
  },
  {
    id: 'financial',
    name: 'Financial Reports',
    reports: [
      { id: 'financial-reports', name: 'Financial Reports', description: 'General financial reports' },
      { id: 'accounts-receivable', name: 'Accounts Receivable', description: 'Outstanding receivables report' },
      { id: 'accounts-payable', name: 'Accounts Payable', description: 'Outstanding payables report' },
      { id: 'employee-balance', name: 'Employee Balance Report', description: 'Employee balances' },
      { id: 'statement-of-account', name: 'Statement of Account', description: 'Customer/Supplier statements' },
    ],
  },
  {
    id: 'financial-statements',
    name: 'Financial Statements',
    reports: [
      { id: 'profit-loss', name: 'Profit and Loss A/c', description: 'P&L statement' },
      { id: 'balance-sheet', name: 'Balance Sheet', description: 'Balance sheet report' },
      { id: 'balance-sheet-horizontal', name: 'Balance Sheet (Horizontal)', description: 'Horizontal balance sheet' },
      { id: 'trial-balance-date', name: 'Trial Balance (as On Date)', description: 'Trial balance for specific date' },
      { id: 'trial-balance-movement', name: 'Trial Balance (Movement)', description: 'Trial balance movement' },
      { id: 'trial-balance-monthly', name: 'Trial Balance (Monthly)', description: 'Monthly trial balance' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory Reports',
    reports: [
      { id: 'item-barcode', name: 'Item Barcode', description: 'Barcode labels for items' },
      { id: 'stock-register', name: 'Stock Register', description: 'Complete stock register' },
    ],
  },
  {
    id: 'operation',
    name: 'Operation Reports',
    reports: [
      { id: 'daily-operation', name: 'Daily Operation Report', description: 'Daily operations summary' },
      { id: 'daily-sales', name: 'Daily Sales Report', description: 'Daily sales summary' },
      { id: 'salesman-wise', name: 'Salesman Wise Sales', description: 'Sales by salesman' },
      { id: 'daily-item-sales', name: 'Daily Item Sales Ledger', description: 'Daily item-wise sales' },
      { id: 'daily-item-purchase', name: 'Daily Item Purchase Ledger', description: 'Daily item-wise purchases' },
      { id: 'salesman-report', name: 'Salesman wise Report', description: 'Detailed salesman report' },
      { id: 'itemwise-profit', name: 'Itemwise Sales Profit Analysis Report', description: 'Item-wise profit analysis' },
      { id: 'under-cost-sales', name: 'Under Cost Sales Ledger', description: 'Sales below cost' },
      { id: 'sales-analysis', name: 'Sales Analysis', description: 'Comprehensive sales analysis' },
      { id: 'voucher-entries', name: 'Voucher Entries', description: 'All voucher entries' },
    ],
  },
]

export function ReportsPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const handleGenerateReport = async (reportId: string) => {
    setSelectedReport(reportId)
    // This would call a Supabase function or query to generate the report
    // For now, we'll show a placeholder
    toast('Report generation started', 'default')
  }

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!selectedReport) {
      toast('Please select a report first', 'error')
      return
    }
    toast(`Exporting report as ${format.toUpperCase()}...`, 'default')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
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
          {selectedReport && (
            <>
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cash-sales" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  {reportCategories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className="justify-start">
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {reportCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id}>
                    <div className="space-y-2">
                      {category.reports.map((report) => (
                        <Button
                          key={report.id}
                          variant={selectedReport === report.id ? 'default' : 'outline'}
                          className="w-full justify-start"
                          onClick={() => handleGenerateReport(report.id)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {report.name}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedReport
                  ? reportCategories
                      .flatMap((c) => c.reports)
                      .find((r) => r.id === selectedReport)?.name || 'Report'
                  : 'Select a Report'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedReport ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    {reportCategories
                      .flatMap((c) => c.reports)
                      .find((r) => r.id === selectedReport)?.description}
                  </div>
                  <div className="border rounded-lg p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Report data will be displayed here</p>
                    <p className="text-sm mt-2">Date Range: {format(new Date(startDate), 'PP')} to {format(new Date(endDate), 'PP')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Select a report from the categories to view</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
