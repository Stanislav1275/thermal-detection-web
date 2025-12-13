export interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  class_name?: string;
}

export interface ImageResult {
  filename: string;
  detections: Detection[];
  success: boolean;
  error?: string | null;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total_images: number;
  processed_images: number;
  images_with_detections: number;
  created_at: string;
  completed_at?: string | null;
  parameters: {
    confidence_threshold?: number;
    [key: string]: unknown;
  };
}

export interface JobResults {
  job_id: string;
  images: ImageResult[];
  metadata: {
    total_detections?: number;
    total_images_with_people?: number;
    status?: string;
    [key: string]: unknown;
  };
}

export interface UploadResponse {
  job_id: string;
  message: string;
}

