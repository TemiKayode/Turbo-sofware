import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Plus, Search, Download } from 'lucide-react'
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

export function SalesEnquiryPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    enquiry_no: '',
    enquiry_date: format(new Date(), 'yyyy-MM-dd'),
    customer_id: '',
    notes: '',
  })

  const { data: enquiries = [], isLoading, refetch } = useSupabaseQuery<any>(
    ['sales_enquiries', companyId!],
    'sales_enquiries',
    {
      filters: (query) => query.eq('company_id', companyId!).order('enquiry_date', { ascending: false }),
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

  const { mutate: createEnquiry } = useSupabaseMutation('sales_enquiries', {
    onSuccess: () => {
      toast('Sales enquiry created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create enquiry', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      enquiry_no: '',
      enquiry_date: format(new Date(), 'yyyy-MM-dd'),
      customer_id: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    try {
      let enquiryNumber = formData.enquiry_no
      if (!enquiryNumber) {
        const { count } = await supabase
          .from('sales_enquiries')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
        enquiryNumber = `ENQ-${String((count || 0) + 1).padStart(6, '0')}`
      }

      createEnquiry({
        type: 'insert',
        payload: {
          company_id: companyId,
          enquiry_no: enquiryNumber,
          customer_id: formData.customer_id,
          enquiry_date: formData.enquiry_date,
          notes: formData.notes || null,
          status: 'open',
          created_by: user.id,
        },
      })
    } catch (error: any) {
      toast(error.message || 'Failed to create enquiry', 'error')
    }
  }

  const handleExport = () => {
    const columns = [
      { header: 'Enquiry #', accessor: (row: any) => row.enquiry_no || 'N/A' },
      { header: 'Date', accessor: (row: any) => row.enquiry_date ? format(new Date(row.enquiry_date), 'dd MMM yyyy') : 'N/A' },
      { header: 'Customer', accessor: (row: any) => row.customer_name || 'N/A' },
      { header: 'Status', accessor: (row: any) => row.status || 'open' },
    ]
    exportTableToCSV(columns, enquiries, 'sales_enquiries')
    toast('Export data downloaded', 'success')
  }

  const filteredEnquiries = enquiries.filter((enq: any) =>
    enq.enquiry_no?.toLowerCase().includes(search.toLowerCase()) ||
    enq.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Enquiry #', accessor: (row: any) => row.enquiry_no || 'N/A' },
    { header: 'Date', accessor: (row: any) => row.enquiry_date ? format(new Date(row.enquiry_date), 'dd MMM yyyy') : 'N/A' },
    { header: 'Customer', accessor: (row: any) => row.customer_name || 'N/A' },
    { header: 'Status', accessor: (row: any) => row.status || 'open' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Sales Enquiry
          </h1>
          <p className="text-gray-600 mt-1">Track and manage customer enquiries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Enquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Sales Enquiry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="enquiry_no">Enquiry Number</Label>
                  <Input
                    id="enquiry_no"
                    value={formData.enquiry_no}
                    onChange={(e) => setFormData({ ...formData, enquiry_no: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="enquiry_date">Enquiry Date *</Label>
                  <Input
                    id="enquiry_date"
                    type="date"
                    value={formData.enquiry_date}
                    onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_id">Customer *</Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })} required>
                  <SelectTrigger id="customer_id">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_name}
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
                <Button type="submit">Create Enquiry</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Enquiries</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search enquiries..."
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
            data={filteredEnquiries}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
