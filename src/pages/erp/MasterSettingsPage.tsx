import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Edit, Trash2, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface MasterSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: string
  description: string
}

export function MasterSettingsPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<MasterSetting | null>(null)

  const [formData, setFormData] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'text',
    description: '',
  })

  const { data: settings = [], isLoading, refetch } = useSupabaseQuery<MasterSetting>(
    ['master_settings', companyId!],
    'master_settings',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .order('setting_key'),
      enabled: !!companyId,
    }
  )

  const { mutate: createSetting } = useSupabaseMutation('master_settings', {
    onSuccess: () => {
      toast('Setting created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create setting', 'error')
    },
  })

  const { mutate: updateSetting } = useSupabaseMutation('master_settings', {
    onSuccess: () => {
      toast('Setting updated successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update setting', 'error')
    },
  })

  const { mutate: deleteSetting } = useSupabaseMutation('master_settings', {
    onSuccess: () => {
      toast('Setting deleted successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to delete setting', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      setting_key: '',
      setting_value: '',
      setting_type: 'text',
      description: '',
    })
    setEditingSetting(null)
  }

  const handleEdit = (setting: MasterSetting) => {
    setEditingSetting(setting)
    setFormData({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
      setting_type: setting.setting_type,
      description: setting.description,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      deleteSetting({ id, method: 'DELETE' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    const payload = {
      company_id: companyId,
      setting_key: formData.setting_key,
      setting_value: formData.setting_value,
      setting_type: formData.setting_type,
      description: formData.description,
    }

    if (editingSetting) {
      updateSetting({ id: editingSetting.id, data: payload, method: 'PATCH' })
    } else {
      createSetting({ data: payload, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'setting_key',
      header: 'Setting Key',
    },
    {
      accessorKey: 'setting_value',
      header: 'Value',
    },
    {
      accessorKey: 'setting_type',
      header: 'Type',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Master Settings
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSetting ? 'Edit Setting' : 'Add New Setting'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Setting Key *</Label>
                <Input
                  value={formData.setting_key}
                  onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Setting Value *</Label>
                <Input
                  value={formData.setting_value}
                  onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Setting Type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.setting_type}
                  onChange={(e) => setFormData({ ...formData, setting_type: e.target.value })}
                  required
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <Label>Description</Label>
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
                  {editingSetting ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={settings} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

