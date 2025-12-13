import { useJobStore } from '@/store/jobStore'
import { useJobStatus } from '@/hooks/useJobs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

function getStatusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'destructive'
    case 'processing':
      return 'default'
    case 'queued':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'Завершено'
    case 'failed':
      return 'Ошибка'
    case 'processing':
      return 'Обработка'
    case 'queued':
      return 'В очереди'
    default:
      return status
  }
}

export function JobList() {
  const { jobHistory, currentJobId, setCurrentJobId, jobStatuses } = useJobStore()

  if (jobHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История задач</CardTitle>
          <CardDescription>Здесь будут отображаться ваши задачи</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История задач</CardTitle>
        <CardDescription>Выберите задачу для просмотра результатов</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {jobHistory.map((jobId) => (
          <JobListItem
            key={jobId}
            jobId={jobId}
            isActive={jobId === currentJobId}
            onClick={() => setCurrentJobId(jobId)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function JobListItem({ jobId, isActive, onClick }: { jobId: string; isActive: boolean; onClick: () => void }) {
  const { data: jobStatus, isLoading } = useJobStatus(jobId)
  const status = jobStatus?.status || 'queued'
  const progress = jobStatus
    ? (jobStatus.processed_images / jobStatus.total_images) * 100
    : 0

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent',
        isActive && 'ring-2 ring-primary bg-accent'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono">{jobId.slice(0, 8)}...</code>
          <Badge variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        </div>
        {jobStatus?.created_at && (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(jobStatus.created_at), {
              addSuffix: true,
              locale: ru,
            })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : jobStatus ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Обработано: {jobStatus.processed_images} / {jobStatus.total_images}
            </span>
            {jobStatus.images_with_detections > 0 && (
              <span className="text-detection">
                Детекций: {jobStatus.images_with_detections}
              </span>
            )}
          </div>
          {(status === 'processing' || status === 'queued') && (
            <Progress value={progress} className="h-2" />
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Нет данных</div>
      )}
    </div>
  )
}

