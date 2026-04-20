import { backendClient } from '@/shared/utils/api-client';
import type {
  NotebookResponse,
  UpdateNotebookInput,
} from '../types/notebook.types';

export async function updateNotebook(
  id: string,
  updates: UpdateNotebookInput,
): Promise<NotebookResponse> {
  return backendClient.put<NotebookResponse>(`/api/notebooks/${id}`, updates);
}
