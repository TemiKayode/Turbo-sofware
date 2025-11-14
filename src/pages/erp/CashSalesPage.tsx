import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'

interface CashSaleItem {
  item_id: string
  item_name: string
  part_no: string
  quantity: number
  unit_price: number
  discount_percent: number
  total_amount: number
}

export function CashSalesPage() {
  const { user, companyId } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<CashSaleItem[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const { toast } = useToast()

  useEffect(() => {
    if (companyId) {
      fetchItems()
    }
  }, [companyId])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .limit(100)

      if (error) throw error
      setItems(data || [])
    } catch (error: any) {
      toast(error.message || 'Failed to fetch items', 'error')
    }
  }

  const handleItemSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.length >= 2) {
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('company_id', companyId!)
        .or(`part_no.ilike.%${term}%,item_name.ilike.%${term}%,barcode.ilike.%${term}%`)
        .limit(10)
      
      if (data && data.length > 0) {
        setSelectedItem(data[0])
      }
    }
  }

  const handleBarcodeScan = () => {
    // Simulate barcode scan
    toast('Barcode scanner activated. Scanning...', 'default')
    // In production, integrate with barcode scanner
  }

  const addItemToSale = () => {
    if (!selectedItem) return

    const quantity = 1 // Default, can be made editable
    const unitPrice = selectedItem.selling_price || 0
    const discountPercent = 0
    const totalAmount = quantity * unitPrice * (1 - discountPercent / 100)

    setSaleItems([
      ...saleItems,
      {
        item_id: selectedItem.id,
        item_name: selectedItem.item_name,
        part_no: selectedItem.part_no,
        quantity,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        total_amount: totalAmount,
      },
    ])

    setSelectedItem(null)
    setSearchTerm('')
  }

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.total_amount, 0)
    const tax = subtotal * 0.1 // 10% tax example
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleProcessSale = async () => {
    if (saleItems.length === 0) {
      toast('Please add items to the sale', 'error')
      return
    }

    try {
      const { subtotal, tax, total } = calculateTotals()
      const locationId = 'default-location' // Get from context

      // Create cash sale
      const { data: sale, error: saleError } = await supabase
        .from('cash_sales')
        .insert({
          company_id: companyId,
          sale_no: `CS-${Date.now()}`,
          location_id: locationId,
          sale_date: new Date().toISOString().split('T')[0],
          cashier_id: user?.id,
          status: 'pending',
          subtotal,
          tax_amount: tax,
          total_amount: total,
          payment_mode: paymentMode,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItemsData = saleItems.map(item => ({
        sale_id: sale.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        discount_amount: (item.unit_price * item.quantity * item.discount_percent) / 100,
        tax_percent: 10,
        tax_amount: (item.total_amount * 10) / 100,
        total_amount: item.total_amount,
        cost_amount: 0, // Calculate from average cost
      }))

      const { error: itemsError } = await supabase
        .from('cash_sale_items')
        .insert(saleItemsData)

      if (itemsError) throw itemsError

      // Post the sale (update stock, create accounting entries)
      const { error: postError } = await supabase
        .from('cash_sales')
        .update({ status: 'posted', posted_by: user?.id, posted_at: new Date().toISOString() })
        .eq('id', sale.id)

      if (postError) throw postError

      toast('Cash sale processed successfully', 'success')
      setSaleItems([])
      setPaymentMode('cash')
    } catch (error: any) {
      toast(error.message || 'Failed to process sale', 'error')
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cash Sales</h1>
        <Button onClick={handleBarcodeScan} variant="outline">
          📷 Scan Barcode
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Item Selection */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Item Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search by Part No, Name, or Barcode (Touch Selection)"
                  value={searchTerm}
                  onChange={(e) => handleItemSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && selectedItem) {
                      addItemToSale()
                    }
                  }}
                />

                {selectedItem && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{selectedItem.item_name}</p>
                        <p className="text-sm text-muted-foreground">Part No: {selectedItem.part_no}</p>
                        <p className="text-sm font-medium">Price: ${selectedItem.selling_price?.toFixed(2)}</p>
                      </div>
                      <Button onClick={addItemToSale}>Add to Sale</Button>
                    </div>
                  </div>
                )}

                {/* Sale Items */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Sale Items</h3>
                  {saleItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.unit_price.toFixed(2)} = ${item.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Payment Mode</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full" onClick={handleProcessSale} disabled={saleItems.length === 0}>
                Process Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


