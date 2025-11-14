import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'

interface SalesQuotation {
  id: string
  quotation_no: string
  customer_id: string
  quotation_date: string
  valid_until: string | null
  status: string
  total_amount: number
  customers?: { customer_name: string }
}

export function SalesQuotationPage() {
  const { companyId } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotation | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    customer_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
  })

  const { data: quotations = [], isLoading, refetch } = useSupabaseQuery<SalesQuotation>(
    ['sales_quotations', companyId!],
    'sales_quotations',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, customers(customer_name)')
          .order('quotation_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: customers = [] } = useSupabaseQuery<any>(
    ['customers', companyId!],
    'customers',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const { data: items = [] } = useSupabaseQuery<any>(
    ['items', companyId!],
    'items',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('is_active', true),
      enabled: !!companyId,
    }
  )

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const { data: quotation, error } = await supabase
        .from('sales_quotations')
        .insert({
          company_id: companyId,
          quotation_no: `SQ-${Date.now()}`,
          customer_id: formData.customer_id,
          quotation_date: formData.quotation_date,
          valid_until: formData.valid_until || null,
          notes: formData.notes || null,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      toast('Sales quotation created successfully', 'success')
      setShowCreate(false)
      setSelectedQuotation(quotation)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to create quotation', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success'
      case 'sent':
        return 'default'
      case 'expired':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const columns = [
    { header: 'Quotation No', accessor: 'quotation_no' as keyof SalesQuotation },
    {
      header: 'Customer',
      accessor: (row: SalesQuotation) => row.customers?.customer_name || 'N/A',
    },
    {
      header: 'Date',
      accessor: (row: SalesQuotation) => format(new Date(row.quotation_date), 'MMM dd, yyyy'),
    },
    {
      header: 'Total Amount',
      accessor: (row: SalesQuotation) => `$${row.total_amount.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (row: SalesQuotation) => (
        <Badge variant={getStatusColor(row.status) as any}>{row.status}</Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Quotations</h1>
        <Button onClick={() => setShowCreate(true)}>Create Quotation</Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Sales Quotation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quotation_date">Quotation Date *</Label>
                  <Input
                    id="quotation_date"
                    type="date"
                    value={formData.quotation_date}
                    onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={quotations}
        columns={columns}
        searchable
        searchPlaceholder="Search quotations..."
        loading={isLoading}
        onRowClick={(row) => setSelectedQuotation(row)}
      />
    </div>
  )
}
