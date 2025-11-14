import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { format } from 'date-fns'
import type { Database } from '@/lib/supabase'

type DataBreach = Database['public']['Tables']['data_breaches']['Row']

export function DataBreachDashboardPage() {
  const { user, companyId } = useAuth()
  const [breaches, setBreaches] = useState<DataBreach[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low')
  const [affectedRecords, setAffectedRecords] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchBreaches()
  }, [user, companyId])

  const fetchBreaches = async () => {
    try {
      let query = supabase.from('data_breaches').select('*')

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query.order('detected_at', { ascending: false })

      if (error) throw error
      setBreaches(data || [])
    } catch (error: any) {
      toast(error.message || 'Failed to fetch data breaches', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBreach = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const { error } = await supabase.from('data_breaches').insert({
        company_id: companyId,
        description,
        severity,
        detected_at: new Date().toISOString(),
        affected_records: affectedRecords,
      })

      if (error) throw error

      toast('Data breach recorded', 'success')
      setDescription('')
      setSeverity('low')
      setAffectedRecords(0)
      setShowCreate(false)
      fetchBreaches()
    } catch (error: any) {
      toast(error.message || 'Failed to record data breach', 'error')
    }
  }

  const handleResolveBreach = async (breachId: string) => {
    try {
      const { error } = await supabase
        .from('data_breaches')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', breachId)

      if (error) throw error

      toast('Data breach marked as resolved', 'success')
      fetchBreaches()
    } catch (error: any) {
      toast(error.message || 'Failed to resolve breach', 'error')
    }
  }

  const getSeverityColor = (severity: DataBreach['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-600 text-white'
      case 'medium':
        return 'bg-yellow-600 text-white'
      case 'low':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const stats = {
    total: breaches.length,
    unresolved: breaches.filter(b => !b.resolved_at).length,
    critical: breaches.filter(b => b.severity === 'critical' && !b.resolved_at).length,
    totalAffected: breaches.reduce((sum, b) => sum + (b.affected_records || 0), 0),
  }

  if (loading) {
    return <Layout><div>Loading...</div></Layout>
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Data Breach Dashboard</h1>
          <Button onClick={() => setShowCreate(!showCreate)}>Record Breach</Button>
        </div>

        {showCreate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Record Data Breach</CardTitle>
              <CardDescription>Report a data breach for regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBreach} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Affected Records</label>
                  <Input
                    type="number"
                    value={affectedRecords}
                    onChange={(e) => setAffectedRecords(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Record</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Breaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unresolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Affected Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAffected.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {breaches.map((breach) => (
            <Card key={breach.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{breach.description}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detected: {format(new Date(breach.detected_at), 'PPp')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(breach.severity)}`}>
                    {breach.severity.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="font-medium">Affected Records:</span>{' '}
                    {breach.affected_records?.toLocaleString() || 0}
                  </div>
                  {breach.resolved_at ? (
                    <div>
                      <span className="font-medium">Resolved:</span>{' '}
                      {format(new Date(breach.resolved_at), 'PPp')}
                    </div>
                  ) : (
                    <div className="text-yellow-600 font-medium">Unresolved</div>
                  )}
                </div>
                {!breach.resolved_at && (
                  <Button variant="outline" onClick={() => handleResolveBreach(breach.id)}>
                    Mark as Resolved
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {breaches.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No data breaches recorded
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}


