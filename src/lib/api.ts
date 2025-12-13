import axios from 'axios';
import type { JobStatus, JobResults, UploadResponse } from '@/types/api';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const apiClient = {
  upload: (files: File[], confidence: number = 0.5) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post<UploadResponse>('/api/upload', formData, {
      params: { confidence_threshold: confidence },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getJobStatus: (jobId: string) => 
    api.get<JobStatus>(`/api/jobs/${jobId}`),

  getJobResults: (jobId: string) => 
    api.get<JobResults>(`/api/jobs/${jobId}/results`),

  getOutputImage: (jobId: string, filename: string) => 
    `${API_BASE_URL}/api/jobs/${jobId}/output/${filename}`,

  health: () => api.get('/health'),
};

