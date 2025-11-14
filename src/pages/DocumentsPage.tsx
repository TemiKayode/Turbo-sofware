import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageSkeleton } from '@/components/LoadingSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { Upload, Download, Check } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Document = Database['public']['Tables']['documents']['Row']

export function DocumentsPage() {
  const { user, companyId } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    fetchDocuments()

    return () => clearTimeout(timeoutId)
  }, [user])

  const fetchDocuments = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Fetch documents linked to the user (user_id) and optionally filtered by company
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // If companyId exists, also filter by company for additional security
      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error: any) {
      toast(error.message || 'Failed to fetch documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return

    const file = e.target.files[0]
    setUploading(true)

    try {
      // Get or create company for user
      let userCompanyId = companyId
      
      if (!userCompanyId) {
        // Check if user has a company
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (userData?.company_id) {
          userCompanyId = userData.company_id
        } else {
          // Create a default company for the user
          const companyName = user.email?.split('@')[0] + "'s Company"
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              owner_id: user.id,
              subscription_tier: 'free',
              max_users: 1,
              max_companies: 1,
              max_documents: 10,
            })
            .select()
            .single()
          
          if (companyError) throw companyError
          if (newCompany) {
            userCompanyId = newCompany.id
            // Update user's company_id
            await supabase
              .from('users')
              .update({ company_id: newCompany.id })
              .eq('id', user.id)
          }
        }
      }

      if (!userCompanyId) {
        toast('Unable to create company. Please try again.', 'error')
        return
      }

      // Check subscription limits
      const { data: company } = await supabase
        .from('companies')
        .select('max_documents')
        .eq('id', userCompanyId)
        .single()

      const currentCount = documents.length
      const maxDocuments = company?.max_documents || 10

      if (currentCount >= maxDocuments) {
        toast(`You have reached your subscription limit of ${maxDocuments} documents`, 'error')
        return
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${userCompanyId}/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document record - linked to both user and company
      const { error: docError } = await supabase.from('documents').insert({
        company_id: userCompanyId,
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        encrypted: false,
        legal_accepted: false,
      })

      if (docError) throw docError

      toast('Document uploaded successfully', 'success')
      fetchDocuments()
    } catch (error: any) {
      toast(error.message || 'Failed to upload document', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      toast(error.message || 'Failed to download document', 'error')
    }
  }

  const handleLegalAcceptance = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ legal_accepted: true })
        .eq('id', docId)

      if (error) throw error

      toast('Legal document accepted', 'success')
      fetchDocuments()
    } catch (error: any) {
      toast(error.message || 'Failed to accept document', 'error')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No documents yet. Upload your first document to get started.
              </p>
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle>{doc.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="font-medium">Size:</span> {(doc.file_size / 1024).toFixed(2)} KB
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {doc.file_type}
                  </div>
                  <div>
                    <span className="font-medium">Legal Accepted:</span>{' '}
                    {doc.legal_accepted ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownload(doc)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {!doc.legal_accepted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLegalAcceptance(doc.id)}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  )}
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


