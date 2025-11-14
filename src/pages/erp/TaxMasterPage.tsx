import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2, Receipt } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface TaxMaster {
  id: string
  tax_code: string
  tax_name: string
  tax_type: string
  tax_rate: number
  is_active: boolean
}

export function TaxMasterPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<TaxMaster | null>(null)

  const [formData, setFormData] = useState({
    tax_code: '',
    tax_name: '',
    tax_type: 'sales',
    tax_rate: '',
  })

  const { data: taxes = [], isLoading, refetch } = useSupabaseQuery<TaxMaster>(
    ['tax_master', companyId!],
    'tax_master',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('tax_code'),
      enabled: !!companyId,
    }
  )

  const { mutate: createTax } = useSupabaseMutation('tax_master', {
    onSuccess: () => {
      toast('Tax created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create tax', 'error')
    },
  })

  const { mutate: updateTax } = useSupabaseMutation('tax_master', {
    onSuccess: () => {
      toast('Tax updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update tax', 'error')
    },
  })

  const { mutate: deleteTax } = useSupabaseMutation('tax_master', {
    onSuccess: () => {
      toast('Tax deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete tax', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      tax_code: '',
      tax_name: '',
      tax_type: 'sales',
      tax_rate: '',
    })
    setEditingTax(null)
  }

  const handleEdit = (tax: TaxMaster) => {
    setEditingTax(tax)
    setFormData({
      tax_code: tax.tax_code,
      tax_name: tax.tax_name,
      tax_type: tax.tax_type,
      tax_rate: tax.tax_rate.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tax?')) {
      deleteTax({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      tax_code: formData.tax_code,
      tax_name: formData.tax_name,
      tax_type: formData.tax_type,
      tax_rate: parseFloat(formData.tax_rate),
      is_active: true,
    }

    if (editingTax) {
      updateTax({ id: editingTax.id, data: payload, method: 'PATCH' })
    } else {
      createTax({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'tax_code',
      header: 'Tax Code',
    },
    {
      accessorKey: 'tax_name',
      header: 'Tax Name',
    },
    {
      accessorKey: 'tax_type',
      header: 'Tax Type',
      cell: ({ row }: any) => row.original.tax_type === 'sales' ? 'Sales Tax' : 'Purchase Tax',
    },
    {
      accessorKey: 'tax_rate',
      header: 'Tax Rate (%)',
      cell: ({ row }: any) => `${row.original.tax_rate}%`,
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tax Master</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tax
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTax ? 'Edit Tax' : 'Add New Tax'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tax Code *</Label>
                <Input
                  value={formData.tax_code}
                  onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Tax Name *</Label>
                <Input
                  value={formData.tax_name}
                  onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Tax Type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.tax_type}
                  onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                  required
                >
                  <option value="sales">Sales Tax</option>
                  <option value="purchase">Purchase Tax</option>
                </select>
              </div>
              <div>
                <Label>Tax Rate (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <Receipt className="w-4 h-4 mr-2" />
                  {editingTax ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={taxes} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

