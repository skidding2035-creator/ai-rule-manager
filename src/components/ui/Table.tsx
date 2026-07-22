import { useMemo, useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  sortValue?: (row: T) => string | number
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

export function Table<T>({ columns, rows, rowKey, onRowClick }: TableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null)

  const sortedRows = useMemo(() => {
    const column = sort ? columns.find((c) => c.key === sort.key) : undefined
    if (!sort || !column?.sortValue) return rows
    const sortValue = column.sortValue
    return rows
      .map((row, index) => ({ row, index, value: sortValue(row) }))
      .sort((a, b) => {
        if (a.value < b.value) return sort.direction === 'asc' ? -1 : 1
        if (a.value > b.value) return sort.direction === 'asc' ? 1 : -1
        return a.index - b.index
      })
      .map((entry) => entry.row)
  }, [rows, sort, columns])

  const toggleSort = (column: TableColumn<T>) => {
    if (!column.sortValue) return
    setSort((prev) => {
      if (prev?.key !== column.key) return { key: column.key, direction: 'asc' }
      if (prev.direction === 'asc') return { key: column.key, direction: 'desc' }
      return null
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-gray-500">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col)}
                className={clsx(
                  'pb-3 pr-4 font-medium',
                  col.sortValue && 'cursor-pointer select-none hover:text-gray-300',
                )}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortValue &&
                    (sort?.key === col.key ? (
                      sort.direction === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-0" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedRows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(onRowClick && 'cursor-pointer hover:bg-white/5')}
            >
              {columns.map((col) => (
                <td key={col.key} className={clsx('py-3 pr-4 text-gray-300', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
