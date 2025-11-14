import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, Calendar, DollarSign, UserCheck, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HRDashboardPage() {
  const { companyId } = useAuth()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onLeave: 0,
    pendingRequests: 0,
    thisMonthPayroll: 0,
  })

  useEffect(() => {
    if (companyId) {
      fetchStats()
    }
  }, [companyId])

  const fetchStats = async () => {
    try {
      const [employeesRes, leaveRes] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact' }).eq('company_id', companyId!),
        supabase.from('leave_requests').select('id, status').eq('company_id', companyId!),
      ])

      const totalEmployees = employeesRes.count || 0
      const leaveRequests = leaveRes.data || []
      const onLeave = leaveRequests.filter((l: any) => l.status === 'approved').length
      const pendingRequests = leaveRequests.filter((l: any) => l.status === 'pending').length

      setStats({ totalEmployees, onLeave, pendingRequests, thisMonthPayroll: 0 })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-pink-600" />
            HR & Payroll Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage employees, attendance, and payroll</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.totalEmployees}</div>
            <p className="text-sm text-muted-foreground mt-1">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.onLeave}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently on leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${stats.thisMonthPayroll.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">Total payroll</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/hr/employees">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Employees
              </Button>
            </Link>
            <Link to="/erp/hr/attendance">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Attendance
              </Button>
            </Link>
            <Link to="/erp/hr/leave">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Leave Requests
              </Button>
            </Link>
            <Link to="/erp/hr/payroll">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>HR Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/erp/hr/shift">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Shift Management
              </Button>
            </Link>
            <Link to="/erp/hr/advance-loan">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Advance Loans
              </Button>
            </Link>
            <Link to="/erp/hr/deduction">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Deductions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
