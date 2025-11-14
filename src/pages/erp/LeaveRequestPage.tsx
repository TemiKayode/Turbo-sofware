import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, Search, Download, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { useToast } from '@/components/ui/toaster'
import { DataTable } from '@/components/DataTable'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportTableToCSV } from '@/lib/exportUtils'

export function LeaveRequestPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_category_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  })

  const { data: leaveRequests = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['leave_requests', companyId!],
    'leave_requests',
    {
      filters: (query) => query.eq('company_id', companyId!).order('created_at', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: employees = [] } = useSupabaseQuery<any>(
    ['employees', companyId!],
    'employees',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('first_name'),
      enabled: !!companyId,
    }
  )

  const { data: leaveCategories = [] } = useSupabaseQuery<any>(
    ['leave_categories', companyId!],
    'leave_categories',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('category_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createRequest } = useSupabaseMutation('leave_requests', {
    onSuccess: () => {
      toast('Leave request created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create leave request', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_category_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      createRequest({
        type: 'insert',
        payload: {
          company_id: companyId,
          employee_id: formData.employee_id,
          leave_category_id: formData.leave_category_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_days: diffDays,
          reason: formData.reason || null,
          status: 'pending',
          requested_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create leave request', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'Employee', accessor: (row: any) => row.employee_name || 'N/A' },
      { header: 'Leave Type', accessor: (row: any) => row.leave_type || 'N/A' },
      { header: 'Start Date', accessor: (row: any) => row.start_date ? format(new Date(row.start_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'End Date', accessor: (row: any) => row.end_date ? format(new Date(row.end_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Days', accessor: (row: any) => row.total_days || '0' },
      { header: 'Status', accessor: (row: any) => row.status || 'pending' },
    ]
    exportTableToCSV(columns, leaveRequests, 'leave_requests')
    toast('Leave requests exported', 'success')
  }

  const filteredRequests = leaveRequests.filter((req: any) =>
    req.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    req.leave_type?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = leaveRequests.filter((req: any) => req.status === 'pending').length
  const approvedCount = leaveRequests.filter((req: any) => req.status === 'approved').length

  const columns = [
    { header: 'Employee', accessor: (row: any) => row.employee_name || 'N/A' },
    { header: 'Leave Type', accessor: (row: any) => row.leave_type || 'N/A' },
    { header: 'Start Date', accessor: (row: any) => row.start_date ? format(new Date(row.start_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'End Date', accessor: (row: any) => row.end_date ? format(new Date(row.end_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Days', accessor: (row: any) => row.total_days || '0' },
    { header: 'Status', accessor: (row: any) => {
      const status = row.status || 'pending'
      const variants: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
        approved: 'success',
        rejected: 'destructive',
        pending: 'secondary',
      }
      return <Badge variant={variants[status] || 'default'}>{status}</Badge>
    }},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            Leave Requests
          </h1>
          <p className="text-gray-600 mt-1">Manage employee leave requests and approvals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="employee_id">Employee *</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })} required>
                  <SelectTrigger id="employee_id">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leave_category_id">Leave Category *</Label>
                <Select value={formData.leave_category_id} onValueChange={(value) => setFormData({ ...formData, leave_category_id: value })} required>
                  <SelectTrigger id="leave_category_id">
                    <SelectValue placeholder="Select leave category" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveCategories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for leave"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Request</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{leaveRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Leave Requests</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
