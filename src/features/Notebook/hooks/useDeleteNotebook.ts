import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteNotebook } from '../utils/deleteNotebook';

export function useDeleteNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotebook(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
}
