import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { useToast } from '@/components/ui/toaster'
import { DataTable } from '@/components/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

export function RolesPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    role_code: '',
    role_name: '',
    description: '',
    permissions: '{}',
  })

  const { data: roles = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['roles_master', companyId!],
    'roles_master',
    {
      filters: (query) => query.eq('company_id', companyId!).order('role_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createRole } = useSupabaseMutation('roles_master', {
    onSuccess: () => {
      toast('Role created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create role', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      role_code: '',
      role_name: '',
      description: '',
      permissions: '{}',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      let roleCode = formData.role_code
      if (!roleCode) {
        const { count } = await supabase
          .from('roles_master')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        roleCode = `ROLE-${String((count || 0) + 1).padStart(4, '0')}`
      }

      let permissions
      try {
        permissions = JSON.parse(formData.permissions)
      } catch {
        permissions = {}
      }

      createRole({
        type: 'insert',
        payload: {
          company_id: companyId,
          role_code: roleCode,
          role_name: formData.role_name,
          description: formData.description || null,
          permissions: permissions,
          is_active: true,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create role', 'error')
    }
  }

  const filteredRoles = roles.filter((role: any) =>
    role.role_name?.toLowerCase().includes(search.toLowerCase()) ||
    role.role_code?.toLowerCase().includes(search.toLowerCase()) ||
    role.description?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Role Name', accessor: (row: any) => row.role_name || 'N/A' },
    { header: 'Code', accessor: (row: any) => row.role_code || 'N/A' },
    { header: 'Description', accessor: (row: any) => row.description || 'N/A' },
    { header: 'Status', accessor: (row: any) => row.is_active ? 'Active' : 'Inactive' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            Roles
          </h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role_code">Role Code</Label>
                  <Input
                    id="role_code"
                    value={formData.role_code}
                    onChange={(e) => setFormData({ ...formData, role_code: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="role_name">Role Name *</Label>
                  <Input
                    id="role_name"
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Role description"
                />
              </div>
              <div>
                <Label htmlFor="permissions">Permissions (JSON)</Label>
                <Input
                  id="permissions"
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  placeholder='{"read": true, "write": false}'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter permissions as JSON object (e.g., {"{"}"read": true, "write": false{"}"})
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Role</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Roles ({roles.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRoles}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
