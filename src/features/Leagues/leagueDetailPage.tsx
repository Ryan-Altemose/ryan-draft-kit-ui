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
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  useDisclosure,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ERROR_MESSAGES } from '@/shared/constants';
import { isApiError } from '@/shared/utils/api-client';
import LeagueTeamTable from './components/LeagueTeamTable';
import SimpleTeamTable from './components/SimpleTeamTable';
import { useLeague } from './hooks/useLeague';
import { useDeleteLeague } from './hooks/useDeleteLeague';
import { useUpsertLeague } from './hooks/useUpsertLeague';
import UpsertLeagueModal from './components/UpsertLeagueModal';
import CompareModal from '@/shared/components/ui/CompareModal';
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
  const compareModal = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteLeagueMutation = useDeleteLeague();
  const upsertLeagueMutation = useUpsertLeague();
  const [editedTeams, setEditedTeams] = useState<LeagueTeam[]>([]);
  const [editedTakenPlayers, setEditedTakenPlayers] = useState<TakenPlayer[]>(
    [],
  );
  const [rosterView, setRosterView] = useState<
    'main' | 'minorLeague' | 'taxiSquad'
  >('main');
  const league = data?.data;
  const isForbidden = isApiError(error) && error.status === 403;
  const isNotFound = isApiError(error) && error.status === 404;

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

  useEffect(() => {
    if (isNotFound) {
      router.replace('/leagues');
    }
  }, [isNotFound, router]);

  if (isLoading) return <Spinner />;
  if (error) {
    if (isForbidden) {
      return <Text>{ERROR_MESSAGES.FORBIDDEN}</Text>;
    }

    if (isNotFound) {
      return <Text>{ERROR_MESSAGES.NOT_FOUND}</Text>;
    }

    return <Text>Unable to load league</Text>;
  }
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
    rows: Array<{
      rowId: string;
      playerId: string;
      price: number;
      contract?: string;
    }>,
  ): TakenPlayer[] {
    const rowsBySlot = new Map(rows.map((row) => [row.rowId, row]));
    const updatedTakenPlayers: TakenPlayer[] = [];
    const handledSlots = new Set<string>();

    currentTakenPlayers.forEach((takenPlayer) => {
      const [, takenPlayerTeamId, positionSlot] = takenPlayer;
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
      if (matchingRow.playerId) {
        updatedTakenPlayers.push([
          matchingRow.playerId,
          teamId,
          positionSlot,
          matchingRow.price,
          matchingRow.contract ?? '',
        ]);
      }
    });

    rows.forEach((row) => {
      if (handledSlots.has(row.rowId) || !row.playerId) return;
      updatedTakenPlayers.push([
        row.playerId,
        teamId,
        row.rowId,
        row.price,
        row.contract ?? '',
      ]);
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
            P: 0,
            UTIL: 0,
            BENCH: 0,
          },
          totalBudget: currentLeague.totalBudget ?? 0,
          minorLeagueSlotsPerTeam: currentLeague.minorLeagueSlotsPerTeam,
          taxiSquadPlayersPerTeam: currentLeague.taxiSquadPlayersPerTeam,
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
          <Button
            onClick={editModal.onOpen}
            colorScheme="blue"
            variant="outline"
          >
            Edit
          </Button>
          <Button
            as={Link}
            href={`/draft?leagueId=${encodeURIComponent(league._id)}`}
            bg="green.600"
            color="white"
            _hover={{ bg: 'green.700' }}
          >
            Draft
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

        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Flex gap={8} mb={4}>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Teams
              </Text>
              <Text fontWeight="semibold" fontSize="md" mt={1}>
                {teamCount ?? '—'}
              </Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                League
              </Text>
              <Text fontWeight="semibold" fontSize="md" mt={1}>
                {league.leagueType ?? 'MLB'}
              </Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Budget
              </Text>
              <Text fontWeight="semibold" fontSize="md" mt={1}>
                {typeof league.totalBudget === 'number'
                  ? `$${league.totalBudget}`
                  : '—'}
              </Text>
            </Box>
          </Flex>

          <Divider mb={4} />

          <Flex direction="column" gap={3}>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Hitting Categories
              </Text>
              <Wrap mt={2} spacing={1}>
                {league.battingCategories?.map((cat) => (
                  <WrapItem key={`bat-${cat}`}>
                    <Tag size="sm" colorScheme="green" variant="subtle">
                      {cat}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Pitching Categories
              </Text>
              <Wrap mt={2} spacing={1}>
                {league.pitchingCategories?.map((cat) => (
                  <WrapItem key={`pit-${cat}`}>
                    <Tag size="sm" colorScheme="blue" variant="subtle">
                      {cat}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          </Flex>
        </Box>

        <Box display="flex" justifyContent="center" position="relative">
          <Button
            size="sm"
            variant="outline"
            colorScheme="green"
            position="absolute"
            left={0}
            top="50%"
            transform="translateY(-50%)"
            onClick={compareModal.onOpen}
          >
            Compare
          </Button>
          <ButtonGroup isAttached variant="outline" size="sm">
            <Button
              onClick={() => setRosterView('main')}
              colorScheme={rosterView === 'main' ? 'green' : undefined}
              variant={rosterView === 'main' ? 'solid' : 'outline'}
            >
              Main Roster
            </Button>
            <Button
              onClick={() => setRosterView('minorLeague')}
              colorScheme={rosterView === 'minorLeague' ? 'green' : undefined}
              variant={rosterView === 'minorLeague' ? 'solid' : 'outline'}
            >
              Minor League Roster
            </Button>
            <Button
              onClick={() => setRosterView('taxiSquad')}
              colorScheme={rosterView === 'taxiSquad' ? 'green' : undefined}
              variant={rosterView === 'taxiSquad' ? 'solid' : 'outline'}
            >
              Taxi Squad
            </Button>
          </ButtonGroup>
        </Box>

        {displayTeams.length ? (
          <Box>
            <Heading size="md" mb={2}>
              {rosterView === 'main' && 'Main Rosters'}
              {rosterView === 'minorLeague' && 'Minor League Rosters'}
              {rosterView === 'taxiSquad' && 'Taxi Squads'}
            </Heading>
            <SimpleGrid
              columns={{ base: 1, xl: 2 }}
              spacing={4}
              alignItems="start"
            >
              {displayTeams.map((team, index) => {
                const [teamId] = team;
                const takenPlayersForTeam = editedTakenPlayers.filter(
                  ([, takenPlayerTeamId]) => takenPlayerTeamId === teamId,
                );

                if (rosterView === 'minorLeague') {
                  return (
                    <SimpleTeamTable
                      key={teamId}
                      team={team}
                      mode="minorLeague"
                      slotCount={league.minorLeagueSlotsPerTeam ?? 0}
                      startingBudget={league.totalBudget ?? 0}
                      leagueType={league.leagueType}
                      takenPlayers={takenPlayersForTeam}
                      allTakenPlayers={editedTakenPlayers}
                      isSaving={upsertLeagueMutation.isPending}
                      colorIndex={index}
                      onSaveChanges={({ rows }) => {
                        const nextTakenPlayers = updateTeamTakenPlayers(
                          editedTakenPlayers,
                          teamId,
                          rows,
                        );
                        setEditedTakenPlayers(nextTakenPlayers);
                        void saveLeagueChanges(editedTeams, nextTakenPlayers);
                      }}
                    />
                  );
                }

                if (rosterView === 'taxiSquad') {
                  return (
                    <SimpleTeamTable
                      key={teamId}
                      team={team}
                      mode="taxiSquad"
                      slotCount={league.taxiSquadPlayersPerTeam ?? 0}
                      startingBudget={league.totalBudget ?? 0}
                      leagueType={league.leagueType}
                      takenPlayers={takenPlayersForTeam}
                      allTakenPlayers={editedTakenPlayers}
                      isSaving={upsertLeagueMutation.isPending}
                      colorIndex={index}
                      onSaveChanges={({ rows }) => {
                        const nextTakenPlayers = updateTeamTakenPlayers(
                          editedTakenPlayers,
                          teamId,
                          rows,
                        );
                        setEditedTakenPlayers(nextTakenPlayers);
                        void saveLeagueChanges(editedTeams, nextTakenPlayers);
                      }}
                    />
                  );
                }

                return (
                  <LeagueTeamTable
                    key={teamId}
                    team={team}
                    rosterSlots={league.rosterSlots}
                    allTakenPlayers={editedTakenPlayers}
                    takenPlayers={takenPlayersForTeam}
                    startingBudget={league.totalBudget ?? 0}
                    leagueType={league.leagueType}
                    isSaving={upsertLeagueMutation.isPending}
                    colorIndex={index}
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

      <CompareModal
        isOpen={compareModal.isOpen}
        onClose={compareModal.onClose}
        teams={displayTeams}
        battingCategories={currentLeague.battingCategories}
        pitchingCategories={currentLeague.pitchingCategories}
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
