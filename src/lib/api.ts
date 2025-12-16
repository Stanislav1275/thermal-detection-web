import axios from 'axios';
import type {JobResults, JobStatus, UploadResponse} from '@/types/api';
import {API_BASE_URL, DEFAULT_CONFIDENCE_THRESHOLD} from './constants';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const apiClient = {
    upload: (files: File[], confidence: number = DEFAULT_CONFIDENCE_THRESHOLD, name?: string | null) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (name) {
            formData.append('name', name);
        }
        return api.post<UploadResponse>('/api/upload', formData, {
            params: {confidence_threshold: confidence},
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    listJobs: () =>
        api.get<JobStatus[]>('/api/jobs'),

    getJobStatus: (jobId: string) =>
        api.get<JobStatus>(`/api/jobs/${jobId}`),

    getJobResults: (jobId: string, onlyWithDetections?: boolean) =>
        api.get<JobResults>(`/api/jobs/${jobId}/results`, {
            params: onlyWithDetections !== undefined ? {only_with_detections: onlyWithDetections} : undefined,
        }),

    updateJobName: (jobId: string, name: string) =>
        api.patch<JobStatus>(`/api/jobs/${jobId}/name`, {name}),

    deleteJob: (jobId: string) =>
        api.delete<void>(`/api/jobs/${jobId}`),

    getInputImage: (jobId: string, filename: string) => {
        return `/api/jobs/${jobId}/input/${filename}`;
    },

    getOutputImage: (jobId: string, filename: string, original: boolean = false) => {
        const params = original ? '?original=true' : '';
        return `/api/jobs/${jobId}/output/${filename}${params}`;
    },

    downloadJobResults: (jobId: string, options: {
        original?: boolean;
        minConfidence?: number;
        onlyWithDetections?: boolean
    }) => {
        const params = new URLSearchParams();
        if (options.original) params.append('original', 'true');
        if (options.minConfidence !== undefined) params.append('min_confidence', options.minConfidence.toString());
        if (options.onlyWithDetections) params.append('only_with_detections', 'true');
        const query = params.toString();
        return `${API_BASE_URL}/api/jobs/${jobId}/download${query ? `?${query}` : ''}`;
    },

    health: () => api.get('/health'),
};

