import {create} from 'zustand';

interface UIStore {
    confidenceThreshold: number;
    setConfidenceThreshold: (value: number) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

// Загружаем сохраненное значение из localStorage
const getStoredConfidence = (): number => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('confidenceThreshold');
        if (stored) {
            const parsed = parseFloat(stored);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                return parsed;
            }
        }
    }
    return 0.62;
};

export const useUIStore = create<UIStore>((set) => ({
    confidenceThreshold: getStoredConfidence(),
    setConfidenceThreshold: (value) => {
        set({confidenceThreshold: value});
        // Сохраняем в localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('confidenceThreshold', value.toString());
        }
    },
    sidebarOpen: true,
    setSidebarOpen: (open) => set({sidebarOpen: open}),
}));

