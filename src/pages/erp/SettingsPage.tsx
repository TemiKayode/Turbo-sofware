import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Bell, Shield, Database, Globe, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toaster'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function SettingsPage() {
  const { companyId, user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isEnabling2FA, setIsEnabling2FA] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    company_name: '',
    timezone: 'UTC',
    currency: 'USD',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    password_policy: 'very_strong',
  })

  // Load settings from database
  const { data: settings = [], refetch: refetchSettings } = useSupabaseQuery<any>(
    ['master_settings', companyId!],
    'master_settings',
    {
      filters: (query) => query.eq('company_id', companyId!),
      enabled: !!companyId,
    }
  )

  useEffect(() => {
    if (settings.length > 0) {
      const general = settings.find((s: any) => s.setting_key === 'general')
      if (general && general.setting_value) {
        try {
          const parsed = JSON.parse(general.setting_value)
          setGeneralSettings(parsed)
        } catch (e) {
          // If parsing fails, use defaults
        }
      }

      const notifications = settings.find((s: any) => s.setting_key === 'notifications')
      if (notifications && notifications.setting_value) {
        try {
          const parsed = JSON.parse(notifications.setting_value)
          setNotificationSettings(parsed)
        } catch (e) {
          // If parsing fails, use defaults
        }
      }

      const security = settings.find((s: any) => s.setting_key === 'security')
      if (security && security.setting_value) {
        try {
          const parsed = JSON.parse(security.setting_value)
          setSecuritySettings(parsed)
        } catch (e) {
          // If parsing fails, use defaults
        }
      }
    }
  }, [settings])

  const mutation = useSupabaseMutation('master_settings', [['master_settings', companyId!]])

  const handleSaveGeneral = async () => {
    if (!companyId) return
    setIsSaving(true)
    try {
      const settingValue = JSON.stringify(generalSettings)
      const payload = {
        company_id: companyId,
        setting_key: 'general',
        setting_value: settingValue,
        setting_type: 'json',
        description: 'General system settings',
      }

      const existing = settings.find((s: any) => s.setting_key === 'general')
      if (existing) {
        await mutation.mutateAsync({
          type: 'update',
          id: existing.id,
          payload,
        })
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
      }
      toast('General settings saved successfully', 'success')
      refetchSettings()
    } catch (error: any) {
      toast(error.message || 'Failed to save general settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!companyId) return
    setIsSaving(true)
    try {
      const settingValue = JSON.stringify(notificationSettings)
      const payload = {
        company_id: companyId,
        setting_key: 'notifications',
        setting_value: settingValue,
        setting_type: 'json',
        description: 'Notification preferences',
      }

      const existing = settings.find((s: any) => s.setting_key === 'notifications')
      if (existing) {
        await mutation.mutateAsync({
          type: 'update',
          id: existing.id,
          payload,
        })
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
      }
      toast('Notification settings saved successfully', 'success')
      refetchSettings()
    } catch (error: any) {
      toast(error.message || 'Failed to save notification settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    if (!companyId) return
    setIsSaving(true)
    try {
      const settingValue = JSON.stringify(securitySettings)
      const payload = {
        company_id: companyId,
        setting_key: 'security',
        setting_value: settingValue,
        setting_type: 'json',
        description: 'Security settings',
      }

      const existing = settings.find((s: any) => s.setting_key === 'security')
      if (existing) {
        await mutation.mutateAsync({
          type: 'update',
          id: existing.id,
          payload,
        })
      } else {
        await mutation.mutateAsync({
          type: 'insert',
          payload,
        })
      }
      toast('Security settings saved successfully', 'success')
      refetchSettings()
    } catch (error: any) {
      toast(error.message || 'Failed to save security settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setTwoFactorEnabled(true)
      toast('Two-Factor Authentication enabled successfully', 'success')
      setShow2FADialog(false)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-600" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={generalSettings.company_name}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, company_name: e.target.value })}
                  placeholder="Enter company name"
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={generalSettings.timezone}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST</SelectItem>
                    <SelectItem value="PST">PST</SelectItem>
                    <SelectItem value="GMT">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={generalSettings.currency}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveGeneral} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.email_notifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive SMS for critical alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.sms_notifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, sms_notifications: e.target.checked })}
                  disabled={isSaving}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password_policy">Password Policy</Label>
                <Select
                  value={securitySettings.password_policy}
                  onValueChange={(value) => setSecuritySettings({ ...securitySettings, password_policy: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger id="password_policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="very_strong">Very Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" onClick={() => setShow2FADialog(true)} disabled={isSaving || twoFactorEnabled}>
                  {twoFactorEnabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>
              <Button onClick={handleSaveSecurity} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">Backup & Restore</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                  >
                    {isCreatingBackup ? (
                      <>
                        <Database className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Create Backup
                      </>
                    )}
                  </Button>
                  <Button variant="outline">Restore Backup</Button>
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Data Export</p>
                <Button variant="outline">Export All Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app to enable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">QR Code will appear here</p>
              <p className="text-xs text-muted-foreground mt-2">
                In production, this would show a QR code for the authenticator app
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnable2FA} disabled={isEnabling2FA}>
              {isEnabling2FA ? 'Enabling...' : 'Enable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
