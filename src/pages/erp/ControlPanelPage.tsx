import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Building2, Users, Shield, Globe, DollarSign, Calendar, FileText, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ControlPanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-600" />
          Control Panel
        </h1>
        <p className="text-gray-600 mt-1">Manage system settings, users, and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/erp/control-panel/branches">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Branches</h3>
                  <p className="text-sm text-muted-foreground">Manage company branches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/departments">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Departments</h3>
                  <p className="text-sm text-muted-foreground">Organizational departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Users</h3>
                  <p className="text-sm text-muted-foreground">Manage system users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/roles">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Roles</h3>
                  <p className="text-sm text-muted-foreground">User roles & permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Settings</h3>
                  <p className="text-sm text-muted-foreground">System settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/account-settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Account Settings</h3>
                  <p className="text-sm text-muted-foreground">Company information</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/currency">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Currency</h3>
                  <p className="text-sm text-muted-foreground">Manage currencies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/exchange-rate">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <Globe className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Exchange Rates</h3>
                  <p className="text-sm text-muted-foreground">Currency exchange rates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/financial-year">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Financial Year</h3>
                  <p className="text-sm text-muted-foreground">Financial periods</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/master-settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <FileText className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Master Settings</h3>
                  <p className="text-sm text-muted-foreground">System configurations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/authorization">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Authorization</h3>
                  <p className="text-sm text-muted-foreground">Access control</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/erp/control-panel/role-assignment">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
                  <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Role Assignment</h3>
                  <p className="text-sm text-muted-foreground">Assign roles to users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
