'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import Link from 'next/link';
import type {
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import LeagueTeamTable from '@/features/Leagues/components/LeagueTeamTable';
import SimpleTeamTable from '@/features/Leagues/components/SimpleTeamTable';
import CompareModal from '@/shared/components/ui/CompareModal';
import type { Player } from '@/shared/hooks/usePlayers';

type TeamRow = {
  rowId: string;
  playerId: string;
  price: number;
  contract: string;
};

type Props = {
  league: League | null;
  onSaveRosters: (updatedTakenPlayers: TakenPlayer[]) => void;
  isSavingRosters?: boolean;
  onPlayerNotebookOpen?: (player: Player) => void;
};

export default function DraftRightPanel({
  league,
  onSaveRosters,
  isSavingRosters = false,
  onPlayerNotebookOpen,
}: Props) {
  const [rosterView, setRosterView] = useState<
    'main' | 'minorLeague' | 'taxiSquad'
  >('main');
  const compareModal = useDisclosure();
  const [dirtyTeamIds, setDirtyTeamIds] = useState<Set<string>>(new Set());
  const [currentRowsByTeam, setCurrentRowsByTeam] = useState<
    Record<string, TeamRow[]>
  >({});
  const [forcedEmptyPlayersByTeam, setForcedEmptyPlayersByTeam] = useState<
    Record<string, Set<string>>
  >({});

  // Stable ref so handleCrossTeamTransfer can read latest rows without being
  // in its dependency array (avoids recreating on every row change)
  const currentRowsByTeamRef = useRef(currentRowsByTeam);
  useEffect(() => {
    currentRowsByTeamRef.current = currentRowsByTeam;
  });

  // Reset transfer state whenever the persisted league data changes
  useEffect(() => {
    setForcedEmptyPlayersByTeam({});
  }, [league]);

  const handleDirtyChange = useCallback((teamId: string, isDirty: boolean) => {
    setDirtyTeamIds((prev) => {
      const next = new Set(prev);
      if (isDirty) next.add(teamId);
      else next.delete(teamId);
      return next;
    });
  }, []);

  const handleRowsChange = useCallback((teamId: string, rows: TeamRow[]) => {
    setCurrentRowsByTeam((prev) => {
      const existing = prev[teamId];
      if (
        existing &&
        existing.length === rows.length &&
        existing.every(
          (r, i) =>
            r.rowId === rows[i].rowId &&
            r.playerId === rows[i].playerId &&
            r.price === rows[i].price,
        )
      ) {
        return prev;
      }
      return { ...prev, [teamId]: rows };
    });
  }, []);

  const handleCrossTeamTransfer = useCallback(
    (playerId: string, destTeamId: string) => {
      let sourceTeamId: string | null = null;
      for (const [tid, rows] of Object.entries(currentRowsByTeamRef.current)) {
        if (rows.some((r) => r.playerId === playerId)) {
          sourceTeamId = tid;
          break;
        }
      }

      if (!sourceTeamId || sourceTeamId === destTeamId) return;

      setForcedEmptyPlayersByTeam((prev) => {
        const sourceSet = new Set(prev[sourceTeamId!] ?? []);
        sourceSet.add(playerId);
        const destSet = new Set(prev[destTeamId] ?? []);
        destSet.delete(playerId);
        return { ...prev, [sourceTeamId!]: sourceSet, [destTeamId]: destSet };
      });

      setDirtyTeamIds((prev) => {
        const next = new Set(prev);
        next.add(sourceTeamId!);
        return next;
      });
    },
    [],
  );

  const teams = league?.teams ?? [];
  const takenPlayers = league?.taken_players ?? [];

  const takenPlayersByTeam = useMemo(() => {
    const map: Record<string, TakenPlayer[]> = {};
    for (const [teamId] of teams) {
      map[teamId] = takenPlayers.filter(([, tid]) => tid === teamId);
    }
    return map;
  }, [teams, takenPlayers]);

  function handleSave() {
    if (!league) return;

    const existingTakenPlayers = league.taken_players ?? [];
    const newTakenPlayers: TakenPlayer[] = [];

    for (const [teamId] of league.teams ?? []) {
      const rows = currentRowsByTeam[teamId];

      if (!rows) {
        // Table not yet initialized — preserve original entries for this team
        existingTakenPlayers
          .filter(([, tid]) => tid === teamId)
          .forEach((entry) => newTakenPlayers.push(entry));
        continue;
      }

      for (const row of rows) {
        if (!row.playerId) continue;

        newTakenPlayers.push([
          row.playerId,
          teamId,
          row.rowId,
          row.price,
          row.contract ?? '',
        ]);
      }
    }

    // Preserve unslotted entries (e.g. positionSlot='DRAFT') not captured in any table row.
    // Deduplicate by playerId so cross-team transfers don't re-add the old entry.
    const processedPlayerIds = new Set(newTakenPlayers.map(([pid]) => pid));
    for (const entry of existingTakenPlayers) {
      if (!processedPlayerIds.has(entry[0])) {
        newTakenPlayers.push(entry);
      }
    }

    onSaveRosters(newTakenPlayers);
  }

  const hasDirtyChanges = dirtyTeamIds.size > 0;

  if (!league) {
    return (
      <Box p={4} color="gray.400" fontSize="sm">
        Select a league to view teams.
      </Box>
    );
  }

  return (
    <>
      <Flex direction="column" h="100%">
        <Box
          px={3}
          pt={3}
          pb={2}
          borderBottomWidth="1px"
          borderColor="gray.200"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="green"
              onClick={compareModal.onOpen}
            >
              Compare
            </Button>
            <Button
              as={Link}
              href={`/leagues/${league._id}`}
              size="sm"
              variant="outline"
              colorScheme="green"
            >
              Go to league
            </Button>
          </Box>
          <Box display="flex" justifyContent="center">
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
                Minor League
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
        </Box>

        <Box flex="1" overflowY="auto">
          <Stack spacing={4} p={4}>
            {rosterView === 'main' &&
              teams.map((team, index) => {
                const [teamId] = team;
                return (
                  <LeagueTeamTable
                    key={teamId}
                    team={team}
                    rosterSlots={league.rosterSlots}
                    allTakenPlayers={takenPlayers}
                    takenPlayers={takenPlayersByTeam[teamId] ?? []}
                    startingBudget={league.totalBudget ?? 0}
                    leagueType={league.leagueType}
                    onDirtyChange={handleDirtyChange}
                    onRowsChange={handleRowsChange}
                    onCrossTeamTransfer={handleCrossTeamTransfer}
                    forcedEmptyPlayerIds={forcedEmptyPlayersByTeam[teamId]}
                    isSaving={isSavingRosters}
                    colorIndex={index}
                    onPlayerNotebookOpen={onPlayerNotebookOpen}
                    draftMode
                  />
                );
              })}

            {(rosterView === 'minorLeague' || rosterView === 'taxiSquad') &&
              teams.map((team, index) => {
                const [teamId] = team;
                return (
                  <SimpleTeamTable
                    key={teamId}
                    team={team}
                    mode={rosterView}
                    slotCount={
                      rosterView === 'minorLeague'
                        ? (league.minorLeagueSlotsPerTeam ?? 0)
                        : (league.taxiSquadPlayersPerTeam ?? 0)
                    }
                    startingBudget={league.totalBudget ?? 0}
                    leagueType={league.leagueType}
                    takenPlayers={takenPlayersByTeam[teamId] ?? []}
                    allTakenPlayers={takenPlayers}
                    colorIndex={index}
                    onPlayerNotebookOpen={onPlayerNotebookOpen}
                    readOnly
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

        <Flex borderTopWidth="1px" borderColor="gray.200" p={4} align="center">
          <Button
            size="sm"
            colorScheme="green"
            onClick={handleSave}
            isDisabled={
              rosterView !== 'main' || !hasDirtyChanges || isSavingRosters
            }
            isLoading={isSavingRosters}
          >
            Save Changes
          </Button>
        </Flex>
      </Flex>

      <CompareModal
        isOpen={compareModal.isOpen}
        onClose={compareModal.onClose}
        teams={teams}
        battingCategories={league.battingCategories}
        pitchingCategories={league.pitchingCategories}
      />
    </>
  );
}
