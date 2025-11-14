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

interface Deduction {
  id: string
  deduction_code: string
  deduction_name: string
  deduction_type: string
  amount: number | null
  percent: number | null
  is_active: boolean
}

export function DeductionPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null)

  const [formData, setFormData] = useState({
    deduction_code: '',
    deduction_name: '',
    deduction_type: 'fixed',
    amount: '',
    percent: '',
  })

  const { data: deductions = [], isLoading, refetch } = useSupabaseQuery<Deduction>(
    ['deductions', companyId!],
    'deductions',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('deduction_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createDeduction } = useSupabaseMutation('deductions', {
    onSuccess: () => {
      toast('Deduction created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create deduction', 'error')
    },
  })

  const { mutate: updateDeduction } = useSupabaseMutation('deductions', {
    onSuccess: () => {
      toast('Deduction updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update deduction', 'error')
    },
  })

  const { mutate: deleteDeduction } = useSupabaseMutation('deductions', {
    onSuccess: () => {
      toast('Deduction deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete deduction', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      deduction_code: '',
      deduction_name: '',
      deduction_type: 'fixed',
      amount: '',
      percent: '',
    })
    setEditingDeduction(null)
  }

  const handleEdit = (deduction: Deduction) => {
    setEditingDeduction(deduction)
    setFormData({
      deduction_code: deduction.deduction_code,
      deduction_name: deduction.deduction_name,
      deduction_type: deduction.deduction_type,
      amount: deduction.amount?.toString() || '',
      percent: deduction.percent?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deduction?')) {
      deleteDeduction({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      deduction_code: formData.deduction_code,
      deduction_name: formData.deduction_name,
      deduction_type: formData.deduction_type,
      amount: formData.deduction_type === 'fixed' && formData.amount ? parseFloat(formData.amount) : null,
      percent: formData.deduction_type === 'percent' && formData.percent ? parseFloat(formData.percent) : null,
      is_active: true,
    }

    if (editingDeduction) {
      updateDeduction({ id: editingDeduction.id, data: payload, method: 'PATCH' })
    } else {
      createDeduction({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'deduction_code',
      header: 'Code',
    },
    {
      accessorKey: 'deduction_name',
      header: 'Deduction Name',
    },
    {
      accessorKey: 'deduction_type',
      header: 'Type',
      cell: ({ row }: any) => row.original.deduction_type === 'fixed' ? 'Fixed' : 'Percentage',
    },
    {
      accessorKey: 'amount',
      header: 'Amount/Percent',
      cell: ({ row }: any) => {
        if (row.original.deduction_type === 'fixed') {
          return row.original.amount ? `$${row.original.amount.toFixed(2)}` : '-'
        }
        return row.original.percent ? `${row.original.percent}%` : '-'
      },
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deductions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Deduction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDeduction ? 'Edit Deduction' : 'Add New Deduction'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Deduction Code *</Label>
                <Input
                  value={formData.deduction_code}
                  onChange={(e) => setFormData({ ...formData, deduction_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Deduction Name *</Label>
                <Input
                  value={formData.deduction_name}
                  onChange={(e) => setFormData({ ...formData, deduction_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Deduction Type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.deduction_type}
                  onChange={(e) => setFormData({ ...formData, deduction_type: e.target.value })}
                  required
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>
              {formData.deduction_type === 'fixed' ? (
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label>Percentage *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.percent}
                    onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  {editingDeduction ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={deductions} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

