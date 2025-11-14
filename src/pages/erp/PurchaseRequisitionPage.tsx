import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Plus, Search, Download } from 'lucide-react'
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
import { exportTableToCSV } from '@/lib/exportUtils'
import { supabase } from '@/lib/supabase'

export function PurchaseRequisitionPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    requisition_no: '',
    requisition_date: format(new Date(), 'yyyy-MM-dd'),
    department_id: '',
    notes: '',
  })

  const { data: requisitions = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['purchase_requisitions', companyId!],
    'purchase_requisitions',
    {
      filters: (query) => query.eq('company_id', companyId!).order('requisition_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: departments = [] } = useSupabaseQuery<any>(
    ['departments', companyId!],
    'departments',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true).order('department_name'),
      enabled: !!companyId,
    }
  )

  const { mutate: createRequisition } = useSupabaseMutation('purchase_requisitions', {
    onSuccess: () => {
      toast('Purchase requisition created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create requisition', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      requisition_no: '',
      requisition_date: format(new Date(), 'yyyy-MM-dd'),
      department_id: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let requisitionNumber = formData.requisition_no
      if (!requisitionNumber) {
        const { count } = await supabase
          .from('purchase_requisitions')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        requisitionNumber = `PR-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createRequisition({
        type: 'insert',
        payload: {
          company_id: companyId,
          requisition_no: requisitionNumber,
          requisition_date: formData.requisition_date,
          department_id: formData.department_id || null,
          notes: formData.notes || null,
          status: 'pending',
          requested_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create requisition', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'Requisition #', accessor: (row: any) => row.requisition_no || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.requisition_date ? format(new Date(row.requisition_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Department', accessor: (row: any) => row.department_name || 'N/A' },
      { header: 'Status', accessor: (row: any) => row.status || 'pending' },
    ]
    exportTableToCSV(columns, requisitions, 'purchase_requisitions')
    toast('Purchase requisitions exported', 'success')
  }

  const filteredRequisitions = requisitions.filter((req: any) =>
    req.requisition_no?.toLowerCase().includes(search.toLowerCase()) ||
    req.department_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Requisition #', accessor: (row: any) => row.requisition_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.requisition_date ? format(new Date(row.requisition_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Department', accessor: (row: any) => row.department_name || 'N/A' },
    { header: 'Status', accessor: (row: any) => row.status || 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            Purchase Requisition
          </h1>
          <p className="text-gray-600 mt-1">Create and manage purchase requisitions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Requisition</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requisition_no">Requisition Number</Label>
                  <Input
                    id="requisition_no"
                    value={formData.requisition_no}
                    onChange={(e) => setFormData({ ...formData, requisition_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="requisition_date">Requisition Date *</Label>
                  <Input
                    id="requisition_date"
                    type="date"
                    value={formData.requisition_date}
                    onChange={(e) => setFormData({ ...formData, requisition_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select value={formData.department_id || undefined} onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}>
                  <SelectTrigger id="department_id">
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Requisition</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Purchase Requisitions</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search requisitions..."
                  className="pl-10 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequisitions}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
