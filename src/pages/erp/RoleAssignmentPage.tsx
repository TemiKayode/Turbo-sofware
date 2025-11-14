import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { UserCheck, Edit } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserRole {
  id: string
  user_id: string
  role_id: string
  users?: { email: string; full_name: string }
  roles?: { role_name: string; description: string }
}

export function RoleAssignmentPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const { data: userRoles = [], isLoading, refetch } = useSupabaseQuery<UserRole>(
    ['user_roles', companyId!],
    'user_roles',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, users(email, full_name), roles(role_name, description)')
          .order('user_id'),
      enabled: !!companyId,
    }
  )

  const { data: users = [] } = useSupabaseQuery<any>(
    ['users', companyId!],
    'users',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  const { data: roles = [] } = useSupabaseQuery<any>(
    ['roles', companyId!],
    'roles',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { mutate: assignRole } = useSupabaseMutation('user_roles', {
    onSuccess: () => {
      toast('Role assigned successfully', 'success')
      setDialogOpen(false)
      setSelectedUser(null)
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to assign role', 'error')
    },
  })

  const { mutate: updateRole } = useSupabaseMutation('user_roles', {
    onSuccess: () => {
      toast('Role updated successfully', 'success')
      setDialogOpen(false)
      setSelectedUser(null)
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update role', 'error')
    },
  })

  const handleAssignRole = (userId: string, roleId: string) => {
    if (!companyId) return

    const existingRole = userRoles.find((ur: any) => ur.user_id === userId)
    
    if (existingRole) {
      updateRole({ id: existingRole.id, data: { role_id: roleId }, method: 'PATCH' })
    } else {
      assignRole({ data: { company_id: companyId, user_id: userId, role_id: roleId }, method: 'POST' })
    }
  }

  const columns = [
    {
      accessorKey: 'users.email',
      header: 'User',
      cell: ({ row }: any) => {
        const user = row.original.users
        return user ? `${user.full_name || ''} (${user.email})` : '-'
      },
    },
    {
      accessorKey: 'roles.role_name',
      header: 'Role',
      cell: ({ row }: any) => row.original.roles?.role_name || '-',
    },
    {
      accessorKey: 'roles.description',
      header: 'Description',
      cell: ({ row }: any) => row.original.roles?.description || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedUser(row.original.user_id)
            setDialogOpen(true)
          }}
        >
          <Edit className="w-4 h-4 mr-1" />
          Assign Role
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-8 h-8" />
          Role Assignment
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={userRoles} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div>
                <Label>Role</Label>
                <Select
                  onValueChange={(roleId) => {
                    handleAssignRole(selectedUser, roleId)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

