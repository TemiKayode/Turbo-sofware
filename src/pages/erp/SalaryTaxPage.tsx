import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Calculator } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SalaryTax {
  id: string
  employee_id: string
  financial_year_id: string
  taxable_income: number
  tax_amount: number
  employees?: { first_name: string; last_name: string; employee_code: string }
  financial_years?: { year_name: string }
}

export function SalaryTaxPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: '',
    financial_year_id: '',
    taxable_income: '',
  })

  const { data: salaryTaxes = [], isLoading, refetch } = useSupabaseQuery<SalaryTax>(
    ['salary_tax', companyId!],
    'salary_tax',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, employees(first_name, last_name, employee_code), financial_years(year_name)')
          .order('financial_year_id', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: employees = [] } = useSupabaseQuery<any>(
    ['employees', companyId!],
    'employees',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { data: financialYears = [] } = useSupabaseQuery<any>(
    ['financial_years', companyId!],
    'financial_years',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: calculateTax } = useSupabaseMutation('salary_tax', {
    onSuccess: () => {
      toast('Salary tax calculated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to calculate salary tax', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      employee_id: '',
      financial_year_id: '',
      taxable_income: '',
    })
  }

  const calculateTaxAmount = (taxableIncome: number): number => {
    // Simple tax calculation - can be enhanced with tax brackets
    if (taxableIncome <= 0) return 0
    if (taxableIncome <= 50000) return taxableIncome * 0.05
    if (taxableIncome <= 100000) return 2500 + (taxableIncome - 50000) * 0.10
    if (taxableIncome <= 200000) return 7500 + (taxableIncome - 100000) * 0.15
    return 22500 + (taxableIncome - 200000) * 0.20
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    const taxableIncome = parseFloat(formData.taxable_income)
    const taxAmount = calculateTaxAmount(taxableIncome)

    const payload = {
      company_id: companyId,
      employee_id: formData.employee_id,
      financial_year_id: formData.financial_year_id,
      taxable_income: taxableIncome,
      tax_amount: taxAmount,
      calculated_by: user.id,
    }

    calculateTax({ data: payload, method: 'POST' })
  }

  const columns = [
    {
      accessorKey: 'employees.employee_code',
      header: 'Employee',
      cell: ({ row }: any) => {
        const emp = row.original.employees
        return emp ? `${emp.employee_code} - ${emp.first_name} ${emp.last_name}` : '-'
      },
    },
    {
      accessorKey: 'financial_years.year_name',
      header: 'Financial Year',
      cell: ({ row }: any) => row.original.financial_years?.year_name || '-',
    },
    {
      accessorKey: 'taxable_income',
      header: 'Taxable Income',
      cell: ({ row }: any) => `$${row.original.taxable_income.toFixed(2)}`,
    },
    {
      accessorKey: 'tax_amount',
      header: 'Tax Amount',
      cell: ({ row }: any) => (
        <span className="font-semibold text-red-600">
          ${row.original.tax_amount.toFixed(2)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salary Tax</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Calculate Tax
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Calculate Salary Tax</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Employee *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} - {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Financial Year *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.financial_year_id}
                  onChange={(e) => setFormData({ ...formData, financial_year_id: e.target.value })}
                  required
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((fy: any) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.year_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Taxable Income *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.taxable_income}
                  onChange={(e) => setFormData({ ...formData, taxable_income: e.target.value })}
                  required
                />
              </div>
              {formData.taxable_income && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Tax Amount:</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${calculateTaxAmount(parseFloat(formData.taxable_income)).toFixed(2)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Tax
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Tax Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={salaryTaxes} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

