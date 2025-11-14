import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Shield, Check, X } from 'lucide-react'

interface Authorization {
  id: string
  user_id: string
  module: string
  permission: string
  is_granted: boolean
  users?: { email: string }
}

const modules = [
  'inventory',
  'procurement',
  'sales',
  'financials',
  'hr',
  'projects',
  'reports',
  'control_panel',
]

const permissions = ['view', 'create', 'edit', 'delete', 'approve']

export function AuthorizationPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()

  const { data: authorizations = [], isLoading, refetch } = useSupabaseQuery<Authorization>(
    ['authorizations', companyId!],
    'authorizations',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, users(email)')
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

  const { mutate: updateAuthorization } = useSupabaseMutation('authorizations', {
    onSuccess: () => {
      toast('Authorization updated successfully', 'success')
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to update authorization', 'error')
    },
  })

  const togglePermission = (authId: string, currentStatus: boolean) => {
    updateAuthorization({ id: authId, data: { is_granted: !currentStatus }, method: 'PATCH' })
  }

  const columns = [
    {
      accessorKey: 'users.email',
      header: 'User',
      cell: ({ row }: any) => row.original.users?.email || '-',
    },
    {
      accessorKey: 'module',
      header: 'Module',
    },
    {
      accessorKey: 'permission',
      header: 'Permission',
    },
    {
      accessorKey: 'is_granted',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={row.original.is_granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.original.is_granted ? 'Granted' : 'Denied'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => togglePermission(row.original.id, row.original.is_granted)}
        >
          {row.original.is_granted ? (
            <>
              <X className="w-4 h-4 mr-1" />
              Revoke
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Grant
            </>
          )}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Authorization Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={authorizations} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

