import { backendClient } from '@/shared/utils/api-client';
import type { NotebooksResponse } from '../types/notebook.types';

export async function fetchNotebooks(): Promise<NotebooksResponse> {
  return backendClient.get<NotebooksResponse>('/api/notebooks');
}
