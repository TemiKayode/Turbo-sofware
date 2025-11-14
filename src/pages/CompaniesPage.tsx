import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageSkeleton, CardSkeleton } from '@/components/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { Plus, Building2, Users, FileText, CheckCircle2 } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']

export function CompaniesPage() {
  const { user, companyId } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    fetchCompanies()

    return () => clearTimeout(timeoutId)
  }, [user])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error: any) {
      toast(error.message || 'Failed to fetch companies', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Check subscription limits
      const { data: userCompany } = await supabase
        .from('companies')
        .select('subscription_tier, max_companies')
        .eq('owner_id', user.id)
        .single()

      const currentCount = companies.filter(c => c.owner_id === user.id).length
      const maxCompanies = userCompany?.max_companies || 1

      if (currentCount >= maxCompanies) {
        toast(`You have reached your subscription limit of ${maxCompanies} companies`, 'error')
        return
      }

      const { data: newCompany, error } = await supabase.from('companies').insert({
        name: companyName,
        owner_id: user.id,
        subscription_tier: 'free',
        max_users: 1,
        max_companies: 1,
        max_documents: 10,
      }).select().single()

      if (error) throw error

      // Update user's company_id if they don't have one
      if (newCompany && !companyId) {
        await supabase
          .from('users')
          .update({ company_id: newCompany.id })
          .eq('id', user.id)
      }

      toast('Company created successfully', 'success')
      setCompanyName('')
      setShowCreate(false)
      fetchCompanies()
      
      // Refresh page to update companyId in context
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast(error.message || 'Failed to create company', 'error')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Companies</h1>
          <Button 
            onClick={() => setShowCreate(!showCreate)}
            className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
          >
            {showCreate ? 'Cancel' : 'Create Company'}
          </Button>
        </div>

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Company</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <Input
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="max-w-md"
                />
                <div className="flex space-x-2">
                  <Button 
                    type="submit"
                    className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {companies.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No companies yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Create your first company to get started. Companies help you organize your business and manage subscriptions.
              </p>
              <Button 
                onClick={() => setShowCreate(true)}
                className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-all border-l-4 border-l-[#2CA01C]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-[#2CA01C]/10 dark:bg-[#2CA01C]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#2CA01C]" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className="mt-2 bg-[#2CA01C]/10 text-[#2CA01C] border-[#2CA01C]/20"
                      >
                        {company.subscription_tier.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Users</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{company.max_users}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Documents</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{company.max_documents}</span>
                  </div>
                  {company.id === companyId && (
                    <div className="flex items-center gap-2 text-sm text-[#2CA01C] pt-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Current Company</span>
                    </div>
                  )}
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


