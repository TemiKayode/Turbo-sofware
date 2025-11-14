import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface HSCode {
  id: string
  hs_code: string
  description: string
  duty_rate: number | null
}

export function HSCodePage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<HSCode | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    hs_code: '',
    description: '',
    duty_rate: '',
  })

  const { data: hsCodes = [], isLoading, refetch } = useSupabaseQuery<HSCode>(
    ['hs_codes', companyId!],
    'hs_codes',
    {
      filters: (query) => {
        let q = query.eq('company_id', companyId!).order('hs_code')
        if (searchTerm) {
          q = q.or(`hs_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }
        return q
      },
      enabled: !!companyId,
    }
  )

  const { mutate: createCode } = useSupabaseMutation('hs_codes', {
    onSuccess: () => {
      toast('HS Code created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create HS code', 'error')
    },
  })

  const { mutate: updateCode } = useSupabaseMutation('hs_codes', {
    onSuccess: () => {
      toast('HS Code updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update HS code', 'error')
    },
  })

  const { mutate: deleteCode } = useSupabaseMutation('hs_codes', {
    onSuccess: () => {
      toast('HS Code deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete HS code', 'error')
    },
  })

  const resetForm = () => {
    setFormData({ hs_code: '', description: '', duty_rate: '' })
    setEditingCode(null)
  }

  const handleEdit = (code: HSCode) => {
    setEditingCode(code)
    setFormData({
      hs_code: code.hs_code,
      description: code.description,
      duty_rate: code.duty_rate?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this HS code?')) {
      deleteCode({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      hs_code: formData.hs_code,
      description: formData.description,
      duty_rate: formData.duty_rate ? parseFloat(formData.duty_rate) : null,
    }

    if (editingCode) {
      updateCode({ id: editingCode.id, data: payload, method: 'PATCH' })
    } else {
      createCode({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'hs_code',
      header: 'HS Code',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'duty_rate',
      header: 'Duty Rate %',
      cell: ({ row }: any) => row.original.duty_rate ? `${row.original.duty_rate}%` : '-',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HS Code Management</h1>
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
              Add HS Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit HS Code' : 'Add New HS Code'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">HS Code *</label>
                <Input
                  value={formData.hs_code}
                  onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                  required
                  placeholder="e.g., 1234.56.78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duty Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.duty_rate}
                  onChange={(e) => setFormData({ ...formData, duty_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  {editingCode ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by HS Code or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={hsCodes} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

