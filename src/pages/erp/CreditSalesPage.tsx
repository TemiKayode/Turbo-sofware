import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Plus, FileText, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface CreditSale {
  id: string
  invoice_no: string
  customer_id: string
  invoice_date: string
  due_date: string | null
  status: string
  total_amount: number
  balance: number
  customers?: { customer_name: string }
}

export function CreditSalesPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: creditSales = [], isLoading } = useSupabaseQuery<CreditSale>(
    ['credit_sales', companyId!],
    'sales_invoices',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .eq('payment_mode', 'credit')
          .select('*, customers(customer_name)')
          .order('invoice_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const columns = [
    {
      accessorKey: 'invoice_no',
      header: 'Invoice No',
    },
    {
      accessorKey: 'invoice_date',
      header: 'Invoice Date',
      cell: ({ row }: any) => format(new Date(row.original.invoice_date), 'PP'),
    },
    {
      accessorKey: 'customers.customer_name',
      header: 'Customer',
      cell: ({ row }: any) => row.original.customers?.customer_name || '-',
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
      cell: ({ row }: any) => `$${row.original.total_amount.toFixed(2)}`,
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }: any) => (
        <span className={row.original.balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
          ${row.original.balance.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={
          row.original.status === 'paid' ? 'bg-green-100 text-green-800' :
          row.original.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            View
          </Button>
          {row.original.balance > 0 && (
            <Button variant="outline" size="sm" className="text-green-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Receive Payment
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credit Sales</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Credit Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={creditSales} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

