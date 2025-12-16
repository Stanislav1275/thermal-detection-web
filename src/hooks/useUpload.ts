import { useState, useCallback } from 'react';

// Вспомогательная функция для проверки валидности файла (изображения + архивы)
const isValidFile = (file: File): boolean => {
  // Проверка на изображения по MIME-типу
  if (file.type.startsWith('image/')) {
    return true;
  }
  
  // Проверка на архивы по расширению файла
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
  const fileName = file.name.toLowerCase();
  const hasArchiveExtension = archiveExtensions.some(ext => fileName.endsWith(ext));
  
  // Проверка на архивы по MIME-типу
  const archiveMimeTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ];
  const hasArchiveMimeType = archiveMimeTypes.includes(file.type);
  
  return hasArchiveExtension || hasArchiveMimeType;
};

export const useFileUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(isValidFile);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    dragActive,
    handleDrag,
    handleDrop,
    handleFileInput,
    removeFile,
    clearFiles,
  };
};

