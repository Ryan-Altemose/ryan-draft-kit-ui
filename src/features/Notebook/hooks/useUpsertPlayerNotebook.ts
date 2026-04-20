import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPlayerNotebook } from '../utils/upsertPlayerNotebook';

type UpsertPlayerNotebookVariables = {
  playerId: string;
  playerName: string;
  content: string;
};

export function useUpsertPlayerNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertPlayerNotebookVariables) =>
      upsertPlayerNotebook(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
}
