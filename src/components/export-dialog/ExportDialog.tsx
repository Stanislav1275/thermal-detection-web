import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import type { JobResults } from '@/types/api'
import { Download } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobName: string | null
  jobResults: JobResults | undefined
}

export function ExportDialog({ open, onOpenChange, jobId, jobName, jobResults }: ExportDialogProps) {
  const [exportType, setExportType] = useState<'processed' | 'original'>('processed')
  const [minConfidence, setMinConfidence] = useState(0)
  const [onlyWithDetections, setOnlyWithDetections] = useState(false)
  const { toast } = useToast()

  const filteredImagesCount = useMemo(() => {
    if (!jobResults?.images) return 0
    
    return jobResults.images.filter(img => {
      if (!img.success) return false
      
      // Если включен фильтр "только с детекциями", пропускаем изображения без детекций
      if (onlyWithDetections && img.detections.length === 0) return false
      
      // Если есть детекции, проверяем минимальную уверенность
      if (img.detections.length > 0) {
        const maxConfidence = Math.max(...img.detections.map(d => d.confidence))
        return maxConfidence >= minConfidence / 100
      }
      
      // Если нет детекций и фильтр "только с детекциями" выключен, включаем изображение только если minConfidence = 0
      return minConfidence === 0
    }).length
  }, [jobResults?.images, minConfidence, onlyWithDetections])

  const handleDownload = async () => {
    if (!jobResults) {
      toast({
        title: 'Ошибка',
        description: 'Результаты задачи еще не загружены',
        variant: 'destructive',
      })
      return
    }

    if (filteredImagesCount === 0) {
      toast({
        title: 'Ошибка',
        description: 'Нет изображений для экспорта с выбранными параметрами',
        variant: 'destructive',
      })
      return
    }

    try {
      const downloadUrl = apiClient.downloadJobResults(jobId, {
        original: exportType === 'original',
        minConfidence: minConfidence / 100,
        onlyWithDetections: onlyWithDetections,
      })

      // Используем window.location для скачивания
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Экспорт начат',
        description: `Скачивание ${filteredImagesCount} изображений...`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Ошибка экспорта',
        description: error instanceof Error ? error.message : 'Не удалось начать скачивание',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Экспорт результатов</DialogTitle>
          <DialogDescription>
            Выберите параметры экспорта для задачи "{jobName || jobId.slice(0, 8)}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Тип экспорта */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Тип изображений</label>
            <Select value={exportType} onValueChange={(value: 'processed' | 'original') => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processed">Обработанные (с детекциями)</SelectItem>
                <SelectItem value="original">Оригинальные</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Только с детекциями */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              id="only-with-detections"
              checked={onlyWithDetections}
              onChange={(e) => setOnlyWithDetections(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            />
            <label htmlFor="only-with-detections" className="text-sm font-medium leading-none cursor-pointer flex-1">
              Экспортировать только изображения с детекциями
            </label>
          </div>

          {/* Минимальная уверенность */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">
                Минимальная уверенность детекции
              </label>
              <span className="text-sm font-bold text-primary bg-background px-2 py-1 rounded">
                {minConfidence}%
              </span>
            </div>
            <Slider
              value={[minConfidence]}
              onValueChange={(value) => setMinConfidence(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Все изображения</span>
              <span>Только высокоуверенные</span>
            </div>
          </div>

          {/* Превью количества */}
          <div className="p-4 bg-muted rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Будет экспортировано:</span>
              <span className="text-lg font-bold text-primary">
                {filteredImagesCount} {filteredImagesCount === 1 ? 'изображение' : filteredImagesCount < 5 ? 'изображения' : 'изображений'}
              </span>
            </div>
            {filteredImagesCount === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Нет изображений, соответствующих выбранным критериям
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={filteredImagesCount === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Скачать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

