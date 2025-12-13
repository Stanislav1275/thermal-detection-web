import { useState } from 'react'
import { useJobResults } from '@/hooks/useJobs'
import { useJobStore } from '@/store/jobStore'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import type { Detection } from '@/types/api'

function DetectionOverlay({ detections, imageWidth, imageHeight }: { detections: Detection[]; imageWidth: number; imageHeight: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {detections.map((detection, index) => {
        const [x1, y1, x2, y2] = detection.bbox
        const width = ((x2 - x1) / imageWidth) * 100
        const height = ((y2 - y1) / imageHeight) * 100
        const left = (x1 / imageWidth) * 100
        const top = (y1 / imageHeight) * 100

        return (
          <div
            key={index}
            className="absolute border-2 border-detection"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-detection text-white text-xs px-1 rounded">
              {detection.class_name || 'person'} {(detection.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ImageThumbnail({ imageResult, jobId, onClick }: { imageResult: { filename: string; detections: Detection[]; success: boolean }; jobId: string; onClick: () => void }) {
  const imageUrl = apiClient.getOutputImage(jobId, imageResult.filename)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  return (
    <div
      className="relative group cursor-pointer border rounded-lg overflow-hidden bg-muted aspect-square"
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={imageResult.filename}
        className={cn(
          'w-full h-full object-cover transition-opacity',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={(e) => {
          setImageLoaded(true)
          const img = e.currentTarget
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
      )}
      {imageLoaded && imageResult.detections.length > 0 && (
        <DetectionOverlay
          detections={imageResult.detections}
          imageWidth={imageDimensions.width}
          imageHeight={imageDimensions.height}
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs truncate">{imageResult.filename}</p>
        {imageResult.detections.length > 0 && (
          <p className="text-xs text-detection">
            {imageResult.detections.length} детекций
          </p>
        )}
      </div>
      {imageResult.detections.length > 0 && (
        <Badge
          variant="default"
          className="absolute top-2 right-2 bg-detection hover:bg-detection/90"
        >
          {imageResult.detections.length}
        </Badge>
      )}
    </div>
  )
}

export function ImageGallery() {
  const { currentJobId } = useJobStore()
  const { data: jobResults, isLoading } = useJobResults(currentJobId)
  const [selectedImage, setSelectedImage] = useState<{ filename: string; detections: Detection[] } | null>(null)
  const [selectedImageDimensions, setSelectedImageDimensions] = useState({ width: 0, height: 0 })

  if (!currentJobId) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Загрузка результатов...</div>
        </CardContent>
      </Card>
    )
  }

  if (!jobResults || !jobResults.images || jobResults.images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Результаты обработки</CardTitle>
          <CardDescription>Результаты пока недоступны</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const imagesWithDetections = jobResults.images.filter(img => img.detections.length > 0)
  const imagesWithoutDetections = jobResults.images.filter(img => img.detections.length === 0)
  const failedImages = jobResults.images.filter(img => !img.success)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Результаты обработки</CardTitle>
          <CardDescription>
            Всего: {jobResults.images.length} | С детекциями: {imagesWithDetections.length} | 
            {failedImages.length > 0 && ` Ошибок: ${failedImages.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imagesWithDetections.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-detection">
                Изображения с детекциями ({imagesWithDetections.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagesWithDetections.map((imageResult, index) => (
                  <ImageThumbnail
                    key={index}
                    imageResult={imageResult}
                    jobId={currentJobId}
                    onClick={() => setSelectedImage({ filename: imageResult.filename, detections: imageResult.detections })}
                  />
                ))}
              </div>
            </div>
          )}

          {imagesWithoutDetections.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground">
                Изображения без детекций ({imagesWithoutDetections.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagesWithoutDetections.map((imageResult, index) => (
                  <ImageThumbnail
                    key={index}
                    imageResult={imageResult}
                    jobId={currentJobId}
                    onClick={() => setSelectedImage({ filename: imageResult.filename, detections: [] })}
                  />
                ))}
              </div>
            </div>
          )}

          {failedImages.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Ошибки обработки ({failedImages.length})
              </h3>
              <div className="space-y-2">
                {failedImages.map((imageResult, index) => (
                  <div key={index} className="p-3 border border-destructive rounded-lg">
                    <p className="font-medium">{imageResult.filename}</p>
                    {imageResult.error && (
                      <p className="text-sm text-muted-foreground mt-1">{imageResult.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedImage.filename}</DialogTitle>
                <DialogDescription>
                  {selectedImage.detections.length > 0
                    ? `${selectedImage.detections.length} детекций найдено`
                    : 'Детекции не найдены'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={apiClient.getOutputImage(currentJobId, selectedImage.filename)}
                    alt={selectedImage.filename}
                    className="w-full h-auto"
                    onLoad={(e) => {
                      const img = e.currentTarget
                      setSelectedImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
                    }}
                  />
                  {selectedImage.detections.length > 0 && selectedImageDimensions.width > 0 && (
                    <DetectionOverlay
                      detections={selectedImage.detections}
                      imageWidth={selectedImageDimensions.width}
                      imageHeight={selectedImageDimensions.height}
                    />
                  )}
                </div>
                {selectedImage.detections.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Детекции:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedImage.detections.map((detection, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="default" className="bg-detection">
                              {detection.class_name || 'person'}
                            </Badge>
                            <span className="text-sm font-medium">
                              {(detection.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            BBox: [{detection.bbox.join(', ')}]
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

