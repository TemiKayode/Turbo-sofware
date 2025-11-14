import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface ItemCategory {
  id: string
  category_code: string
  category_name: string
  description: string | null
  parent_id: string | null
  is_active: boolean
}

export function ItemCategoryPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    category_code: '',
    category_name: '',
    description: '',
    parent_id: '',
  })

  const { data: categories = [], isLoading, refetch } = useSupabaseQuery<ItemCategory>(
    ['item_categories', companyId!],
    'item_categories',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('category_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createCategory } = useSupabaseMutation('item_categories', {
    onSuccess: () => {
      toast('Category created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create category', 'error')
    },
  })

  const { mutate: updateCategory } = useSupabaseMutation('item_categories', {
    onSuccess: () => {
      toast('Category updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update category', 'error')
    },
  })

  const { mutate: deleteCategory } = useSupabaseMutation('item_categories', {
    onSuccess: () => {
      toast('Category deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete category', 'error')
    },
  })

  const resetForm = () => {
    setFormData({ category_code: '', category_name: '', description: '', parent_id: '' })
    setEditingCategory(null)
  }

  const handleEdit = (category: ItemCategory) => {
    setEditingCategory(category)
    setFormData({
      category_code: category.category_code,
      category_name: category.category_name,
      description: category.description || '',
      parent_id: category.parent_id || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
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
      description: formData.description || null,
      parent_id: formData.parent_id || null,
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
      accessorKey: 'description',
      header: 'Description',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Item Category</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setDialogOpen(true)
              }}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Code *</label>
                <Input
                  value={formData.category_code}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <Input
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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

