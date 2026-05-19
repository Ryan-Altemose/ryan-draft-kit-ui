import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importLeague } from '../utils/importLeague';

export function useImportLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importJson: unknown) => importLeague(importJson),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['league'] });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-league'] });
    },
  });
}
