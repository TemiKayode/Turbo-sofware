import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  change: number
  data: number[]
  formatValue?: (value: number | string) => string
}

export function MetricCard({ title, value, change, data, formatValue }: MetricCardProps) {
  const isPositive = change >= 0
  const formattedValue = formatValue ? formatValue(value) : value.toString()

  // Simple sparkline using SVG
  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1
  const width = 80
  const height = 48
  const padding = 4
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1 || 1)) * (width - padding * 2) + padding
    const y = height - padding - ((val - minValue) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
            {formattedValue}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}%
            </span>
            <span className="text-gray-500 dark:text-gray-400">vs last month</span>
          </div>
        </div>
        <div className="w-20 h-12 flex-shrink-0">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              points={points}
              fill="none"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

