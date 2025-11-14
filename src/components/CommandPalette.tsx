import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Home, Building2, Users, FileText, DollarSign, Receipt, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog'

interface Command {
  id: string
  label: string
  icon: React.ElementType
  href: string
  keywords: string[]
}

const commands: Command[] = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: Home, href: '/dashboard', keywords: ['dashboard', 'home'] },
  { id: 'companies', label: 'Go to Companies', icon: Building2, href: '/companies', keywords: ['companies', 'company'] },
  { id: 'users', label: 'Go to Users', icon: Users, href: '/users', keywords: ['users', 'user'] },
  { id: 'documents', label: 'Go to Documents', icon: FileText, href: '/documents', keywords: ['documents', 'document'] },
  { id: 'subscription', label: 'Go to Subscription', icon: DollarSign, href: '/subscription', keywords: ['subscription', 'billing'] },
  { id: 'invoices', label: 'Go to Invoices', icon: Receipt, href: '/invoices', keywords: ['invoices', 'invoice'] },
  { id: 'settings', label: 'Go to Settings', icon: Settings, href: '/settings', keywords: ['settings', 'setting'] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const filteredCommands = commands.filter((cmd) => {
    const query = searchQuery.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.keywords.some((keyword) => keyword.includes(query))
    )
  })

  const handleSelect = (href: string) => {
    navigate(href)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm"
            autoFocus
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              No results found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{cmd.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

