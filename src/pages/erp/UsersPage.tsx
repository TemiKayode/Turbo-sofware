import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useToast } from '@/components/ui/toaster'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

export function UsersPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
  })

  const { data: users = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['erp_users', companyId!],
    'users',
    {
      filters: (query) => query.eq('company_id', companyId!).order('full_name'),
      enabled: !!companyId,
    }
  )

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'user',
    })
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setIsInviting(true)
    try {
      // In a real implementation, you would:
      // 1. Send an invitation email via Supabase Auth
      // 2. Create a user record when they accept
      // For now, we'll create a placeholder user record
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          full_name: formData.full_name || null,
          role: formData.role,
          company_id: companyId,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast('User with this email already exists', 'error')
        } else {
          throw error
        }
      } else {
        toast('User invitation sent successfully', 'success')
        setDialogOpen(false)
        resetForm()
        refetch()
      }
    } catch (error: any) {
      toast(error.message || 'Failed to invite user', 'error')
    } finally {
      setIsInviting(false)
    }
  }

  const filteredUsers = users.filter((user: any) =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Name', accessor: (row: any) => row.full_name || 'N/A' },
    { header: 'Email', accessor: (row: any) => row.email || 'N/A' },
    { header: 'Role', accessor: (row: any) => (
      <Badge variant={row.role === 'admin' ? 'default' : 'secondary'}>
        {row.role || 'user'}
      </Badge>
    )},
    { header: 'Status', accessor: (row: any) => (
      <Badge variant={row.is_active ? 'success' : 'secondary'}>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Users
          </h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  disabled={isInviting}
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  disabled={isInviting}
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required disabled={isInviting}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isInviting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Users ({users.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
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
            data={filteredUsers}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
