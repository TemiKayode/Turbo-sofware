import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Brand {
  id: string
  brand_name: string
  description: string | null
  is_active: boolean
}

export function BrandMasterPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    brand_name: '',
    description: '',
  })

  const { data: brands = [], isLoading, refetch } = useSupabaseQuery<Brand>(
    ['brands', companyId!],
    'brands',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('brand_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createBrand } = useSupabaseMutation('brands', {
    onSuccess: () => {
      toast('Brand created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create brand', 'error')
    },
  })

  const { mutate: updateBrand } = useSupabaseMutation('brands', {
    onSuccess: () => {
      toast('Brand updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update brand', 'error')
    },
  })

  const { mutate: deleteBrand } = useSupabaseMutation('brands', {
    onSuccess: () => {
      toast('Brand deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete brand', 'error')
    },
  })

  const resetForm = () => {
    setFormData({ brand_name: '', description: '' })
    setEditingBrand(null)
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      brand_name: brand.brand_name,
      description: brand.description || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      deleteBrand({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      brand_name: formData.brand_name,
      description: formData.description || null,
      is_active: true,
    }

    if (editingBrand) {
      updateBrand({ id: editingBrand.id, data: payload, method: 'PATCH' })
    } else {
      createBrand({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'brand_name',
      header: 'Brand Name',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brand Master</h1>
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
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name *</label>
                <Input
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
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
                  {editingBrand ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={brands} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

