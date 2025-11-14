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

interface ItemType {
  id: string
  name: string
  description: string | null
}

export function ItemTypeMasterPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ItemType | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const { data: itemTypes = [], isLoading, refetch } = useSupabaseQuery<ItemType>(
    ['item_types', companyId!],
    'item_types',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createType } = useSupabaseMutation('item_types', {
    onSuccess: () => {
      toast('Item Type created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create item type', 'error')
    },
  })

  const { mutate: updateType } = useSupabaseMutation('item_types', {
    onSuccess: () => {
      toast('Item Type updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update item type', 'error')
    },
  })

  const { mutate: deleteType } = useSupabaseMutation('item_types', {
    onSuccess: () => {
      toast('Item Type deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete item type', 'error')
    },
  })

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditingType(null)
  }

  const handleEdit = (type: ItemType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item type?')) {
      deleteType({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      name: formData.name,
      description: formData.description || null,
    }

    if (editingType) {
      updateType({ id: editingType.id, data: payload, method: 'PATCH' })
    } else {
      createType({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Item Type Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Item Type Master</h1>
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
              Add Item Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Item Type' : 'Add New Item Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Type Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={itemTypes} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

