import { useNavigate, useParams } from 'react-router-dom'
import { useJobStore } from '@/store/jobStore'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Breadcrumbs() {
  const navigate = useNavigate()
  const { jobId } = useParams<{ jobId?: string }>()
  const { currentJobId } = useJobStore()
  const displayJobId = jobId || currentJobId

  return (
    <Breadcrumb className="min-w-0 overflow-x-hidden">
      <BreadcrumbList className="min-w-0 flex-wrap">
        <BreadcrumbItem>
          {displayJobId ? (
            <BreadcrumbLink asChild>
              <button
                onClick={() => navigate('/')}
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
                  "hover:text-foreground text-muted-foreground"
                )}
              >
                <Home className="h-4 w-4" />
                Главная
              </button>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Главная
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {displayJobId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                Задача {displayJobId.slice(0, 8)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

