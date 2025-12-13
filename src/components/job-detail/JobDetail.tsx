import { useJobStatus } from '@/hooks/useJobs'
import { useJobStore } from '@/store/jobStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'processing':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    case 'queued':
      return <Clock className="h-5 w-5 text-yellow-500" />
    default:
      return null
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

export function JobDetail() {
  const { currentJobId, setCurrentJobId } = useJobStore()
  const { data: jobStatus, isLoading, error } = useJobStatus(currentJobId)

  if (!currentJobId) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Загрузка...</div>
        </CardContent>
      </Card>
    )
  }

  if (error || !jobStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ошибка</CardTitle>
          <CardDescription>Не удалось загрузить информацию о задаче</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const progress = jobStatus.total_images > 0
    ? (jobStatus.processed_images / jobStatus.total_images) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentJobId(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Задача {jobStatus.job_id.slice(0, 8)}</CardTitle>
              <CardDescription>
                {formatDistanceToNow(new Date(jobStatus.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(jobStatus.status)}
            <Badge variant={jobStatus.status === 'completed' ? 'success' : jobStatus.status === 'failed' ? 'destructive' : 'default'}>
              {getStatusLabel(jobStatus.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Прогресс обработки</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Всего изображений</p>
            <p className="text-2xl font-bold">{jobStatus.total_images}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Обработано</p>
            <p className="text-2xl font-bold">{jobStatus.processed_images}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">С детекциями</p>
            <p className="text-2xl font-bold text-detection">
              {jobStatus.images_with_detections}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Порог уверенности</p>
            <p className="text-2xl font-bold">
              {jobStatus.parameters?.confidence_threshold?.toFixed(2) || '0.50'}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Создано:</span>
            <span>{new Date(jobStatus.created_at).toLocaleString('ru-RU')}</span>
          </div>
          {jobStatus.completed_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Завершено:</span>
              <span>{new Date(jobStatus.completed_at).toLocaleString('ru-RU')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

