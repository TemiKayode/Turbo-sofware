import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus, Search, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { DataTable } from '@/components/DataTable'
import { format } from 'date-fns'

export function PayrollPage() {
  const { companyId } = useAuth()
  const [search, setSearch] = useState('')
  const [payPeriod, setPayPeriod] = useState(format(new Date(), 'yyyy-MM'))

  const { data: payrolls = [], isLoading } = useSupabaseQuery<any>(
    ['payroll', companyId!, payPeriod],
    'payroll',
    {
      filters: (query) => {
        const startDate = `${payPeriod}-01`
        const endDate = `${payPeriod}-31`
        return query
          .eq('company_id', companyId!)
          .gte('payroll_month', startDate)
          .lte('payroll_month', endDate)
          .order('payroll_month', { ascending: false })
      },
      enabled: !!companyId,
    }
  )

  const filteredPayrolls = payrolls.filter((pay: any) =>
    pay.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    pay.employee_id?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPayroll = payrolls.reduce((sum: number, p: any) => sum + parseFloat(p.net_pay?.toString() || '0'), 0)

  const columns = [
    { header: 'Employee', accessor: (row: any) => row.employee_name || 'N/A' },
    { header: 'Employee ID', accessor: (row: any) => row.employee_id || 'N/A' },
    { header: 'Basic Salary', accessor: (row: any) => `$${parseFloat(row.basic_salary?.toString() || '0').toFixed(2)}` },
    { header: 'Allowances', accessor: (row: any) => `$${parseFloat(row.allowances?.toString() || '0').toFixed(2)}` },
    { header: 'Deductions', accessor: (row: any) => `$${parseFloat(row.deductions?.toString() || '0').toFixed(2)}` },
    { header: 'Net Pay', accessor: (row: any) => `$${parseFloat(row.net_pay?.toString() || '0').toFixed(2)}` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-pink-600" />
            Payroll
          </h1>
          <p className="text-gray-600 mt-1">Process and manage employee payroll</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Process Payroll
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{payrolls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${totalPayroll.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pay Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="month"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payroll Records</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPayrolls}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
