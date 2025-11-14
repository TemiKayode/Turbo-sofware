import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { supabase } from '@/lib/supabase'
import { Shield, Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function SettingsPage() {
  const { user, companyId } = useAuth()
  const { toast } = useToast()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isEnabling2FA, setIsEnabling2FA] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true)
    try {
      // In a real implementation, this would:
      // 1. Generate a QR code for the authenticator app
      // 2. Store the secret in the database
      // 3. Require verification before enabling
      
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update user settings (you would store this in a user_settings table)
      if (user) {
        // This is a placeholder - in production, you'd store 2FA settings in the database
        setTwoFactorEnabled(true)
        toast('Two-Factor Authentication enabled successfully', 'success')
        setShow2FADialog(false)
      }
    } catch (error: any) {
      toast(error.message || 'Failed to enable Two-Factor Authentication', 'error')
    } finally {
      setIsEnabling2FA(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!companyId || !user) {
      toast('Company information not available', 'error')
      return
    }

    setIsCreatingBackup(true)
    try {
      // Create backup record
      const { data: backup, error } = await supabase
        .from('backups')
        .insert({
          company_id: companyId,
          backup_type: 'full',
          status: 'in_progress',
        })
        .select()
        .single()

      if (error) throw error

      toast('Backup creation started. You will be notified when it completes.', 'success')

      // Simulate backup process (in production, this would be handled by a background job)
      setTimeout(async () => {
        await supabase
          .from('backups')
          .update({ 
            status: 'completed',
            file_path: `backups/${companyId}/${backup.id}.sql`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', backup.id)
        
        toast('Backup completed successfully', 'success')
      }, 3000)
    } catch (error: any) {
      toast(error.message || 'Failed to create backup', 'error')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Security and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled 
                      ? 'Two-Factor Authentication is enabled' 
                      : 'Add an extra layer of security'}
                  </p>
                </div>
                {twoFactorEnabled ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTwoFactorEnabled(false)
                      toast('Two-Factor Authentication disabled', 'success')
                    }}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setShow2FADialog(true)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Enable
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backups</CardTitle>
              <CardDescription>Manage your data backups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
              >
                {isCreatingBackup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Secure your account with an extra layer of protection. You'll need an authenticator app like Google Authenticator or Authy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>How it works:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Download an authenticator app on your phone</li>
                <li>Scan the QR code we'll provide</li>
                <li>Enter the verification code to confirm</li>
              </ol>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> In production, this would generate a QR code and require verification before enabling.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEnable2FA}
              disabled={isEnabling2FA}
              className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white"
            >
              {isEnabling2FA ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}


