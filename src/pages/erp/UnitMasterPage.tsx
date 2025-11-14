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

interface Unit {
  id: string
  unit_code: string
  unit_name: string
  base_unit_id: string | null
  conversion_factor: number
  is_active: boolean
}

export function UnitMasterPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    unit_code: '',
    unit_name: '',
    base_unit_id: '',
    conversion_factor: '1',
  })

  const { data: units = [], isLoading, refetch } = useSupabaseQuery<Unit>(
    ['units', companyId!],
    'units',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('unit_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createUnit } = useSupabaseMutation('units', {
    onSuccess: () => {
      toast('Unit created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create unit', 'error')
    },
  })

  const { mutate: updateUnit } = useSupabaseMutation('units', {
    onSuccess: () => {
      toast('Unit updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update unit', 'error')
    },
  })

  const { mutate: deleteUnit } = useSupabaseMutation('units', {
    onSuccess: () => {
      toast('Unit deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete unit', 'error')
    },
  })

  const resetForm = () => {
    setFormData({ unit_code: '', unit_name: '', base_unit_id: '', conversion_factor: '1' })
    setEditingUnit(null)
  }

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      unit_code: unit.unit_code,
      unit_name: unit.unit_name,
      base_unit_id: unit.base_unit_id || '',
      conversion_factor: unit.conversion_factor.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      deleteUnit({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      unit_code: formData.unit_code,
      unit_name: formData.unit_name,
      base_unit_id: formData.base_unit_id || null,
      conversion_factor: parseFloat(formData.conversion_factor) || 1,
      is_active: true,
    }

    if (editingUnit) {
      updateUnit({ id: editingUnit.id, data: payload, method: 'PATCH' })
    } else {
      createUnit({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'unit_code',
      header: 'Unit Code',
    },
    {
      accessorKey: 'unit_name',
      header: 'Unit Name',
    },
    {
      accessorKey: 'conversion_factor',
      header: 'Conversion Factor',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unit Master</h1>
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
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Unit Code *</label>
                <Input
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Name *</label>
                <Input
                  value={formData.unit_name}
                  onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Conversion Factor</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.conversion_factor}
                  onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  {editingUnit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={units} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

