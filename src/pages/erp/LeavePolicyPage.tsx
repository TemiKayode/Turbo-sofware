import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface LeavePolicy {
  id: string
  policy_name: string
  leave_category_id: string
  applicable_to: string
  min_service_days: number | null
  max_leave_days: number | null
  is_active: boolean
  leave_categories?: { category_name: string }
}

export function LeavePolicyPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null)

  const [formData, setFormData] = useState({
    policy_name: '',
    leave_category_id: '',
    applicable_to: 'all',
    min_service_days: '',
    max_leave_days: '',
  })

  const { data: policies = [], isLoading, refetch } = useSupabaseQuery<LeavePolicy>(
    ['leave_policies', companyId!],
    'leave_policies',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, leave_categories(category_name)')
          .order('policy_name'),
      enabled: !!companyId,
    }
  )

  const { data: leaveCategories = [] } = useSupabaseQuery<any>(
    ['leave_categories', companyId!],
    'leave_categories',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: createPolicy } = useSupabaseMutation('leave_policies', {
    onSuccess: () => {
      toast('Leave policy created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create leave policy', 'error')
    },
  })

  const { mutate: updatePolicy } = useSupabaseMutation('leave_policies', {
    onSuccess: () => {
      toast('Leave policy updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update leave policy', 'error')
    },
  })

  const { mutate: deletePolicy } = useSupabaseMutation('leave_policies', {
    onSuccess: () => {
      toast('Leave policy deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete leave policy', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      policy_name: '',
      leave_category_id: '',
      applicable_to: 'all',
      min_service_days: '',
      max_leave_days: '',
    })
    setEditingPolicy(null)
  }

  const handleEdit = (policy: LeavePolicy) => {
    setEditingPolicy(policy)
    setFormData({
      policy_name: policy.policy_name,
      leave_category_id: policy.leave_category_id,
      applicable_to: policy.applicable_to,
      min_service_days: policy.min_service_days?.toString() || '',
      max_leave_days: policy.max_leave_days?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this leave policy?')) {
      deletePolicy({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      policy_name: formData.policy_name,
      leave_category_id: formData.leave_category_id,
      applicable_to: formData.applicable_to,
      min_service_days: formData.min_service_days ? parseInt(formData.min_service_days) : null,
      max_leave_days: formData.max_leave_days ? parseInt(formData.max_leave_days) : null,
      is_active: true,
    }

    if (editingPolicy) {
      updatePolicy({ id: editingPolicy.id, data: payload, method: 'PATCH' })
    } else {
      createPolicy({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'policy_name',
      header: 'Policy Name',
    },
    {
      accessorKey: 'leave_categories.category_name',
      header: 'Leave Category',
      cell: ({ row }: any) => row.original.leave_categories?.category_name || '-',
    },
    {
      accessorKey: 'applicable_to',
      header: 'Applicable To',
    },
    {
      accessorKey: 'min_service_days',
      header: 'Min Service Days',
      cell: ({ row }: any) => row.original.min_service_days || '-',
    },
    {
      accessorKey: 'max_leave_days',
      header: 'Max Leave Days',
      cell: ({ row }: any) => row.original.max_leave_days || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Policy</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Policy Name *</Label>
                <Input
                  value={formData.policy_name}
                  onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Leave Category *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.leave_category_id}
                  onChange={(e) => setFormData({ ...formData, leave_category_id: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {leaveCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Applicable To *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.applicable_to}
                  onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value })}
                  required
                >
                  <option value="all">All Employees</option>
                  <option value="department">Department</option>
                  <option value="designation">Designation</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Service Days</Label>
                  <Input
                    type="number"
                    value={formData.min_service_days}
                    onChange={(e) => setFormData({ ...formData, min_service_days: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Max Leave Days</Label>
                  <Input
                    type="number"
                    value={formData.max_leave_days}
                    onChange={(e) => setFormData({ ...formData, max_leave_days: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  {editingPolicy ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={policies} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

