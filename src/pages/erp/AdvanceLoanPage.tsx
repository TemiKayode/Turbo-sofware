import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, DollarSign, FileText } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface AdvanceLoan {
  id: string
  loan_no: string
  employee_id: string
  loan_date: string
  loan_amount: number
  installment_amount: number
  total_installments: number
  paid_installments: number
  balance_amount: number
  status: string
  employees?: { first_name: string; last_name: string; employee_code: string }
}

export function AdvanceLoanPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: '',
    loan_date: format(new Date(), 'yyyy-MM-dd'),
    loan_amount: '',
    installment_amount: '',
    total_installments: '',
  })

  const { data: loans = [], isLoading, refetch } = useSupabaseQuery<AdvanceLoan>(
    ['advance_loans', companyId!],
    'advance_loans',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, employees(first_name, last_name, employee_code)')
          .order('loan_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: employees = [] } = useSupabaseQuery<any>(
    ['employees', companyId!],
    'employees',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('employee_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createLoan } = useSupabaseMutation('advance_loans', {
    onSuccess: () => {
      toast('Advance loan created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create advance loan', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      employee_id: '',
      loan_date: format(new Date(), 'yyyy-MM-dd'),
      loan_amount: '',
      installment_amount: '',
      total_installments: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    const loanNo = `AL-${Date.now()}`
    const loanAmount = parseFloat(formData.loan_amount)
    const installmentAmount = parseFloat(formData.installment_amount)
    const totalInstallments = parseInt(formData.total_installments)

    const payload = {
      company_id: companyId,
      loan_no: loanNo,
      employee_id: formData.employee_id,
      loan_date: formData.loan_date,
      loan_amount: loanAmount,
      installment_amount: installmentAmount,
      total_installments: totalInstallments,
      paid_installments: 0,
      balance_amount: loanAmount,
      status: 'active',
      created_by: user.id,
    }

    createLoan({ data: payload, method: 'POST' })
  }

  const columns = [
    {
      accessorKey: 'loan_no',
      header: 'Loan No',
    },
    {
      accessorKey: 'employees.employee_code',
      header: 'Employee',
      cell: ({ row }: any) => {
        const emp = row.original.employees
        return emp ? `${emp.employee_code} - ${emp.first_name} ${emp.last_name}` : '-'
      },
    },
    {
      accessorKey: 'loan_date',
      header: 'Loan Date',
      cell: ({ row }: any) => format(new Date(row.original.loan_date), 'PP'),
    },
    {
      accessorKey: 'loan_amount',
      header: 'Loan Amount',
      cell: ({ row }: any) => `$${row.original.loan_amount.toFixed(2)}`,
    },
    {
      accessorKey: 'balance_amount',
      header: 'Balance',
      cell: ({ row }: any) => (
        <span className={row.original.balance_amount > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
          ${row.original.balance_amount.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={
          row.original.status === 'completed' ? 'bg-green-100 text-green-800' :
          row.original.status === 'active' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advance & Loan</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Loan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Advance Loan</DialogTitle>
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
                <Label>Loan Date *</Label>
                <Input
                  type="date"
                  value={formData.loan_date}
                  onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Loan Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Installment Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.installment_amount}
                  onChange={(e) => setFormData({ ...formData, installment_amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Total Installments *</Label>
                <Input
                  type="number"
                  value={formData.total_installments}
                  onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Create Loan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advance Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={loans} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

