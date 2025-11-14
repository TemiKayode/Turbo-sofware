import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageSkeleton, InvoiceSkeleton } from '@/components/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { FileText, Download, DollarSign, Calendar } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Invoice = Database['public']['Tables']['invoices']['Row']

export function InvoicesPage() {
  const { user, companyId } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
        if (!companyId) {
          toast('No company associated with your account. Please create a company first.', 'default')
        }
      }
    }, 5000)

    fetchInvoices()

    return () => clearTimeout(timeoutId)
  }, [user, companyId])

  const fetchInvoices = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Fetch invoices for user's company
      // First get user's company_id if not in context
      let userCompanyId = companyId
      
      if (!userCompanyId) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (userData?.company_id) {
          userCompanyId = userData.company_id
        } else {
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', userCompanyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error: any) {
      toast(error.message || 'Failed to fetch invoices', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePayInvoice = async (invoice: Invoice) => {
    try {
      // Create Stripe payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          invoiceId: invoice.id,
          amount: invoice.amount,
          currency: invoice.currency,
        },
      })

      if (error) throw error

      if (data?.clientSecret) {
        // Redirect to Stripe Checkout or use Stripe Elements
        const stripe = (window as any).Stripe
        if (stripe) {
          // This would integrate with Stripe.js for payment
          toast('Redirecting to payment...', 'default')
        }
      }
    } catch (error: any) {
      toast(error.message || 'Failed to process payment', 'error')
    }
  }

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Open</Badge>
      case 'void':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Void</Badge>
      case 'uncollectible':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Uncollectible</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No invoices yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Invoices will appear here when created. You can create invoices from your subscription or billing settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-all border-l-4 border-l-[#2CA01C]">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#2CA01C]/10 dark:bg-[#2CA01C]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#2CA01C]" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Invoice #{invoice.id.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {format(new Date(invoice.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {invoice.currency.toUpperCase()} {(invoice.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due Date
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(invoice.due_date), 'PP')}
                        </span>
                      </div>
                    )}
                    {invoice.paid_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Paid At</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {format(new Date(invoice.paid_at), 'PPp')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {invoice.status === 'open' && (
                      <Button 
                        onClick={() => handlePayInvoice(invoice)}
                        className="flex-1 bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Pay Invoice
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}


