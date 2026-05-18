import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLeague } from '../utils/deleteLeague';

type UseDeleteLeagueOptions = {
  endpoint?: '/api/leagues' | '/api/draft-save/leagues';
};

export function useDeleteLeague(options?: UseDeleteLeagueOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => deleteLeague(leagueId, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['league'] });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-league'] });
    },
  });
}
