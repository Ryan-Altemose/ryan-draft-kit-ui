import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateNotebookInput } from '../types/notebook.types';
import { updateNotebook } from '../utils/updateNotebook';

type UpdateNotebookVariables = {
  id: string;
  updates: UpdateNotebookInput;
};

export function useUpdateNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateNotebookVariables) =>
      updateNotebook(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
}
