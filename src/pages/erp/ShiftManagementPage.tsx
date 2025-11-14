import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Shift {
  id: string
  shift_name: string
  start_time: string
  end_time: string
  break_duration: number
  is_active: boolean
}

export function ShiftManagementPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const [formData, setFormData] = useState({
    shift_name: '',
    start_time: '09:00',
    end_time: '17:00',
    break_duration: '60',
  })

  const { data: shifts = [], isLoading, refetch } = useSupabaseQuery<Shift>(
    ['shifts', companyId!],
    'shifts',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('shift_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createShift } = useSupabaseMutation('shifts', {
    onSuccess: () => {
      toast('Shift created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create shift', 'error')
    },
  })

  const { mutate: updateShift } = useSupabaseMutation('shifts', {
    onSuccess: () => {
      toast('Shift updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update shift', 'error')
    },
  })

  const { mutate: deleteShift } = useSupabaseMutation('shifts', {
    onSuccess: () => {
      toast('Shift deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete shift', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      shift_name: '',
      start_time: '09:00',
      end_time: '17:00',
      break_duration: '60',
    })
    setEditingShift(null)
  }

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift)
    setFormData({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_duration: shift.break_duration.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      deleteShift({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      shift_name: formData.shift_name,
      start_time: formData.start_time,
      end_time: formData.end_time,
      break_duration: parseInt(formData.break_duration),
      is_active: true,
    }

    if (editingShift) {
      updateShift({ id: editingShift.id, data: payload, method: 'PATCH' })
    } else {
      createShift({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'shift_name',
      header: 'Shift Name',
    },
    {
      accessorKey: 'start_time',
      header: 'Start Time',
    },
    {
      accessorKey: 'end_time',
      header: 'End Time',
    },
    {
      accessorKey: 'break_duration',
      header: 'Break (minutes)',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shift Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingShift ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Shift Name *</Label>
                <Input
                  value={formData.shift_name}
                  onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                  placeholder="e.g., Morning Shift, Night Shift"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Break Duration (minutes) *</Label>
                <Input
                  type="number"
                  value={formData.break_duration}
                  onChange={(e) => setFormData({ ...formData, break_duration: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  <Clock className="w-4 h-4 mr-2" />
                  {editingShift ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={shifts} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

