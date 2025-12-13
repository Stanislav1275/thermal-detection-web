import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, XCircle } from 'lucide-react'

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
    const interval = setInterval(checkHealth, 30000) // Проверка каждые 30 секунд

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Thermal Detection</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">API:</span>
          {apiStatus === 'checking' && (
            <Badge variant="secondary">Проверка...</Badge>
          )}
          {apiStatus === 'online' && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Онлайн
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

