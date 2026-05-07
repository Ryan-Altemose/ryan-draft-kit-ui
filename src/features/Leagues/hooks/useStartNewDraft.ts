import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startNewDraft } from '../utils/startNewDraft';

export function useStartNewDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, name }: { leagueId: string; name?: string }) =>
      startNewDraft(leagueId, { name }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['league', variables.leagueId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['league-drafts', variables.leagueId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['draft-save-league', variables.leagueId],
      });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-leagues'] });
    },
  });
}
