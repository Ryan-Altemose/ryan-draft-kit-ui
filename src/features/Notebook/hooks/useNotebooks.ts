import { useQuery } from '@tanstack/react-query';
import type { NotebooksResponse } from '../types/notebook.types';
import { fetchNotebooks } from '../utils/fetchNotebooks';

export function useNotebooks() {
  return useQuery<NotebooksResponse>({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  });
}
