import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clsx } from 'clsx'

interface Column<T> {
  header: string
  accessor?: keyof T | ((row: T) => React.ReactNode)
  accessorKey?: keyof T | string
  id?: string
  cell?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: any[]
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  loading?: boolean
  isLoading?: boolean
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Search...',
  onRowClick,
  actions,
  loading = false,
  isLoading,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const isActuallyLoading = loading || isLoading

  const filteredData = searchable
    ? data.filter((row) =>
        columns.some((col) => {
          const accessor = col.accessor || col.accessorKey
          const value =
            typeof accessor === 'function'
              ? accessor(row)
              : accessor && typeof accessor === 'string' && accessor in row
              ? (row as any)[accessor]
              : ''
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    : data

  if (isActuallyLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, rowIdx) => (
                <TableRow
                  key={row.id || rowIdx}
                  className={clsx(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, idx) => {
                    const accessor = col.accessor || col.accessorKey
                    const cellValue = col.cell 
                      ? col.cell(row)
                      : typeof accessor === 'function'
                      ? accessor(row)
                      : accessor && typeof accessor === 'string' && accessor in row
                      ? String((row as any)[accessor] || '')
                      : ''
                    return (
                      <TableCell key={col.id || idx} className={col.className}>
                        {cellValue}
                      </TableCell>
                    )
                  })}
                  {actions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {searchable && filteredData.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} results
        </div>
      )}
    </div>
  )
}

