import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Plus, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface CashSalesReturn {
  id: string
  return_no: string
  cash_sale_id: string
  return_date: string
  status: string
  reason: string | null
  total_amount: number
  cash_sales?: { sale_no: string }
}

export function CashSalesReturnPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: returns = [], isLoading } = useSupabaseQuery<CashSalesReturn>(
    ['cash_sales_returns', companyId!],
    'cash_sales_returns',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, cash_sales(sale_no)')
          .order('return_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const columns = [
    {
      accessorKey: 'return_no',
      header: 'Return No',
    },
    {
      accessorKey: 'return_date',
      header: 'Return Date',
      cell: ({ row }: any) => format(new Date(row.original.return_date), 'PP'),
    },
    {
      accessorKey: 'cash_sales.sale_no',
      header: 'Cash Sale No',
      cell: ({ row }: any) => row.original.cash_sales?.sale_no || '-',
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
      cell: ({ row }: any) => `$${row.original.total_amount.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={
          row.original.status === 'posted' ? 'bg-green-100 text-green-800' :
          row.original.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cash Sales Return</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Return
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Sales Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={returns} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

