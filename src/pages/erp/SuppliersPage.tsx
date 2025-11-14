import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { format } from 'date-fns'

interface Supplier {
  id: string
  supplier_code: string
  supplier_name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  tax_id: string | null
  credit_limit: number
  balance: number
  is_active: boolean
  created_at: string
}

export function SuppliersPage() {
  const { companyId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    supplier_code: '',
    supplier_name: '',
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
    payment_terms: '',
  })

  const { data: suppliers = [], isLoading, refetch } = useSupabaseQuery<Supplier>(
    ['suppliers', companyId!],
    'suppliers',
    {
      filters: (query) => query.eq('company_id', companyId!).order('supplier_name'),
      enabled: !!companyId,
    }
  )

  const mutation = useSupabaseMutation<Supplier>('suppliers', [['suppliers', companyId!]])

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        supplier_code: supplier.supplier_code,
        supplier_name: supplier.supplier_name,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        country: supplier.country || '',
        postal_code: '',
        tax_id: supplier.tax_id || '',
        credit_limit: supplier.credit_limit.toString(),
        payment_terms: '',
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        supplier_code: '',
        supplier_name: '',
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
        payment_terms: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      if (editingSupplier) {
        await mutation.mutateAsync({
          type: 'update',
          id: editingSupplier.id,
          payload: {
            supplier_code: formData.supplier_code,
            supplier_name: formData.supplier_name,
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
            payment_terms: formData.payment_terms || null,
          },
        })
        toast('Supplier updated successfully', 'success')
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload: {
            company_id: companyId,
            supplier_code: formData.supplier_code,
            supplier_name: formData.supplier_name,
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
            payment_terms: formData.payment_terms || null,
          },
        })
        toast('Supplier created successfully', 'success')
      }
      setDialogOpen(false)
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to save supplier', 'error')
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete ${supplier.supplier_name}?`)) return

    try {
      await mutation.mutateAsync({
        type: 'delete',
        id: supplier.id,
      })
      toast('Supplier deleted successfully', 'success')
      refetch()
    } catch (error: any) {
      toast(error.message || 'Failed to delete supplier', 'error')
    }
  }

  const columns = [
    { header: 'Code', accessor: 'supplier_code' as keyof Supplier },
    { header: 'Name', accessor: 'supplier_name' as keyof Supplier },
    { header: 'Contact Person', accessor: 'contact_person' as keyof Supplier },
    { header: 'Email', accessor: 'email' as keyof Supplier },
    { header: 'Phone', accessor: 'phone' as keyof Supplier },
    {
      header: 'Balance',
      accessor: (row: Supplier) => (
        <span className={row.balance > 0 ? 'text-red-600' : 'text-green-600'}>
          ${row.balance.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Supplier) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers Master</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>Create Supplier</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Create New Supplier'}</DialogTitle>
              <DialogDescription>
                {editingSupplier ? 'Update supplier information' : 'Add a new supplier to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_code">Supplier Code *</Label>
                  <Input
                    id="supplier_code"
                    value={formData.supplier_code}
                    onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier_name">Supplier Name *</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
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
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        searchable
        searchPlaceholder="Search suppliers..."
        loading={isLoading}
        actions={(supplier) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(supplier)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(supplier)}>
              Delete
            </Button>
          </div>
        )}
      />
    </div>
  )
}
