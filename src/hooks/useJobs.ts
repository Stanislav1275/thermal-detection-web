import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useJobStore } from '@/store/jobStore';
import { POLLING_INTERVAL } from '@/lib/constants';

export const useJobStatus = (jobId: string | null) => {
  const { setJobStatus } = useJobStore();
  
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');
      const response = await apiClient.getJobStatus(jobId);
      setJobStatus(jobId, response.data);
      return response.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'processing' ? POLLING_INTERVAL : false;
    },
  });
};

export const useJobResults = (jobId: string | null) => {
  return useQuery({
    queryKey: ['job-results', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');
      const response = await apiClient.getJobResults(jobId);
      return response.data;
    },
    enabled: !!jobId,
  });
};

export const useUpload = () => {
  const { setCurrentJobId, addToHistory } = useJobStore();
  
  return useMutation({
    mutationFn: ({ files, confidence }: { files: File[]; confidence: number }) =>
      apiClient.upload(files, confidence).then(r => r.data),
    onSuccess: (data) => {
      setCurrentJobId(data.job_id);
      addToHistory(data.job_id);
    },
  });
};

