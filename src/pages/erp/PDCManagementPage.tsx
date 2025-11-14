import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Plus, Bell, TrendingUp, FileText } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PDCCheque {
  id: string
  cheque_no: string
  cheque_date: string
  due_date: string
  amount: number
  drawer_name: string
  bank_name: string
  pdc_type: string
  status: string
  reference_type: string | null
  reference_id: string | null
}

export function PDCManagementPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('receivable')

  const [formData, setFormData] = useState({
    cheque_no: '',
    cheque_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    drawer_name: '',
    bank_name: '',
    pdc_type: 'receivable',
  })

  const { data: pdcCheques = [], isLoading, refetch } = useSupabaseQuery<PDCCheque>(
    ['pdc_cheques', companyId!, activeTab],
    'pdc_cheques',
    {
      filters: (query) =>
        query
          .eq('company_id', companyId!)
          .eq('pdc_type', activeTab)
          .order('due_date', { ascending: true }),
      enabled: !!companyId,
    }
  )

  const { mutate: createPDC } = useSupabaseMutation('pdc_cheques', {
    onSuccess: () => {
      toast('PDC created successfully', 'success')
      setDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast(error.message || 'Failed to create PDC', 'error')
    },
  })

  const resetForm = () => {
    setFormData({
      cheque_no: '',
      cheque_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      drawer_name: '',
      bank_name: '',
      pdc_type: activeTab,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !user) return

    const payload = {
      company_id: companyId,
      cheque_no: formData.cheque_no,
      cheque_date: formData.cheque_date,
      due_date: formData.due_date,
      amount: parseFloat(formData.amount),
      drawer_name: formData.drawer_name,
      bank_name: formData.bank_name,
      pdc_type: formData.pdc_type,
      status: 'pending',
      created_by: user.id,
    }

    createPDC({ data: payload, method: 'POST' })
  }

  const columns = [
    {
      accessorKey: 'cheque_no',
      header: 'Cheque No',
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }: any) => format(new Date(row.original.due_date), 'PP'),
    },
    {
      accessorKey: 'drawer_name',
      header: 'Drawer',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => `$${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge className={
          row.original.status === 'cleared' ? 'bg-green-100 text-green-800' :
          row.original.status === 'bounced' ? 'bg-red-100 text-red-800' :
          row.original.status === 'discounted' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
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
          {row.original.status === 'pending' && (
            <Button variant="outline" size="sm" className="text-blue-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Discount
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PDC Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New PDC
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Post Dated Cheque</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>PDC Type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.pdc_type}
                  onChange={(e) => setFormData({ ...formData, pdc_type: e.target.value })}
                  required
                >
                  <option value="receivable">Receivable</option>
                  <option value="payable">Payable</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cheque No *</Label>
                  <Input
                    value={formData.cheque_no}
                    onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Cheque Date *</Label>
                  <Input
                    type="date"
                    value={formData.cheque_date}
                    onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Drawer Name *</Label>
                  <Input
                    value={formData.drawer_name}
                    onChange={(e) => setFormData({ ...formData, drawer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                  Create PDC
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Post Dated Cheques</CardTitle>
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              View Reminders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="receivable">Receivables</TabsTrigger>
              <TabsTrigger value="payable">Payables</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <DataTable columns={columns} data={pdcCheques} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

