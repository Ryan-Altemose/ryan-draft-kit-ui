import { backendClient } from '@/shared/utils/api-client';
import type { NotebookResponse } from '../types/notebook.types';

export async function deleteNotebook(id: string): Promise<NotebookResponse> {
  return backendClient.delete<NotebookResponse>(`/api/notebooks/${id}`);
}
