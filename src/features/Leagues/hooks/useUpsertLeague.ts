import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLeagueInput, League } from '../types/leagues.types';
import { upsertLeague } from '../utils/upsertLeague';

type UpsertLeagueVariables = {
  input: CreateLeagueInput;
  existingLeague?: League;
  endpoint?: '/api/leagues' | '/api/draft-save/leagues';
};

export function useUpsertLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, existingLeague, endpoint }: UpsertLeagueVariables) =>
      upsertLeague(input, existingLeague, { endpoint }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['league'] });
    },
  });
}
