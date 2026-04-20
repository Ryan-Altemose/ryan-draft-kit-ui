import { backendClient } from '@/shared/utils/api-client';
import type { NotebookResponse } from '../types/notebook.types';

export async function createNotebook(name: string): Promise<NotebookResponse> {
  return backendClient.post<NotebookResponse>('/api/notebooks', {
    kind: 'custom',
    name,
    content: '',
  });
}
