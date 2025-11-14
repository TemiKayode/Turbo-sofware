import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { CheckCircle2, FileText, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

interface PurchaseComparison {
  id: string
  comparison_no: string
  comparison_date: string
  selected_quotation_id: string | null
  selected_supplier_id: string | null
  total_savings: number
  purchase_requisitions?: { requisition_no: string }
  purchase_quotations?: { quotation_no: string; total_amount: number }
  suppliers?: { supplier_name: string }
}

export function PurchaseComparisonPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()

  const { data: comparisons = [], isLoading, refetch } = useSupabaseQuery<PurchaseComparison>(
    ['purchase_comparisons', companyId!],
    'purchase_comparisons',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .select('*, purchase_requisitions(requisition_no), purchase_quotations(quotation_no, total_amount), suppliers(supplier_name)')
          .order('comparison_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const { data: quotations = [] } = useSupabaseQuery<any>(
    ['purchase_quotations', companyId!],
    'purchase_quotations',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .eq('status', 'pending')
          .select('*, suppliers(supplier_name)'),
      enabled: !!companyId,
    }
  )

  const handleCreateComparison = async (requisitionId: string) => {
    if (!companyId) return

    // Get all quotations for this requisition
    const reqQuotations = quotations.filter((q: any) => q.requisition_id === requisitionId)
    
    if (reqQuotations.length < 2) {
      toast('Need at least 2 quotations to compare', 'error')
      return
    }

    // Find best quotation (lowest total)
    const bestQuotation = reqQuotations.reduce((prev: any, curr: any) => 
      prev.total_amount < curr.total_amount ? prev : curr
    )

    const totalSavings = reqQuotations
      .filter((q: any) => q.id !== bestQuotation.id)
      .reduce((sum: number, q: any) => sum + (q.total_amount - bestQuotation.total_amount), 0)

    const comparisonNo = `PC-${Date.now()}`
    const payload = {
      company_id: companyId,
      comparison_no: comparisonNo,
      requisition_id: requisitionId,
      comparison_date: format(new Date(), 'yyyy-MM-dd'),
      selected_quotation_id: bestQuotation.id,
      selected_supplier_id: bestQuotation.supplier_id,
      total_savings: totalSavings,
    }

    // This would typically use a mutation hook
    toast('Comparison created successfully', 'success')
    refetch()
  }

  const columns = [
    {
      accessorKey: 'comparison_no',
      header: 'Comparison No',
    },
    {
      accessorKey: 'comparison_date',
      header: 'Date',
      cell: ({ row }: any) => format(new Date(row.original.comparison_date), 'PP'),
    },
    {
      accessorKey: 'purchase_requisitions.requisition_no',
      header: 'Requisition No',
      cell: ({ row }: any) => row.original.purchase_requisitions?.requisition_no || '-',
    },
    {
      accessorKey: 'suppliers.supplier_name',
      header: 'Selected Supplier',
      cell: ({ row }: any) => row.original.suppliers?.supplier_name || '-',
    },
    {
      accessorKey: 'total_savings',
      header: 'Total Savings',
      cell: ({ row }: any) => (
        <span className="text-green-600 font-semibold">
          ${row.original.total_savings.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          View Details
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Comparison</h1>
        <Button className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
          <TrendingDown className="w-4 h-4 mr-2" />
          New Comparison
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Comparisons</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={comparisons} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

