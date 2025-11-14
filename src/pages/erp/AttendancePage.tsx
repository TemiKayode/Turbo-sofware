import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Search, Download, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { DataTable } from '@/components/DataTable'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export function AttendancePage() {
  const { companyId } = useAuth()
  const [search, setSearch] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: attendance = [], isLoading } = useSupabaseQuery<any>(
    ['attendance', companyId!, attendanceDate],
    'attendance',
    {
      filters: (query) => query.eq('company_id', companyId!).eq('attendance_date', attendanceDate).order('attendance_date', { ascending: false }),
      enabled: !!companyId,
    }
  )

  const filteredAttendance = attendance.filter((att: any) =>
    att.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    att.employee_id?.toLowerCase().includes(search.toLowerCase())
  )

  const presentCount = attendance.filter((att: any) => att.status === 'present').length
  const absentCount = attendance.filter((att: any) => att.status === 'absent').length

  const columns = [
    { header: 'Employee', accessor: (row: any) => row.employee_name || 'N/A' },
    { header: 'Employee ID', accessor: (row: any) => row.employee_id || 'N/A' },
    { header: 'Check In', accessor: (row: any) => row.check_in_time ? format(new Date(row.check_in_time), 'hh:mm a') : 'N/A' },
    { header: 'Check Out', accessor: (row: any) => row.check_out_time ? format(new Date(row.check_out_time), 'hh:mm a') : 'N/A' },
    { header: 'Hours', accessor: (row: any) => row.total_hours || '0' },
    { header: 'Status', accessor: (row: any) => (
      <Badge variant={row.status === 'present' ? 'success' : 'destructive'}>
        {row.status === 'present' ? 'Present' : 'Absent'}
      </Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            Attendance
          </h1>
          <p className="text-gray-600 mt-1">Track employee attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-48"
          />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{attendance.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{presentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Attendance Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                className="pl-10 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredAttendance}
            columns={columns}
            loading={isLoading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
