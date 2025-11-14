import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, CheckCircle, Clock, AlertCircle, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { useToast } from '@/components/ui/toaster'
import { DataTable } from '@/components/DataTable'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export function ProjectsPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    customer_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    budget: '0',
    status: 'planning',
    description: '',
  })

  const { data: projects = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['projects', companyId!],
    'projects',
    {
      filters: (query) => query.eq('company_id', companyId!).order('created_at', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: customers = [] } = useSupabaseQuery<any>(
    ['customers', companyId!],
    'customers',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('customer_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createProject } = useSupabaseMutation('projects', {
    onSuccess: () => {
      toast('Project created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create project', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      project_code: '',
      project_name: '',
      customer_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      budget: '0',
      status: 'planning',
      description: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let projectCode = formData.project_code
      if (!projectCode) {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        projectCode = `PRJ-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createProject({
        type: 'insert',
        payload: {
          company_id: companyId,
          project_code: projectCode,
          project_name: formData.project_name,
          customer_id: formData.customer_id || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          budget: parseFloat(formData.budget) || 0,
          actual_cost: 0,
          status: formData.status,
          description: formData.description || null,
          created_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create project', 'error')
    }
  }

  const filteredProjects = projects.filter((project: any) =>
    project.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    project.project_code?.toLowerCase().includes(search.toLowerCase())
  )

  const totalProjects = projects.length
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length
  const inProgressProjects = projects.filter((p: any) => p.status === 'active').length
  const onHoldProjects = projects.filter((p: any) => p.status === 'on_hold').length

  const columns = [
    { header: 'Project Code', accessor: (row: any) => row.project_code || 'N/A' },
    { header: 'Project Name', accessor: (row: any) => row.project_name || 'N/A' },
    { header: 'Customer', accessor: (row: any) => row.customer_name || 'N/A' },
    { header: 'Start Date', accessor: (row: any) => row.start_date ? format(new Date(row.start_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'End Date', accessor: (row: any) => row.end_date ? format(new Date(row.end_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Budget', accessor: (row: any) => `$${parseFloat(row.budget?.toString() || '0').toFixed(2)}` },
    { header: 'Status', accessor: (row: any) => {
      const status = row.status || 'planning'
      const variants: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
        completed: 'success',
        active: 'default',
        on_hold: 'destructive',
        planning: 'secondary',
        cancelled: 'destructive',
      }
      return <Badge variant={variants[status] || 'default'}>{status}</Badge>
    }},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-indigo-600" />
            Projects
          </h1>
          <p className="text-gray-600 mt-1">Manage projects, tasks, and team collaboration</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_code">Project Code</Label>
                  <Input
                    id="project_code"
                    value={formData.project_code}
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <Select value={formData.customer_id || undefined} onValueChange={(value) => setFormData({ ...formData, customer_id: value === 'none' ? '' : value })}>
                  <SelectTrigger id="customer_id">
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{totalProjects}</div>
            <p className="text-sm text-muted-foreground mt-1">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{completedProjects}</div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Finished
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{inProgressProjects}</div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Ongoing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{onHoldProjects}</div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Blocked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Projects ({projects.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
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
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No projects yet</p>
              <p className="text-sm mt-2">Create your first project to get started</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <DataTable
              data={filteredProjects}
              columns={columns}
              loading={isLoading}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
