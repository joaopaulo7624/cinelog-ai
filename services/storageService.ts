import { WatchEntry, AIAnalysis } from '../types';

const STORAGE_KEYS = {
  ENTRIES: 'cinelog_entries',
  ANALYSIS: 'cinelog_analysis'
};

export interface AppData {
  entries: WatchEntry[];
  analysis: AIAnalysis | null;
  lastBackup: string;
}

// --- Local Storage Wrapper ---

export const saveLocalData = (entries: WatchEntry[], analysis: AIAnalysis | null) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  if (analysis) {
    localStorage.setItem(STORAGE_KEYS.ANALYSIS, JSON.stringify(analysis));
  }
};

export const loadLocalData = (): { entries: WatchEntry[], analysis: AIAnalysis | null } => {
  if (typeof window === 'undefined') return { entries: [], analysis: null };
  
  const entriesJson = localStorage.getItem(STORAGE_KEYS.ENTRIES);
  const analysisJson = localStorage.getItem(STORAGE_KEYS.ANALYSIS);

  return {
    entries: entriesJson ? JSON.parse(entriesJson) : [],
    analysis: analysisJson ? JSON.parse(analysisJson) : null
  };
};

export const clearLocalData = () => {
  localStorage.removeItem(STORAGE_KEYS.ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.ANALYSIS);
};

// --- Backup & Restore (File System) ---

export const exportBackup = (entries: WatchEntry[], analysis: AIAnalysis | null) => {
  const data: AppData = {
    entries,
    analysis,
    lastBackup: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `cinelog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importBackup = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        
        // Validação básica
        if (!Array.isArray(data.entries)) {
          throw new Error("Formato de arquivo inválido.");
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
    reader.readAsText(file);
  });
};