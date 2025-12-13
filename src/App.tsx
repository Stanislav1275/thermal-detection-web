import { useJobStore } from '@/store/jobStore'
import { useUIStore } from '@/store/uiStore'
import { Header } from '@/components/header/Header'
import { UploadZone } from '@/components/upload/UploadZone'
import { JobList } from '@/components/job-list/JobList'
import { JobDetail } from '@/components/job-detail/JobDetail'
import { ImageGallery } from '@/components/image-gallery/ImageGallery'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function App() {
  const { currentJobId } = useJobStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r bg-muted/40 transition-all duration-300 overflow-y-auto',
            sidebarOpen ? 'w-80' : 'w-0 border-0'
          )}
        >
          <div className={cn('p-4', !sidebarOpen && 'hidden')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Задачи</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <JobList />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            {/* Mobile sidebar toggle */}
            {!sidebarOpen && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="mb-4 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}

            {!currentJobId ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <UploadZone />
              </div>
            ) : (
              <div className="space-y-6">
                <JobDetail />
                <ImageGallery />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
