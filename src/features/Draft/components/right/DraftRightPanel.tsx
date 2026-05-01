'use client';

import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { League } from '@/features/Leagues/types/leagues.types';
import LeagueTeamTable from '@/features/Leagues/components/LeagueTeamTable';

type Props = {
  league: League | null;
};

export default function DraftRightPanel({ league }: Props) {
  if (!league) {
    return (
      <Box p={4} color="gray.400" fontSize="sm">
        Select a league to view teams.
      </Box>
    );
  }

  const teams = league.teams ?? [];
  const takenPlayers = league.taken_players ?? [];

  return (
    <Flex direction="column" h="100%">
      <Box flex="9" overflowY="auto">
        <Stack spacing={4} p={4}>
          {teams.map((team) => {
            const [teamId] = team;
            return (
              <LeagueTeamTable
                key={teamId}
                team={team}
                rosterSlots={league.rosterSlots}
                allTakenPlayers={takenPlayers}
                takenPlayers={takenPlayers.filter(
                  ([, takenByTeamId]) => takenByTeamId === teamId,
                )}
                startingBudget={league.totalBudget ?? 0}
                minorLeagueSlots={league.minorLeagueSlotsPerTeam ?? 0}
                draftMode
              />
            );
          })}
          {teams.length === 0 && (
            <Text color="gray.400" fontSize="sm">
              No teams found in this league.
            </Text>
          )}
        </Stack>
      </Box>

      <Flex
        flex="1"
        borderTopWidth="1px"
        borderColor="gray.200"
        p={4}
        align="center"
      >
        <Button size="sm" colorScheme="blue">
          Save Changes
        </Button>
      </Flex>
    </Flex>
  );
}
