import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface OtherRequest {
  id: string
  request_no: string
  employee_id: string
  request_type: string
  request_date: string
  description: string
  status: string
  employees?: { first_name: string; last_name: string; employee_code: string }
}

export function OtherRequestPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: '',
    request_type: '',
    request_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  })

  const { data: requests = [], isLoading, refetch } = useSupabaseQuery<OtherRequest>(
    ['other_requests', companyId!],
    'other_requests',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, employees(first_name, last_name, employee_code)')
          .order('request_date', { ascending: false }),
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

  const { mutate: createRequest } = useSupabaseMutation('other_requests', {
    onSuccess: () => {
      toast('Request created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create request', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      employee_id: '',
      request_type: '',
      request_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    const requestNo = `OR-${Date.now()}`
    const payload = {
      company_id: companyId,
      request_no: requestNo,
      employee_id: formData.employee_id,
      request_type: formData.request_type,
      request_date: formData.request_date,
      description: formData.description,
      status: 'pending',
      created_by: user.id,
    }

    createRequest({ data: payload, method: 'POST' })
  }

  const columns = [
    {
      accessorKey: 'request_no',
      header: 'Request No',
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
      accessorKey: 'request_type',
      header: 'Request Type',
    },
    {
      accessorKey: 'request_date',
      header: 'Request Date',
      cell: ({ row }: any) => format(new Date(row.original.request_date), 'PP'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={
          row.original.status === 'approved' ? 'bg-green-100 text-green-800' :
          row.original.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Other Requests</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Request</DialogTitle>
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
                <Label>Request Type *</Label>
                <Input
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                  placeholder="e.g., Advance, Loan, etc."
                  required
                />
              </div>
              <div>
                <Label>Request Date *</Label>
                <Input
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Other Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={requests} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

