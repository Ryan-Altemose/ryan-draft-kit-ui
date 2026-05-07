'use client';

import { Box, Button, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useLeague } from './hooks/useLeague';
import { useLeagueDraft } from './hooks/useLeagueDraft';
import LeagueTeamTable from './components/LeagueTeamTable';
import type { LeagueTeam, TakenPlayer } from './types/leagues.types';

export default function LeagueDraftDetailPage({
  leagueId,
  draftId,
}: {
  leagueId: string;
  draftId: string;
}) {
  const { data: leagueData, isLoading: isLoadingLeague } = useLeague(leagueId);
  const { data: draftData, isLoading: isLoadingDraft } = useLeagueDraft(
    leagueId,
    draftId,
  );

  const league = leagueData?.data;
  const draft = draftData?.data;

  if (isLoadingLeague || isLoadingDraft) return <Spinner />;
  if (!league) return <Text>League not found</Text>;
  if (!draft) return <Text>Draft not found</Text>;

  const teams = (draft.teams ?? []) as LeagueTeam[];
  const takenPlayers = (draft.taken_players ?? []) as TakenPlayer[];
  const startingBudget = draft.totalBudget ?? league.totalBudget ?? 0;

  return (
    <Box p={8}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={2} align="center">
          <Button as={Link} href={`/leagues/${leagueId}`} variant="ghost">
            Back
          </Button>
        </Stack>

        <Heading>{draft.name}</Heading>

        <Text fontSize="sm" color="gray.600">
          League: {league.name} • Picks: {draft.draft_picks?.length ?? 0} •
          Players: {draft.taken_players?.length ?? 0}
        </Text>

        <Stack spacing={4}>
          {teams.map((team) => {
            const [teamId] = team;
            const takenPlayersForTeam = takenPlayers.filter(
              ([, tid]) => tid === teamId,
            );
            return (
              <LeagueTeamTable
                key={teamId}
                team={team}
                rosterSlots={league.rosterSlots}
                allTakenPlayers={takenPlayers}
                takenPlayers={takenPlayersForTeam}
                startingBudget={startingBudget}
                readOnly
              />
            );
          })}
          {teams.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No teams saved with this draft snapshot.
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
