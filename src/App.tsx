import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useJobStore } from '@/store/jobStore'
import { Header } from '@/components/header/Header'
import { UploadZone } from '@/components/upload/UploadZone'
import { JobDetail } from '@/components/job-detail/JobDetail'
import { ImageGallery } from '@/components/image-gallery/ImageGallery'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-8 w-full max-w-full">
      <UploadZone />
    </div>
  )
}

function JobPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { setCurrentJobId } = useJobStore()

  useEffect(() => {
    if (jobId) {
      setCurrentJobId(jobId)
    }
  }, [jobId, setCurrentJobId])

  if (!jobId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <JobDetail />
      <ImageGallery />
    </div>
  )
}

function App() {
  return (
    <div className="overflow-x-hidden min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <Header />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 min-w-0 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/job/:jobId" element={<JobPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
      </div>
        </SidebarInset>
      </SidebarProvider>
      </div>
  )
}

export default App
