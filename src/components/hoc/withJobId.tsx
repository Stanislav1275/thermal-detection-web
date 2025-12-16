import { useJobStore } from '@/store/jobStore'
import type { ComponentType } from 'react'

export function withJobId<P extends object>(
  Component: ComponentType<P & { currentJobId: string }>
) {
  return function WrappedComponent(props: P) {
    const { currentJobId } = useJobStore()
    if (!currentJobId) {
      return null
    }
    return <Component {...props} currentJobId={currentJobId} />
  }
}

