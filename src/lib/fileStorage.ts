import { TipoArquivoItem, ArquivoItem } from '../types';

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  category: TipoArquivoItem;
  dataUrl?: string;
  url?: string;
  createdAt: string;
  projectId?: string;
  itemId?: string;
}

const DB_NAME = 'fluxpro_assets_db';
const DB_VERSION = 1;
const STORE_NAME = 'project_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado no ambiente'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function detectFileType(filename: string): TipoArquivoItem {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['dxf', 'nc', 'gcode', 'tap', 'cnc'].includes(ext)) {
    return 'corte_cnc';
  }
  if (['cdr', 'ai', 'eps', 'svg', 'dwg'].includes(ext)) {
    return 'vetor_design';
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
    return 'documento_pdf';
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
    return 'imagem_render';
  }
  return 'outro';
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Salva um arquivo no IndexedDB
export async function saveFileToStorage(
  file: File,
  meta?: { projectId?: string; itemId?: string; category?: TipoArquivoItem }
): Promise<StoredFile> {
  const db = await openDB();
  const dataUrl = await readFileAsDataURL(file);
  const id = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const category = meta?.category || detectFileType(file.name);

  const storedFile: StoredFile = {
    id,
    name: file.name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    type: file.type || 'application/octet-stream',
    category,
    dataUrl,
    url: dataUrl,
    createdAt: new Date().toISOString(),
    projectId: meta?.projectId,
    itemId: meta?.itemId,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(storedFile);
    req.onsuccess = () => resolve(storedFile);
    req.onerror = () => reject(req.error);
  });
}

// Salva um link ou arquivo externo como asset na biblioteca
export async function saveLinkToStorage(
  name: string,
  url: string,
  meta?: { projectId?: string; itemId?: string; category?: TipoArquivoItem }
): Promise<StoredFile> {
  const db = await openDB();
  const id = `asset-link-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const category = meta?.category || detectFileType(name);

  const storedFile: StoredFile = {
    id,
    name,
    size: 0,
    sizeFormatted: 'Link Nuvem',
    type: 'link',
    category,
    url,
    dataUrl: url,
    createdAt: new Date().toISOString(),
    projectId: meta?.projectId,
    itemId: meta?.itemId,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(storedFile);
    req.onsuccess = () => resolve(storedFile);
    req.onerror = () => reject(req.error);
  });
}

// Retorna todos os arquivos armazenados
export async function getAllStoredFiles(projectId?: string): Promise<StoredFile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        let results: StoredFile[] = req.result || [];
        if (projectId) {
          results = results.filter((f) => !f.projectId || f.projectId === projectId);
        }
        // Ordena por data decrescente
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao carregar arquivos do IndexedDB:', err);
    return [];
  }
}

// Exclui um arquivo pelo ID
export async function deleteStoredFile(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Converte uma string data: URL (base64) para Blob binário real
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      return new Blob([dataUrl], { type: 'text/plain' });
    }
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Falha ao decodificar data URL em Blob:', err);
    return new Blob([], { type: 'application/octet-stream' });
  }
}

// Faz o download seguro de arquivos (converte data URLs em Object URLs nativas)
export function downloadFile(name: string, urlOrDataUrl?: string): void {
  if (!urlOrDataUrl) return;

  const fileName = name || 'arquivo_fluxpro';

  if (urlOrDataUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(urlOrDataUrl);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 300);
      return;
    } catch (err) {
      console.error('Erro ao realizar download via Blob:', err);
    }
  }

  // Links normais (HTTP, HTTPS, Blob)
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = urlOrDataUrl;
  link.setAttribute('download', fileName);
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noreferrer noopener');
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 300);
}

// Visualiza / abre arquivo em nova aba com segurança contra bloqueio de data URL
export function previewFile(urlOrDataUrl?: string, name?: string): void {
  if (!urlOrDataUrl) return;

  if (urlOrDataUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(urlOrDataUrl);
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Pop-up bloqueado, faz fallback para download direto
        downloadFile(name || 'arquivo', urlOrDataUrl);
      }
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 120000); // 2 minutos para dar tempo de carregar a aba
      return;
    } catch (err) {
      console.error('Erro ao abrir preview do arquivo:', err);
    }
  }

  window.open(urlOrDataUrl, '_blank', 'noopener,noreferrer');
}

