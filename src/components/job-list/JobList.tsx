import {type ComponentProps, useMemo, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useDeleteJob, useJobsList} from '@/hooks/useJobs'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Skeleton} from '@/components/ui/skeleton'
import {Input} from '@/components/ui/input'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {useToast} from '@/components/ui/use-toast'
import {cn} from '@/lib/utils'
import {formatDistanceToNow} from 'date-fns'
import {ru} from 'date-fns/locale/ru'
import {CheckSquare, Clock as ClockIcon, FileText, Loader2, Search, Square, Trash2, X} from 'lucide-react'

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
    const navigate = useNavigate()
    const {jobId: urlJobId} = useParams<{ jobId?: string }>()
    const {data: jobs, isLoading} = useJobsList()
    const activeJobId = urlJobId
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'queued' | 'failed'>('all')
    const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const deleteJobMutation = useDeleteJob()
    const {toast} = useToast()

    const filteredJobs = useMemo(() => {
        if (!jobs) return []
        return jobs.filter(job => {
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase()
                if (!job.job_id.toLowerCase().includes(searchLower) &&
                    !job.name?.toLowerCase().includes(searchLower)) {
                    return false
                }
            }
            if (filterStatus !== 'all' && job.status !== filterStatus) {
                return false
            }
            return true
        })
    }, [jobs, searchQuery, filterStatus])

    const allFilteredSelected = filteredJobs.length > 0 && filteredJobs.every(job => selectedJobs.has(job.job_id))
    const someFilteredSelected = filteredJobs.some(job => selectedJobs.has(job.job_id))

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedJobs(new Set(filteredJobs.map(job => job.job_id)))
        } else {
            const filteredIds = new Set(filteredJobs.map(job => job.job_id))
            setSelectedJobs(prev => new Set([...prev].filter(id => !filteredIds.has(id))))
        }
    }

    const handleSelectJob = (jobId: string, checked: boolean) => {
        setSelectedJobs(prev => {
            const next = new Set(prev)
            if (checked) {
                next.add(jobId)
            } else {
                next.delete(jobId)
            }
            return next
        })
    }

    const handleDeleteSelected = async () => {
        if (selectedJobs.size === 0) return

        try {
            const jobsToDelete = Array.from(selectedJobs)
            await Promise.all(jobsToDelete.map(jobId => deleteJobMutation.mutateAsync(jobId)))

            toast({
                title: 'Успешно',
                description: `Удалено задач: ${selectedJobs.size}`,
            })
            setSelectedJobs(new Set())
            setDeleteDialogOpen(false)
        } catch (error: any) {
            toast({
                title: 'Ошибка',
                description: error.response?.data?.detail || 'Не удалось удалить задачи',
                variant: 'destructive',
            })
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-9 w-full"/>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg"/>
                    ))}
                </div>
            </div>
        )
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center px-2">
                <div className="p-3 rounded-full bg-sidebar-accent mb-3">
                    <FileText className="h-6 w-6 text-sidebar-foreground/70"/>
                </div>
                <p className="text-sm font-medium text-sidebar-foreground mb-1">Нет задач</p>
                <p className="text-xs text-sidebar-foreground/70">Загрузите изображения для создания первой задачи</p>
            </div>
        )
    }

    return (
        <div className="space-y-3 overflow-x-hidden min-w-0">
            <div className="relative min-w-0 p-4">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/70"/>
                <Input
                    placeholder="Поиск по ID или названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-8 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 w-full min-w-0 max-w-full"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                )}
            </div>

            {/* Selection Controls */}
            {filteredJobs.length > 0 && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSelectAll(!allFilteredSelected)}
                            className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors"
                            aria-label={allFilteredSelected ? 'Снять выделение со всех' : 'Выбрать все'}
                        >
                            {allFilteredSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary"/>
                            ) : someFilteredSelected ? (
                                <div className="h-4 w-4 border-2 border-primary rounded-sm bg-primary/20"/>
                            ) : (
                                <Square className="h-4 w-4 text-sidebar-foreground/70"/>
                            )}
                            <span className="text-xs font-medium">
                  {selectedJobs.size > 0 ? `Выбрано: ${selectedJobs.size}` : 'Выбрать все'}
                </span>
                        </button>
                    </div>
                    {selectedJobs.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={deleteJobMutation.isPending}
                            className="h-7 text-xs gap-1.5"
                        >
                            {deleteJobMutation.isPending ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin"/>
                                    Удаление...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-3 w-3"/>
                                    Удалить ({selectedJobs.size})
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}

            {/* Filter Tabs */}
            {jobs && jobs.length > 3 && (
                <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                    <TabsList className="grid w-full grid-cols-4 bg-sidebar-accent">
                        <TabsTrigger value="all" className="text-xs">Все</TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs">Готово</TabsTrigger>
                        <TabsTrigger value="processing" className="text-xs">Обработка</TabsTrigger>
                        <TabsTrigger value="failed" className="text-xs">Ошибки</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            {/* Job List */}
            <div className="space-y-2 p-4 max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden min-w-0">
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-8 text-sm text-sidebar-foreground/70">
                        {searchQuery || filterStatus !== 'all' ? 'Задачи не найдены' : 'Нет задач'}
                    </div>
                ) : (
                    <>
                        {filteredJobs.map((job) => (
                            <JobListItem
                                key={job.job_id}
                                job={job}
                                isActive={job.job_id === activeJobId}
                                isSelected={selectedJobs.has(job.job_id)}
                                onSelect={(checked) => handleSelectJob(job.job_id, checked)}
                                onFocus={() => navigate(`/job/${job.job_id}`)}
                                onClick={() => navigate(`/job/${job.job_id}`)}
                            />
                        ))}
                    </>
                )}
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить выбранные задачи?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите
                            удалить {selectedJobs.size} {selectedJobs.size === 1 ? 'задачу' : 'задач'}?
                            <span className="block mt-2 text-destructive font-medium">
                  Внимание: все результаты будут удалены безвозвратно.
                </span>
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
                            onClick={handleDeleteSelected}
                            disabled={deleteJobMutation.isPending}
                            className="gap-2"
                        >
                            {deleteJobMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    Удаление...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4"/>
                                    Удалить ({selectedJobs.size})
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function JobListItem({job, isActive, isSelected, onSelect, onClick}: {
    job: {
        job_id: string;
        status: string;
        total_images: number;
        processed_images: number;
        images_with_detections: number;
        created_at: string;
        name?: string | null
    }
    isActive: boolean
    isSelected: boolean
    onSelect: (checked: boolean) => void
    onClick: () => void

} & ComponentProps<'div'>) {

    const deleteJobMutation = useDeleteJob()
    const {toast} = useToast()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const status = job.status
    const progress = job.total_images > 0
        ? (job.processed_images / job.total_images) * 100
        : 0

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        try {
            await deleteJobMutation.mutateAsync(job.job_id)
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

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
            className={cn(
                'p-3 border border-sidebar-border rounded-lg cursor-pointer transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                'focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2',
                'touch-manipulation min-h-[60px]',
                isActive && 'bg-sidebar-accent border-sidebar-border shadow-sm'
            )}
            aria-label={`Задача ${job.job_id.slice(0, 8)}`}
            aria-pressed={isActive}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onSelect(!isSelected)
                        }}
                        className="flex-shrink-0 h-4 w-4 flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
                        aria-label={isSelected ? 'Снять выделение' : 'Выбрать'}
                    >
                        {isSelected ? (
                            <CheckSquare className="h-4 w-4"/>
                        ) : (
                            <Square className="h-4 w-4 text-sidebar-foreground/70"/>
                        )}
                    </button>
                    <code
                        className="text-xs font-mono bg-sidebar-accent px-2 py-1 rounded font-semibold text-sidebar-foreground flex-shrink-0">
                        {job.job_id.slice(0, 8)}...
                    </code>
                    {job.name && (
                        <span className="text-xs font-medium text-sidebar-foreground truncate">{job.name}</span>
                    )}
                    <Badge variant={getStatusVariant(status)} className="font-medium flex-shrink-0">
                        {getStatusLabel(status)}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={deleteJobMutation.isPending}
                        aria-label="Удалить задачу"
                    >
                        <Trash2 className="h-3.5 w-3.5"/>
                    </Button>
                    <span className="text-xs text-sidebar-foreground/70 font-medium flex items-center gap-1">
            <ClockIcon className="h-3 w-3"/>
                        {formatDistanceToNow(new Date(job.created_at), {
                            addSuffix: true,
                            locale: ru,
                        })}
          </span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
          <span className="font-medium">
            Обработано: <span className="text-primary font-bold">{job.processed_images}</span> / {job.total_images}
          </span>
                    {job.images_with_detections > 0 && (
                        <span className="text-detection font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-detection rounded-full"/>
                            {job.images_with_detections} детекций
            </span>
                    )}
                </div>
                {(status === 'processing' || status === 'queued') && (
                    <div className="space-y-1">
                        <Progress value={progress} className="h-2.5"/>
                        <div className="text-xs text-sidebar-foreground/70 text-right">
                            {Math.round(progress)}%
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить задачу?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить задачу &quot;{job.name || job.job_id.slice(0, 8)}&quot;?
                            {status === 'completed' && job.images_with_detections > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                  Внимание: задача содержит {job.images_with_detections} изображений с детекциями. Все результаты будут удалены безвозвратно.
                </span>
                            )}
                            {(status === 'processing' || status === 'queued') && (
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
                            onClick={handleConfirmDelete}
                            disabled={deleteJobMutation.isPending}
                            className="gap-2"
                        >
                            {deleteJobMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    Удаление...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4"/>
                                    Удалить
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

