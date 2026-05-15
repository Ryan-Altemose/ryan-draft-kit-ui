import { useMutation } from '@tanstack/react-query';
import { upsertPlayerNotebook } from '../utils/upsertPlayerNotebook';

type UpsertPlayerNotebookVariables = {
  playerId: string;
  playerName: string;
  content: string;
};

export function useUpsertPlayerNotebook() {
  return useMutation({
    mutationFn: (input: UpsertPlayerNotebookVariables) =>
      upsertPlayerNotebook(input),
  });
}
