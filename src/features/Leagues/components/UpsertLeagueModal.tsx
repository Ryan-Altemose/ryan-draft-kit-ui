'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import type {
  CreateLeagueInput,
  League,
  RosterSlots,
  TakenPlayer,
} from '../types/leagues.types';
import {
  BattingCategorySchema,
  PitchingCategorySchema,
} from '../types/leagues.types';
import { useUpsertLeague } from '../hooks/useUpsertLeague';
import {
  DEFAULT_ROSTER_SLOTS,
  parseTeamsFromDescription,
  ROSTER_POSITIONS,
} from '../utils/leagueForm';

const KNOWN_SLOT_POSITIONS = new Set<string>([
  ...ROSTER_POSITIONS,
  'MiLB',
  'TAXI',
]);

function isKnownSlotFormat(slot: string): boolean {
  const lastDash = slot.lastIndexOf('-');
  if (lastDash < 0) return false;
  const position = slot.slice(0, lastDash);
  const indexStr = slot.slice(lastDash + 1);
  return KNOWN_SLOT_POSITIONS.has(position) && /^\d+$/.test(indexStr);
}

function computeOrphanedTakenPlayers(
  existingLeague: League,
  newTeamCount: number,
  newRosterSlots: RosterSlots,
  newMinorLeagueSlots: number,
  newTaxiSquadSlots: number,
): { orphanedCount: number; filteredTakenPlayers: TakenPlayer[] } {
  const takenPlayers = existingLeague.taken_players ?? [];
  if (takenPlayers.length === 0)
    return { orphanedCount: 0, filteredTakenPlayers: [] };

  const validTeamIds = new Set(
    (existingLeague.teams ?? []).slice(0, newTeamCount).map(([id]) => id),
  );

  const validSlots = new Set<string>();
  for (const position of ROSTER_POSITIONS) {
    const count = newRosterSlots[position] ?? 0;
    for (let i = 0; i < count; i++) validSlots.add(`${position}-${i}`);
  }
  for (let i = 0; i < newMinorLeagueSlots; i++) validSlots.add(`MiLB-${i}`);
  for (let i = 0; i < newTaxiSquadSlots; i++) validSlots.add(`TAXI-${i}`);

  const filteredTakenPlayers = takenPlayers.filter(
    ([, teamId, positionSlot]) => {
      if (!validTeamIds.has(teamId)) return false;
      if (!isKnownSlotFormat(positionSlot)) return true;
      return validSlots.has(positionSlot);
    },
  );

  return {
    orphanedCount: takenPlayers.length - filteredTakenPlayers.length,
    filteredTakenPlayers,
  };
}

const ALL_BATTING_CATEGORIES = BattingCategorySchema.options;
const ALL_PITCHING_CATEGORIES = PitchingCategorySchema.options;
const DEFAULT_BATTING = ['AVG', 'HR', 'RBI', 'BB', 'SB'];
const DEFAULT_PITCHING = ['ERA', 'W', 'L', 'SV', 'K', 'IP'];

type UpsertLeagueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialLeague?: League;
};

export default function UpsertLeagueModal({
  isOpen,
  onClose,
  initialLeague,
}: UpsertLeagueModalProps) {
  const upsertLeagueMutation = useUpsertLeague();
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const [confirmState, setConfirmState] = useState<{
    payload: CreateLeagueInput;
    filteredTakenPlayers: TakenPlayer[];
    orphanedCount: number;
  } | null>(null);

  type LeagueForm = {
    leagueName: string;
    teams: string;
    totalBudget: string;
    minorLeagueSlotsPerTeam: string;
    taxiSquadPlayersPerTeam: string;
    draftType: 'auction';
    leagueType: 'MLB' | 'AL' | 'NL';
    rosterSlots: Record<keyof RosterSlots, string>;
    battingCategories: string[];
    pitchingCategories: string[];
  };

  const DEFAULT_FORM: LeagueForm = useMemo(() => {
    const teams =
      initialLeague?.teams?.length ??
      parseTeamsFromDescription(initialLeague?.description) ??
      12;

    return {
      leagueName: initialLeague?.name ?? '',
      teams: String(teams),
      totalBudget: String(initialLeague?.totalBudget ?? 260),
      minorLeagueSlotsPerTeam: String(
        initialLeague?.minorLeagueSlotsPerTeam ?? 0,
      ),
      taxiSquadPlayersPerTeam: String(
        initialLeague?.taxiSquadPlayersPerTeam ?? 0,
      ),
      draftType: 'auction',
      leagueType: initialLeague?.leagueType ?? 'MLB',
      rosterSlots: ROSTER_POSITIONS.reduce(
        (acc, position) => {
          const value =
            initialLeague?.rosterSlots?.[position] ??
            DEFAULT_ROSTER_SLOTS[position];
          acc[position] = String(value);
          return acc;
        },
        {} as Record<keyof RosterSlots, string>,
      ),
      battingCategories: initialLeague?.battingCategories ?? DEFAULT_BATTING,
      pitchingCategories: initialLeague?.pitchingCategories ?? DEFAULT_PITCHING,
    };
  }, [initialLeague]);

  const [form, setForm] = useState<LeagueForm>(DEFAULT_FORM);

  useEffect(() => {
    if (!isOpen) return;
    setForm(DEFAULT_FORM);
  }, [DEFAULT_FORM, isOpen]);

  const canSubmit = useMemo(() => {
    const parsedTeams = Number.parseInt(form.teams, 10);
    const parsedTotalBudget = Number.parseInt(form.totalBudget, 10);
    const parsedMinorLeagueSlots = Number.parseInt(
      form.minorLeagueSlotsPerTeam,
      10,
    );
    const parsedTaxiSquadPlayers = Number.parseInt(
      form.taxiSquadPlayersPerTeam,
      10,
    );

    return (
      form.leagueName.trim().length > 0 &&
      !Number.isNaN(parsedTeams) &&
      parsedTeams > 1 &&
      parsedTeams <= 16 &&
      !Number.isNaN(parsedTotalBudget) &&
      parsedTotalBudget >= 0 &&
      !Number.isNaN(parsedMinorLeagueSlots) &&
      parsedMinorLeagueSlots >= 0 &&
      !Number.isNaN(parsedTaxiSquadPlayers) &&
      parsedTaxiSquadPlayers >= 0 &&
      form.battingCategories.length > 0 &&
      form.pitchingCategories.length > 0
    );
  }, [
    form.leagueName,
    form.teams,
    form.totalBudget,
    form.minorLeagueSlotsPerTeam,
    form.taxiSquadPlayersPerTeam,
    form.battingCategories,
    form.pitchingCategories,
  ]);

  function toggleCategory(
    field: 'battingCategories' | 'pitchingCategories',
    category: string,
  ) {
    setForm((prev) => {
      const current = prev[field];
      const next = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, [field]: next };
    });
  }

  function handleRosterSlotChange(position: keyof RosterSlots, value: string) {
    if (value !== '' && !/^\d+$/.test(value)) return;
    setForm((prev) => ({
      ...prev,
      rosterSlots: {
        ...prev.rosterSlots,
        [position]: value,
      },
    }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
  }

  function handleClose() {
    upsertLeagueMutation.reset();
    resetForm();
    onClose();
  }

  async function doSubmit(
    payload: CreateLeagueInput,
    takenPlayers?: TakenPlayer[],
  ) {
    try {
      await upsertLeagueMutation.mutateAsync({
        input: { ...payload, takenPlayers },
        existingLeague: initialLeague,
      });
      resetForm();
      handleClose();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    const parsedTeams = Number.parseInt(form.teams, 10);
    const parsedTotalBudget = Number.parseInt(form.totalBudget, 10);
    const parsedMinorLeagueSlots = Number.parseInt(
      form.minorLeagueSlotsPerTeam,
      10,
    );
    const parsedTaxiSquadPlayers = Number.parseInt(
      form.taxiSquadPlayersPerTeam,
      10,
    );
    if (
      Number.isNaN(parsedTeams) ||
      Number.isNaN(parsedTotalBudget) ||
      Number.isNaN(parsedMinorLeagueSlots) ||
      Number.isNaN(parsedTaxiSquadPlayers)
    )
      return;

    const rosterSlots = ROSTER_POSITIONS.reduce((acc, position) => {
      const raw = form.rosterSlots[position];
      const parsed = Number.parseInt(raw, 10);
      acc[position] = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
      return acc;
    }, {} as RosterSlots);

    const payload: CreateLeagueInput = {
      name: form.leagueName.trim(),
      teams: Math.max(2, parsedTeams),
      draftType: form.draftType,
      leagueType: form.leagueType,
      rosterSlots,
      totalBudget: Math.max(0, parsedTotalBudget),
      minorLeagueSlotsPerTeam: Math.max(0, parsedMinorLeagueSlots),
      taxiSquadPlayersPerTeam: Math.max(0, parsedTaxiSquadPlayers),
      battingCategories: form.battingCategories,
      pitchingCategories: form.pitchingCategories,
    };

    if (initialLeague) {
      const { orphanedCount, filteredTakenPlayers } =
        computeOrphanedTakenPlayers(
          initialLeague,
          parsedTeams,
          rosterSlots,
          parsedMinorLeagueSlots,
          parsedTaxiSquadPlayers,
        );
      if (orphanedCount > 0) {
        setConfirmState({ payload, filteredTakenPlayers, orphanedCount });
        return;
      }
    }

    await doSubmit(payload);
  }

  async function handleConfirmSubmit() {
    if (!confirmState) return;
    const { payload, filteredTakenPlayers } = confirmState;
    setConfirmState(null);
    await doSubmit(payload, filteredTakenPlayers);
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {initialLeague ? 'Edit League' : 'Create League'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel htmlFor="leagueName">League Name</FormLabel>
                <Input
                  id="leagueName"
                  placeholder="Enter league name"
                  value={form.leagueName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, leagueName: e.target.value }))
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="teams"># of Teams</FormLabel>
                <Input
                  id="teams"
                  type="number"
                  min={2}
                  max={16}
                  value={form.teams}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== '' && !/^\d+$/.test(next)) return;
                    setForm((prev) => ({ ...prev, teams: next }));
                  }}
                />
                {Number.parseInt(form.teams, 10) > 16 && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    Maximum 16 teams allowed.
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>League</FormLabel>
                <RadioGroup
                  value={form.leagueType}
                  onChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      leagueType: val as 'MLB' | 'AL' | 'NL',
                    }))
                  }
                >
                  <HStack spacing={6}>
                    <Radio value="MLB">MLB</Radio>
                    <Radio value="AL">AL</Radio>
                    <Radio value="NL">NL</Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="totalBudget">Starting Budget ($)</FormLabel>
                <Input
                  id="totalBudget"
                  type="number"
                  min={0}
                  value={form.totalBudget}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== '' && !/^\d+$/.test(next)) return;
                    setForm((prev) => ({ ...prev, totalBudget: next }));
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="minorLeagueSlotsPerTeam">
                  Minor League Players Per Team
                </FormLabel>
                <Input
                  id="minorLeagueSlotsPerTeam"
                  type="number"
                  min={0}
                  value={form.minorLeagueSlotsPerTeam}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== '' && !/^\d+$/.test(next)) return;
                    setForm((prev) => ({
                      ...prev,
                      minorLeagueSlotsPerTeam: next,
                    }));
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="taxiSquadPlayersPerTeam">
                  Taxi Squad Players Per Team
                </FormLabel>
                <Input
                  id="taxiSquadPlayersPerTeam"
                  type="number"
                  min={0}
                  value={form.taxiSquadPlayersPerTeam}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== '' && !/^\d+$/.test(next)) return;
                    setForm((prev) => ({
                      ...prev,
                      taxiSquadPlayersPerTeam: next,
                    }));
                  }}
                />
              </FormControl>

              <FormControl
                isRequired
                isInvalid={form.battingCategories.length === 0}
              >
                <FormLabel>Batting Categories</FormLabel>
                <Wrap spacing={3}>
                  {ALL_BATTING_CATEGORIES.map((cat) => (
                    <WrapItem key={cat}>
                      <Checkbox
                        isChecked={form.battingCategories.includes(cat)}
                        onChange={() =>
                          toggleCategory('battingCategories', cat)
                        }
                      >
                        {cat}
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
                {form.battingCategories.length === 0 && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    Select at least one batting category.
                  </Text>
                )}
              </FormControl>

              <FormControl
                isRequired
                isInvalid={form.pitchingCategories.length === 0}
              >
                <FormLabel>Pitching Categories</FormLabel>
                <Wrap spacing={3}>
                  {ALL_PITCHING_CATEGORIES.map((cat) => (
                    <WrapItem key={cat}>
                      <Checkbox
                        isChecked={form.pitchingCategories.includes(cat)}
                        onChange={() =>
                          toggleCategory('pitchingCategories', cat)
                        }
                      >
                        {cat}
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
                {form.pitchingCategories.length === 0 && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    Select at least one pitching category.
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Roster Slots Per Position</FormLabel>
                <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
                  {ROSTER_POSITIONS.map((position) => (
                    <GridItem key={position}>
                      <FormControl>
                        <FormLabel
                          fontSize="sm"
                          mb={1}
                          htmlFor={`roster-${position}`}
                        >
                          {position}
                        </FormLabel>
                        <Input
                          id={`roster-${position}`}
                          type="number"
                          min={0}
                          value={form.rosterSlots[position]}
                          onChange={(e) =>
                            handleRosterSlotChange(position, e.target.value)
                          }
                        />
                      </FormControl>
                    </GridItem>
                  ))}
                </Grid>
              </FormControl>

              {upsertLeagueMutation.isError ? (
                <Text color="red.500" fontSize="sm">
                  Failed to save league. Check API connection and API key.
                </Text>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isDisabled={!canSubmit}
              isLoading={upsertLeagueMutation.isPending}
            >
              {initialLeague ? 'Save Changes' : 'Create League'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={confirmState !== null}
        leastDestructiveRef={confirmCancelRef}
        onClose={() => setConfirmState(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Drafted Players?
            </AlertDialogHeader>
            <AlertDialogBody>
              Saving will permanently remove{' '}
              <strong>{confirmState?.orphanedCount}</strong> drafted player
              {confirmState?.orphanedCount === 1 ? '' : 's'} that belong to
              eliminated teams or positions. This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={confirmCancelRef}
                onClick={() => setConfirmState(null)}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => void handleConfirmSubmit()}
                ml={3}
                isLoading={upsertLeagueMutation.isPending}
              >
                Save & Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
