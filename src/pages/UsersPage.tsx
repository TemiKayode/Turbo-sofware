import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageSkeleton } from '@/components/LoadingSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { Plus } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']

export function UsersPage() {
  const { user, userRole, companyId } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userRoleInput, setUserRoleInput] = useState<'admin' | 'user' | 'viewer'>('user')
  const { toast } = useToast()

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    fetchUsers()

    return () => clearTimeout(timeoutId)
  }, [user, companyId, userRole])

  const fetchUsers = async () => {
    try {
      let query = supabase.from('users').select('*')

      // Non-admins can only see users in their company
      if (userRole !== 'admin' && companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast(error.message || 'Failed to fetch users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !companyId) return

    try {
      // Check subscription limits
      const { data: company } = await supabase
        .from('companies')
        .select('max_users')
        .eq('id', companyId)
        .single()

      const currentCount = users.filter(u => u.company_id === companyId).length
      const maxUsers = company?.max_users || 1

      if (currentCount >= maxUsers) {
        toast(`You have reached your subscription limit of ${maxUsers} users`, 'error')
        return
      }

      // Create auth user first
      const password = Math.random().toString(36).slice(-12) + 'A1!'
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: password,
        email_confirm: true,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user record
        const { error } = await supabase.from('users').insert({
          id: authData.user.id,
          email: userEmail,
          full_name: userName,
          role: userRoleInput,
          company_id: companyId,
        })

        if (error) throw error

        toast('User created successfully', 'success')
        setUserEmail('')
        setUserName('')
        setShowCreate(false)
        fetchUsers()
      }
    } catch (error: any) {
      toast(error.message || 'Failed to create user', 'error')
    }
  }

  if (loading) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          {userRole === 'admin' && (
            <Button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              {showCreate ? 'Cancel' : 'Create User'}
            </Button>
          )}
        </div>

        {showCreate && userRole === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  placeholder="Full Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="max-w-md"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  className="max-w-md"
                />
                <select
                  className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={userRoleInput}
                  onChange={(e) => setUserRoleInput(e.target.value as any)}
                >
                  <option value="viewer">Viewer</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex space-x-2">
                  <Button 
                    type="submit"
                    className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No users found. {userRole === 'admin' && 'Create a user to get started.'}
              </p>
              {userRole === 'admin' && (
                <Button 
                  onClick={() => setShowCreate(true)}
                  className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle>{u.full_name || u.email}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {u.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {u.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </Layout>
  )
}


