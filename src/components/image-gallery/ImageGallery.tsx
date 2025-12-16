import {useCallback, useEffect, useMemo, useState} from 'react'
import {useParams} from 'react-router-dom'
import {useJobResults} from '@/hooks/useJobs'
import {useJobStore} from '@/store/jobStore'
import {apiClient} from '@/lib/api'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Skeleton} from '@/components/ui/skeleton'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {cn} from '@/lib/utils'
import {AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff, Filter, ImageIcon, X} from 'lucide-react'
import type {Detection, ImageResult} from '@/types/api'

function DetectionOverlay({detections, imageElement, naturalWidth, naturalHeight, containerElement}: {
    detections: Detection[];
    imageElement: HTMLImageElement | null;
    naturalWidth: number;
    naturalHeight: number;
    containerElement: HTMLElement | null;
}) {
    if (!imageElement || !containerElement) return null

    // Получаем реальные размеры отображаемого изображения
    const imgRect = imageElement.getBoundingClientRect()
    const containerRect = containerElement.getBoundingClientRect()

    // Реальные размеры отображаемого изображения
    const displayWidth = imgRect.width
    const displayHeight = imgRect.height

    // Вычисляем масштаб для object-contain
    const scaleX = displayWidth / naturalWidth
    const scaleY = displayHeight / naturalHeight
    const scale = Math.min(scaleX, scaleY)

    // Вычисляем смещение изображения относительно контейнера
    const imgOffsetX = imgRect.left - containerRect.left
    const imgOffsetY = imgRect.top - containerRect.top

    // Вычисляем смещение для центрирования (если изображение меньше контейнера)
    const scaledWidth = naturalWidth * scale
    const scaledHeight = naturalHeight * scale
    const offsetX = imgOffsetX + (displayWidth - scaledWidth) / 2
    const offsetY = imgOffsetY + (displayHeight - scaledHeight) / 2

    return (
        <div className="absolute inset-0 pointer-events-none">
            {detections.map((detection, index) => {
                const [x1, y1, x2, y2] = detection.bbox

                // Преобразуем координаты из натуральных размеров в отображаемые
                const left = offsetX + x1 * scale
                const top = offsetY + y1 * scale
                const width = (x2 - x1) * scale
                const height = (y2 - y1) * scale

                return (
                    <div
                        key={index}
                        className="absolute border-2 border-detection"
                        style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                        }}
                    >
                        <div
                            className="absolute -top-7 left-0 text-detection text-xs font-semibold whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {detection.class_name || 'person'} {(detection.confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function DetectionCrop({detection, imageUrl, naturalWidth, naturalHeight}: {
    detection: Detection;
    imageUrl: string;
    naturalWidth: number;
    naturalHeight: number
}) {
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const cropImage = async () => {
            setIsLoading(true)
            setError(false)
            
            try {
                const [x1, y1, x2, y2] = detection.bbox
                const padding = 30
                
                // Вычисляем координаты с отступами, не выходя за границы изображения
                const cropX = Math.max(0, x1 - padding)
                const cropY = Math.max(0, y1 - padding)
                const cropWidth = Math.min(naturalWidth - cropX, x2 - cropX + padding)
                const cropHeight = Math.min(naturalHeight - cropY, y2 - cropY + padding)
                
                // Преобразуем абсолютный URL в относительный для использования через прокси Vite
                const getProxiedUrl = (url: string): string => {
                    try {
                        const urlObj = new URL(url)
                        // Если URL содержит localhost:8000, заменяем на относительный путь через прокси
                        if (urlObj.origin.includes('localhost:8000') || urlObj.origin.includes('127.0.0.1:8000')) {
                            return urlObj.pathname + urlObj.search
                        }
                        return url
                    } catch {
                        // Если это уже относительный путь, возвращаем как есть
                        return url
                    }
                }
                
                const proxiedUrl = getProxiedUrl(imageUrl)
                
                // Загружаем изображение через fetch для обхода CORS
                let imageBlob: Blob
                try {
                    const response = await fetch(proxiedUrl, {
                        mode: 'cors',
                        credentials: 'omit',
                    })
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }
                    imageBlob = await response.blob()
                } catch (fetchError) {
                    // Если fetch не работает, пробуем напрямую через Image с crossOrigin
                    const img = new Image()
                    img.crossOrigin = 'anonymous'
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = () => {
                            reject(new Error('CORS blocked'))
                        }
                        img.src = proxiedUrl
                    })
                    
                    // Если Image загрузился успешно, используем его
                    const canvas = document.createElement('canvas')
                    canvas.width = cropWidth
                    canvas.height = cropHeight
                    const ctx = canvas.getContext('2d')
                    
                    if (!ctx) {
                        throw new Error('Не удалось получить контекст canvas')
                    }
                    
                    ctx.drawImage(
                        img,
                        cropX, cropY, cropWidth, cropHeight,
                        0, 0, cropWidth, cropHeight
                    )
                    
                    const dataUrl = canvas.toDataURL('image/png')
                    setCroppedImageUrl(dataUrl)
                    setIsLoading(false)
                    return
                }
                
                // Создаем blob URL из загруженного изображения
                const blobUrl = URL.createObjectURL(imageBlob)
                const img = new Image()
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve
                    img.onerror = reject
                    img.src = blobUrl
                })
                
                // Создаем canvas для обрезки
                const canvas = document.createElement('canvas')
                canvas.width = cropWidth
                canvas.height = cropHeight
                const ctx = canvas.getContext('2d')
                
                if (!ctx) {
                    URL.revokeObjectURL(blobUrl)
                    throw new Error('Не удалось получить контекст canvas')
                }
                
                // Рисуем обрезанную часть изображения
                ctx.drawImage(
                    img,
                    cropX, cropY, cropWidth, cropHeight, // source rectangle
                    0, 0, cropWidth, cropHeight // destination rectangle
                )
                
                // Преобразуем canvas в data URL
                const dataUrl = canvas.toDataURL('image/png')
                setCroppedImageUrl(dataUrl)
                
                // Освобождаем blob URL
                URL.revokeObjectURL(blobUrl)
            } catch (err) {
                console.error('Ошибка при обрезке изображения:', err)
                setError(true)
            } finally {
                setIsLoading(false)
            }
        }

        cropImage()
    }, [detection, imageUrl, naturalWidth, naturalHeight])

    if (isLoading) {
        return (
            <div
                className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden border border-border/50 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Загрузка...</div>
            </div>
        )
    }

    if (error || !croppedImageUrl) {
        return (
            <div
                className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden border border-border/50 flex items-center justify-center">
                <div className="text-destructive text-sm">Ошибка загрузки</div>
            </div>
        )
    }

    return (
        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden border border-border/50">
            <img
                src={croppedImageUrl}
                alt={`Crop: ${detection.class_name || 'person'}`}
                className="w-full h-full object-contain"
            />
        </div>
    )
}

function ImageThumbnail({imageResult, jobId, onClick}: {
    imageResult: ImageResult;
    jobId: string;
    onClick: () => void
}) {
    // Используем URL из API если доступен, иначе fallback на старый способ
    // Преобразуем абсолютные URL в относительные для работы через nginx
    const getRelativeUrl = (url: string | undefined): string => {
        if (!url) return apiClient.getOutputImage(jobId, imageResult.filename, false)
        try {
            const urlObj = new URL(url)
            return urlObj.pathname + urlObj.search
        } catch {
            return url.startsWith('/') ? url : apiClient.getOutputImage(jobId, imageResult.filename, false)
        }
    }
    const imageUrl = getRelativeUrl(imageResult.processed_image_url) || apiClient.getOutputImage(jobId, imageResult.filename, false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)

    return (
        <div
            className="relative group cursor-pointer border rounded-lg overflow-hidden bg-muted aspect-square hover:border-primary/50 hover:shadow-md transition-all duration-200"
            onClick={onClick}
        >
            {!imageError ? (
                <img
                    src={imageUrl}
                    alt={imageResult.filename}
                    className={cn(
                        'w-full h-full object-cover transition-opacity',
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => {
                        setImageLoaded(true)
                    }}
                    onError={() => {
                        setImageError(true)
                        setImageLoaded(true)
                    }}
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive mb-1"/>
                    <p className="text-xs text-destructive text-center">Ошибка загрузки</p>
                </div>
            )}
            {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Загрузка...</div>
                </div>
            )}
            {/* Не рисуем DetectionOverlay в миниатюрах - они показывают обработанное изображение с уже нарисованными bounding boxes */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs truncate">{imageResult.filename}</p>
                {imageResult.detections.length > 0 && (
                    <p className="text-xs text-detection">
                        {imageResult.detections.length} детекций
                    </p>
                )}
            </div>
            {imageResult.detections.length > 0 && !imageError && (
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

function ImageGalleryContent({currentJobId}: { currentJobId: string }) {

    const {data: jobResults, isLoading} = useJobResults(currentJobId)

    const [selectedImage, setSelectedImage] = useState<{
        imageResult: ImageResult;
        index: number
    } | null>(null)

    const [selectedImageDimensions, setSelectedImageDimensions] = useState({width: 0, height: 0})
    const [selectedImageElement, setSelectedImageElement] = useState<HTMLImageElement | null>(null)
    const [selectedImageContainer, setSelectedImageContainer] = useState<HTMLElement | null>(null)
    const [selectedImageError, setSelectedImageError] = useState(false)
    const [detectionsPage, setDetectionsPage] = useState(1)

    const [filter, setFilter] = useState<'all' | 'with-detections' | 'without-detections'>('with-detections')

    const [searchQuery, setSearchQuery] = useState('')

    const [showOriginal, setShowOriginal] = useState(false)

    console.log({selectedImage})

    const allImages = useMemo(() => {
        if (!jobResults?.images) return []
        return jobResults.images.filter(img => {
            if (searchQuery && !img.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
            if (filter === 'with-detections') return img.detections.length > 0
            if (filter === 'without-detections') return img.detections.length === 0
            return true
        })
    }, [jobResults?.images, filter, searchQuery])

    const imagesWithDetections = useMemo(() => {
        return allImages.filter(img => img.detections.length > 0 && img.success)
    }, [allImages])

    const imagesWithoutDetections = useMemo(() => {
        return allImages.filter(img => img.detections.length === 0 && img.success)
    }, [allImages])

    const failedImages = useMemo(() => {
        return allImages.filter(img => !img.success)
    }, [allImages])

    const currentImageIndex = useMemo(() => {
        if (!selectedImage) return -1
        // Используем index из selectedImage напрямую, если он валиден
        if (selectedImage.index >= 0 && selectedImage.index < allImages.length) {
            return selectedImage.index
        }
        // Fallback: ищем по filename
        return allImages.findIndex(img => img.filename === selectedImage.imageResult.filename)
    }, [selectedImage, allImages])

    const navigateImage = useCallback((direction: 'prev' | 'next') => {
        if (!selectedImage || allImages.length === 0) return

        // Используем index из selectedImage напрямую
        const currentIdx = selectedImage.index >= 0 && selectedImage.index < allImages.length
            ? selectedImage.index
            : currentImageIndex

        if (currentIdx === -1) return

        const newIndex = direction === 'next'
            ? (currentIdx + 1) % allImages.length
            : (currentIdx - 1 + allImages.length) % allImages.length
        const newImage = allImages[newIndex]
        if (newImage) {
            setSelectedImage({
                imageResult: newImage,
                index: newIndex
            })
            setSelectedImageError(false)
        }
    }, [selectedImage, allImages, currentImageIndex])

    // Reset selectedImageError when showOriginal changes
    useEffect(() => {
        setSelectedImageError(false)
    }, [showOriginal])

    // Reset detections page when selected image changes
    useEffect(() => {
        setDetectionsPage(1)
    }, [selectedImage?.imageResult.filename])

    const DETECTIONS_PER_PAGE = 10
    const paginatedDetections = useMemo(() => {
        if (!selectedImage) return []
        const start = (detectionsPage - 1) * DETECTIONS_PER_PAGE
        const end = start + DETECTIONS_PER_PAGE
        return selectedImage.imageResult.detections.slice(start, end)
    }, [selectedImage, detectionsPage])

    const totalDetectionsPages = useMemo(() => {
        if (!selectedImage) return 0
        return Math.ceil(selectedImage.imageResult.detections.length / DETECTIONS_PER_PAGE)
    }, [selectedImage])

    // Получаем URL изображения с учетом showOriginal и наличия URL в API
    // Преобразуем абсолютные URL в относительные для работы через nginx
    const getRelativeUrl = useCallback((url: string | undefined, fallback: string): string => {
        if (!url) return fallback
        try {
            const urlObj = new URL(url)
            return urlObj.pathname + urlObj.search
        } catch {
            return url.startsWith('/') ? url : fallback
        }
    }, [])
    
    const getImageUrl = useCallback((imageResult: ImageResult, showOriginal: boolean) => {
        if (showOriginal) {
            return getRelativeUrl(imageResult.original_image_url, apiClient.getInputImage(currentJobId, imageResult.filename))
        } else {
            return getRelativeUrl(imageResult.processed_image_url, apiClient.getOutputImage(currentJobId, imageResult.filename, false))
        }
    }, [currentJobId, getRelativeUrl])


    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Игнорируем события, если пользователь вводит текст в input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            e.stopPropagation()
            navigateImage('prev')
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault()
            e.stopPropagation()
            navigateImage('next')
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            setSelectedImage(null)
        }
    }, [navigateImage])

    useEffect(() => {

        if (!selectedImage || allImages.length === 0) return;

        window.addEventListener('keydown', handleKeyDown, true);

        return () => window.removeEventListener('keydown', handleKeyDown, true);

    }, [selectedImage, allImages, navigateImage, handleKeyDown])

    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2"/>
                    <Skeleton className="h-4 w-64"/>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="aspect-square rounded-lg"/>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!jobResults || !jobResults.images || jobResults.images.length === 0) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Результаты обработки</CardTitle>
                    <CardDescription>Результаты пока недоступны</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <ImageIcon className="h-8 w-8 text-muted-foreground"/>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Нет результатов</p>
                        <p className="text-xs text-muted-foreground">Ожидайте завершения обработки</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="shadow-sm overflow-x-hidden">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">Результаты обработки</CardTitle>
                            <CardDescription className="text-sm mt-0.5">
                                Всего: <span className="font-medium">{jobResults.images.length}</span>
                                {imagesWithDetections.length > 0 && (
                                    <> · С детекциями: <span
                                        className="font-medium text-detection">{imagesWithDetections.length}</span></>
                                )}
                                {failedImages.length > 0 && (
                                    <> · Ошибок: <span
                                        className="font-medium text-destructive">{failedImages.length}</span></>
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-[260px]">
                            <div className="relative min-w-0 flex-1 sm:flex-initial">
                                <Input
                                    placeholder="Поиск..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-56 pr-8 max-w-full h-9"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full w-8"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                <SelectTrigger className="w-full sm:w-44 h-9">
                                    <Filter className="h-3.5 w-3.5 mr-2"/>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="with-detections">С детекциями</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-hidden">
                    {allImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Filter className="h-8 w-8 text-muted-foreground"/>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Нет результатов</p>
                            <p className="text-xs text-muted-foreground">Попробуйте изменить фильтры или поисковый
                                запрос</p>
                            {(searchQuery || filter !== 'all') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setFilter('all')
                                    }}
                                    className="mt-4"
                                >
                                    Сбросить фильтры
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 overflow-x-hidden">
                            {imagesWithDetections.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-detection flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-detection rounded-full"/>
                                        С детекциями ({imagesWithDetections.length})
                                    </h3>
                                    <div
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full min-w-0">
                                        {imagesWithDetections.map((imageResult, index) => (
                                            <ImageThumbnail
                                                key={`${imageResult.filename}-${index}`}
                                                imageResult={imageResult}
                                                jobId={currentJobId}
                                                onClick={() => {
                                                    const globalIndex = allImages.findIndex(img => img.filename === imageResult.filename)
                                                    setSelectedImage({
                                                        imageResult: imageResult,
                                                        index: globalIndex
                                                    })
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {imagesWithoutDetections.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"/>
                                        Без детекций ({imagesWithoutDetections.length})
                                    </h3>

                                </div>
                            )}

                            {failedImages.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4"/>
                                        Ошибки ({failedImages.length})
                                    </h3>
                                    <div className="space-y-1.5">
                                        {failedImages.map((imageResult, index) => (
                                            <div key={index}
                                                 className="p-2.5 border border-destructive/30 rounded-md bg-destructive/5">
                                                <p className="text-sm font-medium">{imageResult.filename}</p>
                                                {imageResult.error && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{imageResult.error}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Image Detail Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent
                    className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-x-hidden bg-background">
                    {selectedImage && (
                        <>
                            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-background">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <DialogTitle
                                            className="text-xl truncate text-foreground">{selectedImage.imageResult.filename}</DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
                                            {selectedImage.imageResult.detections.length > 0
                                                ? `${selectedImage.imageResult.detections.length} детекций найдено`
                                                : 'Детекции не найдены'}
                                            {allImages.length > 1 && currentImageIndex >= 0 && (
                                                <span className="ml-2 text-muted-foreground">
                          ({currentImageIndex + 1} / {allImages.length})
                        </span>
                                            )}
                                        </DialogDescription>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant={showOriginal ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setShowOriginal(!showOriginal)
                                                // Сбрасываем ошибку при переключении типа изображения
                                                setSelectedImageError(false)
                                            }}
                                            className="h-9 border-border"
                                        >
                                            {showOriginal ? (
                                                <>
                                                    <EyeOff className="h-4 w-4 mr-2"/>
                                                    Оригинал
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-4 w-4 mr-2"/>
                                                    Обработанное
                                                </>
                                            )}
                                        </Button>

                                        {allImages.length > 1 && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => navigateImage('prev')}
                                                    className="h-9 w-9 border-border"
                                                >
                                                    <ChevronLeft className="h-4 w-4"/>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => navigateImage('next')}
                                                    className="h-9 w-9 border-border"
                                                >
                                                    <ChevronRight className="h-4 w-4"/>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative bg-background">
                                <div
                                    ref={(el) => setSelectedImageContainer(el)}
                                    className="relative border border-border/50 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center min-h-[400px]">
                                    {allImages.length > 1 && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => navigateImage('prev')}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/95 hover:bg-background border border-border shadow-md touch-manipulation"
                                                aria-label="Предыдущее изображение"
                                            >
                                                <ChevronLeft className="h-5 w-5"/>
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => navigateImage('next')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/95 hover:bg-background border border-border shadow-md touch-manipulation"
                                                aria-label="Следующее изображение"
                                            >
                                                <ChevronRight className="h-5 w-5"/>
                                            </Button>
                                        </>
                                    )}
                                    {selectedImageError ? (
                                        <div className="flex flex-col items-center justify-center p-8 text-center">
                                            <AlertCircle className="h-12 w-12 text-destructive mb-4"/>
                                            <p className="text-lg font-semibold text-destructive mb-2">Ошибка загрузки
                                                изображения</p>
                                            <p className="text-sm text-muted-foreground mb-1">{selectedImage.imageResult.filename}</p>
                                            <p className="text-xs text-muted-foreground">Возможно, файл поврежден или не
                                                может быть обработан сервером</p>
                                            <p className="text-xs text-muted-foreground mt-2">Ошибка бэкенда: &quot;need
                                                at least one array to stack&quot;</p>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                ref={(img) => setSelectedImageElement(img)}
                                                src={getImageUrl(selectedImage.imageResult, showOriginal)}
                                                alt={selectedImage.imageResult.filename}
                                                className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
                                                onLoad={(e) => {
                                                    const img = e.currentTarget
                                                    setSelectedImageDimensions({
                                                        width: img.naturalWidth,
                                                        height: img.naturalHeight
                                                    })
                                                    setSelectedImageError(false)
                                                }}
                                                onError={() => {
                                                    setSelectedImageError(true)
                                                }}
                                            />
                                            {/* Рисуем bounding boxes только на оригинальном изображении */}
                                            {/* На обработанном изображении bounding boxes уже нарисованы на сервере */}
                                            {showOriginal && selectedImage.imageResult.detections.length > 0 && selectedImageDimensions.width > 0 && !selectedImageError && (
                                                <DetectionOverlay
                                                    detections={selectedImage.imageResult.detections}
                                                    imageElement={selectedImageElement}
                                                    naturalWidth={selectedImageDimensions.width}
                                                    naturalHeight={selectedImageDimensions.height}
                                                    containerElement={selectedImageContainer}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                                {selectedImage.imageResult.detections.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-border/50 bg-background">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-lg text-foreground">
                                                Детекции: {selectedImage.imageResult.detections.length}
                                            </h4>
                                            {totalDetectionsPages > 1 && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDetectionsPage(p => Math.max(1, p - 1))}
                                                        disabled={detectionsPage === 1}
                                                        className="h-8"
                                                    >
                                                        <ChevronLeft className="h-4 w-4"/>
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground">
                                                        {detectionsPage} / {totalDetectionsPages}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDetectionsPage(p => Math.min(totalDetectionsPages, p + 1))}
                                                        disabled={detectionsPage === totalDetectionsPages}
                                                        className="h-8"
                                                    >
                                                        <ChevronRight className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {paginatedDetections.map((detection, index) => {
                                                const globalIndex = (detectionsPage - 1) * DETECTIONS_PER_PAGE + index
                                                return (
                                                    <div key={globalIndex}
                                                         className="p-4 border border-border/50 rounded-lg bg-card/50 hover:border-primary/50 hover:bg-card transition-colors space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <Badge variant="default"
                                                                   className="bg-detection text-white font-semibold">
                                                                {detection.class_name || 'person'}
                                                            </Badge>
                                                            <span className="text-sm font-bold text-primary">
                                                                {(detection.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <DetectionCrop
                                                            detection={detection}
                                                            imageUrl={getImageUrl(selectedImage.imageResult, showOriginal)}
                                                            naturalWidth={selectedImageDimensions.width}
                                                            naturalHeight={selectedImageDimensions.height}
                                                        />
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            BBox: [{detection.bbox.join(', ')}]
                                                        </p>
                                                    </div>
                                                )
                                            })}
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

export function ImageGallery() {
    const {jobId} = useParams<{ jobId?: string }>()
    const {currentJobId} = useJobStore()

    const displayJobId = jobId || currentJobId

    if (!displayJobId) {
        return null
    }

    return <ImageGalleryContent currentJobId={displayJobId}/>
}

