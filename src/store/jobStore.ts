import { create } from 'zustand';
import type { JobStatus } from '@/types/api';

interface JobStore {
  currentJobId: string | null;
  setCurrentJobId: (id: string | null) => void;
  jobHistory: string[];
  addToHistory: (id: string) => void;
  jobStatuses: Record<string, JobStatus>;
  setJobStatus: (jobId: string, status: JobStatus) => void;
  removeJobStatus: (jobId: string) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  currentJobId: null,
  setCurrentJobId: (id) => set({ currentJobId: id }),
  jobHistory: [],
  addToHistory: (id) => set((state) => {
    if (state.jobHistory.includes(id)) {
      return state;
    }
    return {
      jobHistory: [id, ...state.jobHistory],
    };
  }),
  jobStatuses: {},
  setJobStatus: (jobId, status) => set((state) => ({
    jobStatuses: {
      ...state.jobStatuses,
      [jobId]: status,
    },
  })),
  removeJobStatus: (jobId) => set((state) => {
    const { [jobId]: removed, ...rest } = state.jobStatuses;
    return { jobStatuses: rest };
  }),
}));

