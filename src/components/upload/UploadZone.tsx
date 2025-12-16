import {useState} from 'react'
import {Image as ImageIcon, Loader2, Upload, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Progress} from '@/components/ui/progress'
import {useFileUpload} from '@/hooks/useUpload'
import {useUpload as useUploadMutation} from '@/hooks/useJobs'
import {useUIStore} from '@/store/uiStore'
import {useToast} from '@/components/ui/use-toast'
import {cn} from '@/lib/utils'

export function UploadZone() {
    const {files, dragActive, handleDrag, handleDrop, handleFileInput, removeFile, clearFiles} = useFileUpload()
    const {confidenceThreshold, setConfidenceThreshold} = useUIStore()
    console.log({confidenceThreshold})
    const uploadMutation = useUploadMutation()
    const {toast} = useToast()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [jobName, setJobName] = useState('')

    const handleUpload = async () => {
        if (files.length === 0) {
            toast({
                title: 'Ошибка',
                description: 'Пожалуйста, выберите хотя бы одно изображение или ZIP-архив',
                variant: 'destructive',
            })
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        // Симуляция прогресса загрузки
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval)
                    return prev
                }
                return prev + 10
            })
        }, 200)

        try {
            await uploadMutation.mutateAsync({
                files,
                confidence: confidenceThreshold,
                name: jobName.trim() || null,
            })
            setUploadProgress(100)
            clearInterval(progressInterval)
            toast({
                title: 'Успешно',
                description: 'Изображения загружены и обработка начата',
            })
            setTimeout(() => {
                clearFiles()
                setUploadProgress(0)
                setJobName('')
            }, 500)
        } catch (error) {
            clearInterval(progressInterval)
            setUploadProgress(0)
            toast({
                title: 'Ошибка загрузки',
                description: error instanceof Error ? error.message : 'Не удалось загрузить изображения',
                variant: 'destructive',
            })
        } finally {
            setTimeout(() => setIsUploading(false), 500)
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-sm overflow-x-hidden min-w-0">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Загрузка изображений</CardTitle>
                <CardDescription className="text-base">
                    Загрузите тепловизионные изображения или ZIP-архив для автоматической детекции людей
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
                        'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200',
                        dragActive
                            ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
                    )}
                >
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*,.zip,application/zip,image/tiff,image/tif"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        <div className={cn(
                            'mb-4 p-4 rounded-full transition-all',
                            dragActive ? 'bg-primary/20' : 'bg-muted'
                        )}>
                            <Upload className={cn(
                                'h-10 w-10 transition-colors',
                                dragActive ? 'text-primary' : 'text-muted-foreground'
                            )}/>
                        </div>
                        <p className="text-lg font-semibold mb-2">
                            Перетащите изображения или ZIP-архив сюда
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            или <span className="text-primary font-medium underline">нажмите для выбора</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Поддерживаются форматы: TIFF, PNG, JPG, JPEG, WEBP, ZIP
                        </p>
                    </label>
                </div>

                {/* Job Name Input */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold">
                        Название задачи (необязательно)
                    </label>
                    <Input
                        value={jobName}
                        onChange={(e) => setJobName(e.target.value)}
                        placeholder="Введите название задачи..."
                        disabled={isUploading}
                        className="w-full"
                    />
                </div>


                {/* File Preview */}
                {files.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <p className="text-sm font-semibold">
                                Выбрано файлов: <span className="text-primary">{files.length}</span>
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    clearFiles()
                                    setJobName('')
                                }}
                                disabled={isUploading}
                                className="text-destructive hover:text-destructive"
                            >
                                Очистить все
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative group border rounded-lg overflow-hidden bg-background hover:border-primary/50 transition-all duration-200 hover:shadow-sm"
                                >
                                    <div
                                        className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground"/>
                                        )}
                                    </div>
                                    <div
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 shadow-lg touch-manipulation"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFile(index)
                                            }}
                                            disabled={isUploading}
                                            aria-label={`Удалить ${file.name}`}
                                        >
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <div className="p-2 bg-background">
                                        <p className="text-xs font-medium truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {(isUploading || uploadMutation.isPending) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Загрузка файлов...</span>
                            <span className="text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2"/>
                    </div>
                )}

                {/* Upload Button */}
                <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading || uploadMutation.isPending}
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                >
                    {isUploading || uploadMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                            Загрузка и обработка...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-5 w-5"/>
                            Загрузить и начать обработку
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}

