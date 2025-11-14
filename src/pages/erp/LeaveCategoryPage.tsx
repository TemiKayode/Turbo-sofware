import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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

interface LeaveCategory {
  id: string
  category_code: string
  category_name: string
  max_days: number
  carry_forward: boolean
  is_active: boolean
}

export function LeaveCategoryPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LeaveCategory | null>(null)

  const [formData, setFormData] = useState({
    category_code: '',
    category_name: '',
    max_days: '',
    carry_forward: false,
  })

  const { data: categories = [], isLoading, refetch } = useSupabaseQuery<LeaveCategory>(
    ['leave_categories', companyId!],
    'leave_categories',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('category_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createCategory } = useSupabaseMutation('leave_categories', {
    onSuccess: () => {
      toast('Leave category created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create leave category', 'error')
    },
  })

  const { mutate: updateCategory } = useSupabaseMutation('leave_categories', {
    onSuccess: () => {
      toast('Leave category updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update leave category', 'error')
    },
  })

  const { mutate: deleteCategory } = useSupabaseMutation('leave_categories', {
    onSuccess: () => {
      toast('Leave category deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete leave category', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      category_code: '',
      category_name: '',
      max_days: '',
      carry_forward: false,
    })
    setEditingCategory(null)
  }

  const handleEdit = (category: LeaveCategory) => {
    setEditingCategory(category)
    setFormData({
      category_code: category.category_code,
      category_name: category.category_name,
      max_days: category.max_days.toString(),
      carry_forward: category.carry_forward,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this leave category?')) {
      deleteCategory({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      category_code: formData.category_code,
      category_name: formData.category_name,
      max_days: parseInt(formData.max_days),
      carry_forward: formData.carry_forward,
      is_active: true,
    }

    if (editingCategory) {
      updateCategory({ id: editingCategory.id, data: payload, method: 'PATCH' })
    } else {
      createCategory({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'category_code',
      header: 'Category Code',
    },
    {
      accessorKey: 'category_name',
      header: 'Category Name',
    },
    {
      accessorKey: 'max_days',
      header: 'Max Days',
    },
    {
      accessorKey: 'carry_forward',
      header: 'Carry Forward',
      cell: ({ row }: any) => row.original.carry_forward ? 'Yes' : 'No',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={row.original.is_active ? 'text-green-600' : 'text-gray-400'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Category</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Leave Category' : 'Add New Leave Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category Code *</Label>
                <Input
                  value={formData.category_code}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Max Days *</Label>
                <Input
                  type="number"
                  value={formData.max_days}
                  onChange={(e) => setFormData({ ...formData, max_days: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="carry_forward"
                  checked={formData.carry_forward}
                  onChange={(e) => setFormData({ ...formData, carry_forward: e.target.checked })}
                  className="w-4 h-4 text-[#2CA01C] border-gray-300 rounded"
                />
                <Label htmlFor="carry_forward" className="ml-2">
                  Allow Carry Forward
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={categories} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

