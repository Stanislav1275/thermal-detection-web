import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useFileUpload } from '@/hooks/useUpload'
import { useUpload as useUploadMutation } from '@/hooks/useJobs'
import { useUIStore } from '@/store/uiStore'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { MIN_CONFIDENCE_THRESHOLD, MAX_CONFIDENCE_THRESHOLD } from '@/lib/constants'

export function UploadZone() {
  const { files, dragActive, handleDrag, handleDrop, handleFileInput, removeFile, clearFiles } = useFileUpload()
  const { confidenceThreshold, setConfidenceThreshold } = useUIStore()
  const uploadMutation = useUploadMutation()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите хотя бы одно изображение',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      await uploadMutation.mutateAsync({
        files,
        confidence: confidenceThreshold,
      })
      toast({
        title: 'Успешно',
        description: 'Изображения загружены и обработка начата',
      })
      clearFiles()
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Не удалось загрузить изображения',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Загрузка изображений</CardTitle>
        <CardDescription>
          Загрузите тепловизионные изображения для детекции людей
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-sm text-muted-foreground">
              Поддерживаются форматы: JPG, PNG, WEBP
            </p>
          </label>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              Порог уверенности: {confidenceThreshold.toFixed(2)}
            </label>
          </div>
          <Slider
            value={[confidenceThreshold]}
            onValueChange={(value) => setConfidenceThreshold(value[0])}
            min={MIN_CONFIDENCE_THRESHOLD}
            max={MAX_CONFIDENCE_THRESHOLD}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Минимальная уверенность для детекции объекта (0.0 - 1.0)
          </p>
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Выбрано файлов: {files.length}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFiles}
                disabled={isUploading}
              >
                Очистить
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs p-2 truncate" title={file.name}>
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading || uploadMutation.isPending}
          className="w-full"
          size="lg"
        >
          {isUploading || uploadMutation.isPending ? (
            <>Загрузка...</>
          ) : (
            <>Загрузить и начать обработку</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

