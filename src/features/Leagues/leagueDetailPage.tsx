'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Heading,
  Spinner,
  Stack,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Thead,
  TableContainer,
  Button,
  SimpleGrid,
  useDisclosure,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeagueTeamTable from './components/LeagueTeamTable';
import { useLeague } from './hooks/useLeague';
import { useDeleteLeague } from './hooks/useDeleteLeague';
import { useUpsertLeague } from './hooks/useUpsertLeague';
import UpsertLeagueModal from './components/UpsertLeagueModal';
import { parseTeamsFromDescription } from './utils/leagueForm';
import type { LeagueTeam, TakenPlayer } from './types/leagues.types';

function buildDisplayTeams(
  teams: LeagueTeam[] | undefined,
  teamCount: number | undefined,
  startingBudget: number,
): LeagueTeam[] {
  if (!teamCount || teamCount < 1) return teams ?? [];

  return Array.from({ length: teamCount }, (_, index) => {
    const existingTeam = teams?.[index];
    return (
      existingTeam ?? [`team-${index + 1}`, `Team ${index + 1}`, startingBudget]
    );
  });
}

export default function LeagueDetailPage({ leagueId }: { leagueId: string }) {
  const { data, isLoading, error } = useLeague(leagueId);
  const router = useRouter();
  const editModal = useDisclosure();
  const deleteConfirm = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteLeagueMutation = useDeleteLeague();
  const upsertLeagueMutation = useUpsertLeague();
  const [editedTeams, setEditedTeams] = useState<LeagueTeam[]>([]);
  const [editedTakenPlayers, setEditedTakenPlayers] = useState<TakenPlayer[]>(
    [],
  );
  const league = data?.data;

  useEffect(() => {
    if (!league) {
      setEditedTeams([]);
      setEditedTakenPlayers([]);
      return;
    }

    setEditedTeams(
      buildDisplayTeams(
        league.teams,
        league.teams?.length ?? parseTeamsFromDescription(league.description),
        league.totalBudget ?? 0,
      ),
    );
    const nextTakenPlayers = league.taken_players ?? [];
    setEditedTakenPlayers(nextTakenPlayers);
  }, [league]);

  if (isLoading) return <Spinner />;
  if (error) return <Text>Unable to load league</Text>;
  if (!league) return <Text>League not found</Text>;
  const currentLeague = league;
  const teamCount =
    currentLeague.teams?.length ??
    parseTeamsFromDescription(currentLeague.description);
  const leagueIdToDelete = currentLeague._id;
  const displayTeams =
    editedTeams.length > 0
      ? editedTeams
      : buildDisplayTeams(
          currentLeague.teams,
          teamCount,
          currentLeague.totalBudget ?? 0,
        );

  async function handleDelete() {
    try {
      await deleteLeagueMutation.mutateAsync(leagueIdToDelete);
      deleteConfirm.onClose();
      router.push('/leagues');
    } catch (err) {
      console.error(err);
    }
  }

  function updateTeamTakenPlayers(
    currentTakenPlayers: TakenPlayer[],
    teamId: string,
    rows: Array<{ rowId: string; playerId: string; price: number }>,
  ): TakenPlayer[] {
    const rowsBySlot = new Map(rows.map((row) => [row.rowId, row]));
    const updatedTakenPlayers: TakenPlayer[] = [];
    const handledSlots = new Set<string>();

    currentTakenPlayers.forEach((takenPlayer) => {
      const [playerId, takenPlayerTeamId, positionSlot] = takenPlayer;
      if (takenPlayerTeamId !== teamId) {
        updatedTakenPlayers.push(takenPlayer);
        return;
      }

      const matchingRow = rowsBySlot.get(positionSlot);
      if (!matchingRow) {
        updatedTakenPlayers.push(takenPlayer);
        return;
      }

      handledSlots.add(positionSlot);
      updatedTakenPlayers.push([
        matchingRow.playerId || playerId,
        teamId,
        positionSlot,
        matchingRow.price,
      ]);
    });

    rows.forEach((row) => {
      if (handledSlots.has(row.rowId) || row.price <= 0 || !row.playerId)
        return;
      updatedTakenPlayers.push([row.playerId, teamId, row.rowId, row.price]);
    });

    return updatedTakenPlayers;
  }

  async function saveLeagueChanges(
    nextTeams: LeagueTeam[],
    nextTakenPlayers: TakenPlayer[],
  ) {
    try {
      if (!league) return;
      await upsertLeagueMutation.mutateAsync({
        input: {
          name: currentLeague.name,
          teams: teamCount ?? displayTeams.length,
          draftType: (currentLeague.draftType ?? 'auction') as 'auction',
          rosterSlots: currentLeague.rosterSlots ?? {
            C: 1,
            '1B': 1,
            '2B': 1,
            '3B': 1,
            SS: 1,
            CI: 0,
            MI: 0,
            OF: 3,
            SP: 5,
            RP: 2,
            UTIL: 0,
            BENCH: 0,
          },
          totalBudget: currentLeague.totalBudget ?? 0,
          minorLeagueSlotsPerTeam: currentLeague.minorLeagueSlotsPerTeam,
          battingCategories: currentLeague.battingCategories,
          pitchingCategories: currentLeague.pitchingCategories,
          takenPlayers: nextTakenPlayers,
          teamsData: nextTeams,
        },
        existingLeague: currentLeague,
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Box p={8}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={2} align="center">
          <Button as={Link} href="/leagues" variant="ghost">
            Back
          </Button>
          <Button onClick={editModal.onOpen} variant="outline">
            Edit
          </Button>
          <Button
            onClick={deleteConfirm.onOpen}
            colorScheme="red"
            variant="outline"
          >
            Delete
          </Button>
        </Stack>

        <Heading>{league.name}</Heading>

        <TableContainer borderWidth="1px" borderRadius="md">
          <Table size="sm" w="auto">
            <Thead>
              <Tr>
                <Th>Field</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Teams</Td>
                <Td>{teamCount ?? '-'}</Td>
              </Tr>
              <Tr>
                <Td>Draft Type</Td>
                <Td>{league.draftType ?? '-'}</Td>
              </Tr>
              <Tr>
                <Td>Starting Budget</Td>
                <Td>
                  {typeof league.totalBudget === 'number'
                    ? `$${league.totalBudget}`
                    : '-'}
                </Td>
              </Tr>
              <Tr>
                <Td>Batting Categories</Td>
                <Td>{league.battingCategories?.join(', ') ?? '-'}</Td>
              </Tr>
              <Tr>
                <Td>Pitching Categories</Td>
                <Td>{league.pitchingCategories?.join(', ') ?? '-'}</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>

        {displayTeams.length ? (
          <Box>
            <Heading size="md" mb={2}>
              Teams
            </Heading>
            <SimpleGrid
              columns={{ base: 1, xl: 3 }}
              spacing={4}
              alignItems="start"
            >
              {displayTeams.map((team) => {
                const [teamId] = team;
                const takenPlayersForTeam = editedTakenPlayers.filter(
                  ([, takenPlayerTeamId]) => takenPlayerTeamId === teamId,
                );

                return (
                  <LeagueTeamTable
                    key={teamId}
                    team={team}
                    rosterSlots={league.rosterSlots}
                    takenPlayers={takenPlayersForTeam}
                    startingBudget={league.totalBudget ?? 0}
                    minorLeagueSlots={league.minorLeagueSlotsPerTeam ?? 0}
                    isSaving={upsertLeagueMutation.isPending}
                    onSaveChanges={({ teamName, rows }) => {
                      const nextTeams = displayTeams.map((currentTeam) =>
                        currentTeam[0] === teamId
                          ? [currentTeam[0], teamName, currentTeam[2]]
                          : currentTeam,
                      ) as LeagueTeam[];
                      const nextTakenPlayers = updateTeamTakenPlayers(
                        editedTakenPlayers,
                        teamId,
                        rows,
                      );
                      setEditedTeams(nextTeams);
                      setEditedTakenPlayers(nextTakenPlayers);
                      void saveLeagueChanges(nextTeams, nextTakenPlayers);
                    }}
                  />
                );
              })}
            </SimpleGrid>
            {upsertLeagueMutation.isError ? (
              <Text mt={3} color="red.500" fontSize="sm">
                Failed to save league changes. Check API connection and API key.
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Stack>

      <UpsertLeagueModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        initialLeague={league}
      />

      <AlertDialog
        isOpen={deleteConfirm.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteConfirm.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete League
            </AlertDialogHeader>

            <AlertDialogBody>
              This will permanently delete “{league.name}”. This action cannot
              be undone.
              {deleteLeagueMutation.isError ? (
                <Text mt={2} color="red.500">
                  Failed to delete league. Check API connection and API key.
                </Text>
              ) : null}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteConfirm.onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={deleteLeagueMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
