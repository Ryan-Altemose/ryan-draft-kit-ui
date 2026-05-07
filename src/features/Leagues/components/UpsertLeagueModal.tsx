'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import type {
  CreateLeagueInput,
  League,
  RosterSlots,
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

const ALL_BATTING_CATEGORIES = BattingCategorySchema.options;
const ALL_PITCHING_CATEGORIES = PitchingCategorySchema.options;
const DEFAULT_BATTING = ['R', 'HR', 'RBI', 'SB', 'AVG'];
const DEFAULT_PITCHING = ['W', 'SV', 'K', 'ERA', 'WHIP'];

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

  type LeagueForm = {
    leagueName: string;
    teams: string;
    totalBudget: string;
    minorLeagueSlotsPerTeam: string;
    taxiSquadPlayersPerTeam: string;
    draftType: 'auction';
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
      rosterSlots,
      totalBudget: Math.max(0, parsedTotalBudget),
      minorLeagueSlotsPerTeam: Math.max(0, parsedMinorLeagueSlots),
      taxiSquadPlayersPerTeam: Math.max(0, parsedTaxiSquadPlayers),
      battingCategories: form.battingCategories,
      pitchingCategories: form.pitchingCategories,
    };

    try {
      await upsertLeagueMutation.mutateAsync({
        input: payload,
        existingLeague: initialLeague,
      });
      resetForm();
      handleClose();
    } catch (error) {
      console.error(error);
    }
  }

  return (
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
                value={form.teams}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next !== '' && !/^\d+$/.test(next)) return;
                  setForm((prev) => ({ ...prev, teams: next }));
                }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="draftType">Draft Type</FormLabel>
              <Select
                id="draftType"
                value={form.draftType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    draftType: e.target.value as 'auction',
                  }))
                }
              >
                <option value="auction">Auction</option>
              </Select>
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
                      onChange={() => toggleCategory('battingCategories', cat)}
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
                      onChange={() => toggleCategory('pitchingCategories', cat)}
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
            colorScheme="blue"
            onClick={handleSubmit}
            isDisabled={!canSubmit}
            isLoading={upsertLeagueMutation.isPending}
          >
            {initialLeague ? 'Save Changes' : 'Create League'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
