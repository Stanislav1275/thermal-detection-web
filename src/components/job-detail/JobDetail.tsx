import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useJobStatus, useUpdateJobName, useJobResults, useDeleteJob } from '@/hooks/useJobs'
import { useJobStore } from '@/store/jobStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { ExportDialog } from '@/components/export-dialog/ExportDialog'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, Image, CheckCircle, Target, Settings, Edit2, Check, X, Download, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { cn } from '@/lib/utils'

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

function JobDetailContent({ currentJobId }: { currentJobId: string }) {
  const navigate = useNavigate()
  const { data: jobStatus, isLoading, error } = useJobStatus(currentJobId)
  
  // Если задача не найдена или удалена, перенаправляем на главную
  useEffect(() => {
    if (error && !isLoading) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [error, isLoading, navigate])
  const { data: jobResults } = useJobResults(currentJobId)
  const updateNameMutation = useUpdateJobName()
  const deleteJobMutation = useDeleteJob()
  const { toast } = useToast()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleSaveName = async () => {
    if (!jobStatus || !editedName.trim()) {
      setIsEditingName(false)
      return
    }
    try {
      await updateNameMutation.mutateAsync({
        jobId: currentJobId,
        name: editedName.trim(),
      })
      setIsEditingName(false)
      toast({
        title: 'Успешно',
        description: 'Название задачи обновлено',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить название задачи',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteJob = async () => {
    try {
      await deleteJobMutation.mutateAsync(currentJobId)
      toast({
        title: 'Успешно',
        description: 'Задача удалена',
      })
      setDeleteDialogOpen(false)
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.detail || 'Не удалось удалить задачу',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !jobStatus) {
    return (
      <Card className="border-destructive/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Ошибка
          </CardTitle>
          <CardDescription>Не удалось загрузить информацию о задаче</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const progress = jobStatus.total_images > 0
    ? (jobStatus.processed_images / jobStatus.total_images) * 100
    : 0

  return (
    <Card className="shadow-sm overflow-x-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
                <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Название задачи"
                    className="h-8 text-lg font-semibold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName()
                      }
                      if (e.key === 'Escape') {
                        setIsEditingName(false)
                        setEditedName('')
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveName}
                    disabled={updateNameMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setIsEditingName(false)
                      setEditedName('')
                    }}
                    disabled={updateNameMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <CardTitle className="text-xl truncate">
                    {jobStatus.name || `Задача ${jobStatus.job_id.slice(0, 8)}`}
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setEditedName(jobStatus.name || '')
                      setIsEditingName(true)
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <CardDescription className="text-sm">
                Создано {formatDistanceToNow(new Date(jobStatus.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {jobStatus.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Экспорт
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleteJobMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
            {getStatusIcon(jobStatus.status)}
            <Badge 
              variant={jobStatus.status === 'completed' ? 'success' : jobStatus.status === 'failed' ? 'destructive' : 'default'}
              className="text-sm font-semibold px-3 py-1"
            >
              {getStatusLabel(jobStatus.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        {(jobStatus.status === 'processing' || jobStatus.status === 'queued') && (
          <div className="space-y-2.5 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <Loader2 className={cn(
                  "h-3.5 w-3.5",
                  jobStatus.status === 'processing' && "animate-spin text-primary"
                )} />
                Прогресс обработки
              </span>
              <span className="text-base font-bold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="hover:shadow-sm transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Всего</p>
              </div>
              <p className="text-2xl font-bold">{jobStatus.total_images}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Обработано</p>
              </div>
              <p className="text-2xl font-bold text-primary">{jobStatus.processed_images}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-all bg-detection/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-detection/20">
                  <Target className="h-3.5 w-3.5 text-detection" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">С детекциями</p>
              </div>
              <p className="text-2xl font-bold text-detection">
                {jobStatus.images_with_detections}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Порог</p>
              </div>
              <p className="text-2xl font-bold">
                {jobStatus.parameters?.confidence_threshold?.toFixed(2) || '0.50'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Timestamps */}
        {jobStatus.completed_at && (
          <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Завершено: {new Date(jobStatus.completed_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        )}
      </CardContent>
      
      {jobStatus.status === 'completed' && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          jobId={currentJobId}
          jobName={jobStatus.name}
          jobResults={jobResults}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить задачу?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить задачу &quot;{jobStatus.name || jobStatus.job_id.slice(0, 8)}&quot;?
              {jobStatus.status === 'completed' && jobStatus.images_with_detections > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Внимание: задача содержит {jobStatus.images_with_detections} изображений с детекциями. Все результаты будут удалены безвозвратно.
                </span>
              )}
              {(jobStatus.status === 'processing' || jobStatus.status === 'queued') && (
                <span className="block mt-2 text-destructive font-medium">
                  Внимание: задача находится в процессе обработки. Удаление может прервать обработку.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteJobMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={deleteJobMutation.isPending}
              className="gap-2"
            >
              {deleteJobMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function JobDetail() {
  const { jobId } = useParams<{ jobId?: string }>()
  const { currentJobId } = useJobStore()
  
  // Используем jobId из URL, если есть, иначе из store
  const displayJobId = jobId || currentJobId

  if (!displayJobId) {
    return null
  }

  return <JobDetailContent currentJobId={displayJobId} />
}

