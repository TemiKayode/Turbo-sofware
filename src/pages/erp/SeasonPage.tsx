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
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Season {
  id: string
  season_name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export function SeasonPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)

  const [formData, setFormData] = useState({
    season_name: '',
    start_date: '',
    end_date: '',
  })

  const { data: seasons = [], isLoading, refetch } = useSupabaseQuery<Season>(
    ['seasons', companyId!],
    'seasons',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('start_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { mutate: createSeason } = useSupabaseMutation('seasons', {
    onSuccess: () => {
      toast('Season created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create season', 'error')
    },
  })

  const { mutate: updateSeason } = useSupabaseMutation('seasons', {
    onSuccess: () => {
      toast('Season updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update season', 'error')
    },
  })

  const { mutate: deleteSeason } = useSupabaseMutation('seasons', {
    onSuccess: () => {
      toast('Season deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete season', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      season_name: '',
      start_date: '',
      end_date: '',
    })
    setEditingSeason(null)
  }

  const handleEdit = (season: Season) => {
    setEditingSeason(season)
    setFormData({
      season_name: season.season_name,
      start_date: season.start_date,
      end_date: season.end_date,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this season?')) {
      deleteSeason({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      season_name: formData.season_name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: true,
    }

    if (editingSeason) {
      updateSeason({ id: editingSeason.id, data: payload, method: 'PATCH' })
    } else {
      createSeason({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'season_name',
      header: 'Season Name',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seasons</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Season
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSeason ? 'Edit Season' : 'Add New Season'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Season Name *</Label>
                <Input
                  value={formData.season_name}
                  onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
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
                  {editingSeason ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={seasons} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

