import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Breadcrumbs } from '@/components/breadcrumbs/Breadcrumbs'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function Header() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.health()
        setApiStatus('online')
      } catch {
        setApiStatus('offline')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 overflow-x-hidden min-w-0">
      <SidebarTrigger className="-ml-1 flex-shrink-0" />
      <Separator orientation="vertical" className="mr-2 h-4 flex-shrink-0" />
      <div className="flex flex-1 items-center justify-between min-w-0 overflow-x-hidden">
        <div className="min-w-0 flex-1 overflow-x-hidden">
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-muted-foreground">Статус:</span>
          {apiStatus === 'checking' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Проверка...
            </Badge>
          )}
          {apiStatus === 'online' && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Работает
            </Badge>
          )}
          {apiStatus === 'offline' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Офлайн
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
}
