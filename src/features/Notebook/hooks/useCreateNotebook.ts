import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNotebook } from '../utils/createNotebook';

export function useCreateNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createNotebook(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
}
