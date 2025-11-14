import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'

interface Employee {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  date_of_joining: string | null
  department_id: string | null
  designation: string | null
  salary: number
  is_active: boolean
  departments?: { department_name: string }
}

export function EmployeesPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    date_of_joining: '',
    department_id: '',
    designation: '',
    salary: '',
  })

  const { data: employees = [], isLoading, refetch } = useSupabaseQuery<Employee>(
    ['employees', companyId!],
    'employees',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, departments(department_name)')
          .order('employee_code'),
      enabled: !!companyId,
    }
  )

  const { data: departments = [] } = useSupabaseQuery<any>(
    ['departments', companyId!],
    'departments',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const mutation = useSupabaseMutation<Employee>('employees', [['employees', companyId!]])

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || '',
        phone: employee.phone || '',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        date_of_joining: employee.date_of_joining ? employee.date_of_joining.split('T')[0] : '',
        department_id: employee.department_id || '',
        designation: employee.designation || '',
        salary: employee.salary.toString(),
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        employee_code: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        date_of_joining: '',
        department_id: '',
        designation: '',
        salary: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const payload = {
        company_id: companyId,
        employee_code: formData.employee_code,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        date_of_joining: formData.date_of_joining || null,
        department_id: formData.department_id || null,
        designation: formData.designation || null,
        salary: parseFloat(formData.salary) || 0,
      }

      if (editingEmployee) {
        await mutation.mutateAsync({
          type: 'update',
          id: editingEmployee.id,
          payload,
        })
        toast('Employee updated successfully', 'success')
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
        toast('Employee created successfully', 'success')
      }
      setDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to save employee', 'error')
    }
  }

  const columns = [
    { header: 'Code', accessor: 'employee_code' as keyof Employee },
    {
      header: 'Name',
      accessor: (row: Employee) => `${row.first_name} ${row.last_name}`,
    },
    { header: 'Email', accessor: 'email' as keyof Employee },
    { header: 'Phone', accessor: 'phone' as keyof Employee },
    {
      header: 'Department',
      accessor: (row: Employee) => row.departments?.department_name || 'N/A',
    },
    { header: 'Designation', accessor: 'designation' as keyof Employee },
    {
      header: 'Salary',
      accessor: (row: Employee) => `$${row.salary.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (row: Employee) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees Master</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>Create Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Create New Employee'}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? 'Update employee information' : 'Add a new employee to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_code">Employee Code *</Label>
                  <Input
                    id="employee_code"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_joining">Date of Joining</Label>
                  <Input
                    id="date_of_joining"
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="department_id">Department</Label>
                  <Select
                    value={formData.department_id || undefined}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={employees}
        columns={columns}
        searchable
        searchPlaceholder="Search employees..."
        loading={isLoading}
        actions={(employee) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(employee)}>
              Edit
            </Button>
          </div>
        )}
      />
    </div>
  )
}
