import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { useToast } from '@/components/ui/toaster'
import { DataTable } from '@/components/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

export function DepartmentsPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    department_code: '',
    department_name: '',
    parent_id: '',
    manager_id: '',
  })

  const { data: departments = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['departments', companyId!],
    'departments',
    {
      filters: (query) => query.eq('company_id', companyId!).order('department_name'),
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

  const { mutate: createDepartment } = useSupabaseMutation('departments', {
    onSuccess: () => {
      toast('Department created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create department', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      department_code: '',
      department_name: '',
      parent_id: '',
      manager_id: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      // Generate department code if not provided
      let deptCode = formData.department_code
      if (!deptCode) {
        const { count } = await supabase
          .from('departments')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        deptCode = `DEPT-${String((count || 0) + 1).padStart(4, '0')}`
      }

      createDepartment({
        data: {
          company_id: companyId,
          department_code: deptCode,
          department_name: formData.department_name,
          parent_id: formData.parent_id || null,
          manager_id: formData.manager_id || null,
          is_active: true,
        },
        method: 'POST',
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create department', 'error')
    }
  }

  const filteredDepartments = departments.filter((dept: any) =>
    dept.department_name?.toLowerCase().includes(search.toLowerCase()) ||
    dept.department_code?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Department Name', accessor: (row: any) => row.department_name || 'N/A' },
    { header: 'Code', accessor: (row: any) => row.department_code || 'N/A' },
    { header: 'Head', accessor: (row: any) => row.department_head || 'N/A' },
    { header: 'Employees', accessor: (row: any) => row.employee_count || '0' },
    { header: 'Status', accessor: (row: any) => row.is_active ? 'Active' : 'Inactive' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            Departments
          </h1>
          <p className="text-gray-600 mt-1">Manage organizational departments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department_code">Department Code</Label>
                  <Input
                    id="department_code"
                    value={formData.department_code}
                    onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="department_name">Department Name *</Label>
                  <Input
                    id="department_name"
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="parent_id">Parent Department</Label>
                <Select value={formData.parent_id || undefined} onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}>
                  <SelectTrigger id="parent_id">
                    <SelectValue placeholder="Select parent department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manager_id">Manager</Label>
                <Select value={formData.manager_id || undefined} onValueChange={(value) => setFormData({ ...formData, manager_id: value === 'none' ? '' : value })}>
                  <SelectTrigger id="manager_id">
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.user_id || emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Department</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Departments ({departments.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search departments..."
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
            data={filteredDepartments}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
