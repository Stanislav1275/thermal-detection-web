import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useJobStore } from '@/store/jobStore';
import { POLLING_INTERVAL } from '@/lib/constants';

export const useJobsList = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await apiClient.listJobs();
      return response.data;
    },
    refetchInterval: 5000, // Обновляем каждые 5 секунд для получения новых задач
  });
};

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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ files, confidence, name }: { files: File[]; confidence: number; name?: string | null }) =>
      apiClient.upload(files, confidence, name).then(r => r.data),
    onSuccess: (data) => {
      // Инвалидируем список задач чтобы получить обновленный список
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Навигация будет обработана в компоненте через window.location или navigate
      window.location.href = `/job/${data.job_id}`;
    },
  });
};

export const useUpdateJobName = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, name }: { jobId: string; name: string }) =>
      apiClient.updateJobName(jobId, name).then(r => r.data),
    onSuccess: (_, variables) => {
      // Инвалидируем список задач и статус задачи
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  const { currentJobId, removeJobStatus } = useJobStore();
  
  return useMutation({
    mutationFn: (jobId: string) =>
      apiClient.deleteJob(jobId),
    onSuccess: (_, jobId) => {
      // Инвалидируем все связанные queries
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.removeQueries({ queryKey: ['job', jobId] });
      queryClient.removeQueries({ queryKey: ['job-results', jobId] });
      
      // Удаляем статус из store
      removeJobStatus(jobId);
      
      // Если удаляется текущая задача, перенаправляем на главную
      if (currentJobId === jobId) {
        // Используем window.location для полной перезагрузки и очистки состояния
        window.location.href = '/';
      }
    },
  });
};

