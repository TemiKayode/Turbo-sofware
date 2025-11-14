import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface FinancialYear {
  id: string
  year_name: string
  start_date: string
  end_date: string
  is_closed: boolean
  is_active: boolean
}

export function FinancialYearPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<FinancialYear | null>(null)

  const [formData, setFormData] = useState({
    year_name: '',
    start_date: '',
    end_date: '',
  })

  const { data: financialYears = [], isLoading, refetch } = useSupabaseQuery<FinancialYear>(
    ['financial_years', companyId!],
    'financial_years',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('start_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { mutate: createYear } = useSupabaseMutation('financial_years', {
    onSuccess: () => {
      toast('Financial year created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create financial year', 'error')
    },
  })

  const { mutate: updateYear } = useSupabaseMutation('financial_years', {
    onSuccess: () => {
      toast('Financial year updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update financial year', 'error')
    },
  })

  const { mutate: closeYear } = useSupabaseMutation('financial_years', {
    onSuccess: () => {
      toast('Financial year closed successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to close financial year', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      year_name: '',
      start_date: '',
      end_date: '',
    })
    setEditingYear(null)
  }

  const handleEdit = (year: FinancialYear) => {
    setEditingYear(year)
    setFormData({
      year_name: year.year_name,
      start_date: year.start_date,
      end_date: year.end_date,
    })
    setDialogOpen(true)
  }

  const handleCloseYear = async (id: string) => {
    if (confirm('Are you sure you want to close this financial year? This action cannot be undone.')) {
      closeYear({ id, data: { is_closed: true, is_active: false }, method: 'PATCH' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      year_name: formData.year_name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_closed: false,
      is_active: true,
    }

    if (editingYear) {
      updateYear({ id: editingYear.id, data: payload, method: 'PATCH' })
    } else {
      createYear({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'year_name',
      header: 'Year Name',
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }: any) => format(new Date(row.original.start_date), 'PP'),
    },
    {
      accessorKey: 'end_date',
      header: 'End Date',
      cell: ({ row }: any) => format(new Date(row.original.end_date), 'PP'),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          {row.original.is_active && (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          )}
          {row.original.is_closed && (
            <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
          )}
          {!row.original.is_active && !row.original.is_closed && (
            <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          {!row.original.is_closed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {row.original.is_active && !row.original.is_closed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCloseYear(row.original.id)}
              className="text-red-600"
            >
              Close Year
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Year</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Financial Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingYear ? 'Edit Financial Year' : 'Add New Financial Year'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Year Name *</Label>
                <Input
                  value={formData.year_name}
                  onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                  placeholder="e.g., FY 2024-25"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  {editingYear ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Years</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={financialYears} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

