import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'

interface Customer {
  id: string
  customer_code: string
  customer_name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  tax_id: string | null
  credit_limit: number
  credit_days: number
  balance: number
  is_export_customer: boolean
  is_active: boolean
  created_at: string
}

export function CustomersPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    tax_id: '',
    credit_limit: '',
    credit_days: '',
    is_export_customer: false,
  })

  const { data: customers = [], isLoading, refetch } = useSupabaseQuery<Customer>(
    ['customers', companyId!],
    'customers',
    {
      filters: (query) => query.eq('company_id', companyId!).order('customer_name'),
      enabled: !!companyId,
    }
  )

  const mutation = useSupabaseMutation<Customer>('customers', [['customers', companyId!]])

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        customer_code: customer.customer_code,
        customer_name: customer.customer_name,
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        postal_code: '',
        tax_id: customer.tax_id || '',
        credit_limit: customer.credit_limit.toString(),
        credit_days: customer.credit_days.toString(),
        is_export_customer: customer.is_export_customer,
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        customer_code: '',
        customer_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        tax_id: '',
        credit_limit: '',
        credit_days: '',
        is_export_customer: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      const payload = {
        company_id: companyId,
        customer_code: formData.customer_code,
        customer_name: formData.customer_name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        tax_id: formData.tax_id || null,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        credit_days: parseInt(formData.credit_days) || 0,
        is_export_customer: formData.is_export_customer,
      }

      if (editingCustomer) {
        await mutation.mutateAsync({
          type: 'update',
          id: editingCustomer.id,
          payload,
        })
        toast('Customer updated successfully', 'success')
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
        toast('Customer created successfully', 'success')
      }
      setDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to save customer', 'error')
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.customer_name}?`)) return

    try {
      await mutation.mutateAsync({
        type: 'delete',
        id: customer.id,
      })
      toast('Customer deleted successfully', 'success')
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to delete customer', 'error')
    }
  }

  const columns = [
    { header: 'Code', accessor: 'customer_code' as keyof Customer },
    { header: 'Name', accessor: 'customer_name' as keyof Customer },
    { header: 'Contact Person', accessor: 'contact_person' as keyof Customer },
    { header: 'Email', accessor: 'email' as keyof Customer },
    { header: 'Phone', accessor: 'phone' as keyof Customer },
    {
      header: 'Balance',
      accessor: (row: Customer) => (
        <span className={row.balance > 0 ? 'text-red-600' : 'text-green-600'}>
          ${row.balance.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (row: Customer) => (
        <Badge variant={row.is_export_customer ? 'default' : 'secondary'}>
          {row.is_export_customer ? 'Export' : 'Local'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Customer) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers Master</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>Create Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Create New Customer'}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information' : 'Add a new customer to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_code">Customer Code *</Label>
                  <Input
                    id="customer_code"
                    value={formData.customer_code}
                    onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="credit_limit">Credit Limit</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="credit_days">Credit Days</Label>
                  <Input
                    id="credit_days"
                    type="number"
                    value={formData.credit_days}
                    onChange={(e) => setFormData({ ...formData, credit_days: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_export_customer"
                    checked={formData.is_export_customer}
                    onChange={(e) => setFormData({ ...formData, is_export_customer: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_export_customer">Export Customer</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        searchable
        searchPlaceholder="Search customers..."
        loading={isLoading}
        actions={(customer) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(customer)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(customer)}>
              Delete
            </Button>
          </div>
        )}
      />
    </div>
  )
}
