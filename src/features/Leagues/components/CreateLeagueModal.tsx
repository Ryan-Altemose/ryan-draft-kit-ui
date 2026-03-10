'use client';

import { useMemo, useState } from 'react';
import {
  Button,
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
} from '@chakra-ui/react';
import type { CreateLeagueInput, RosterSlots } from '../types/leagues.types';
import { useCreateLeague } from '../hooks/useCreateLeague';

type CreateLeagueModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DEFAULT_ROSTER_SLOTS: RosterSlots = {
  C: 1,
  '1B': 1,
  '2B': 1,
  '3B': 1,
  SS: 1,
  OF: 3,
  DH: 0,
  SP: 5,
  RP: 2,
  UTIL: 0,
  BENCH: 0,
};

const ROSTER_POSITIONS: (keyof RosterSlots)[] = [
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'OF',
  'DH',
  'SP',
  'RP',
  'UTIL',
  'BENCH',
];

export default function CreateLeagueModal({
  isOpen,
  onClose,
}: CreateLeagueModalProps) {
  const createLeagueMutation = useCreateLeague();
  type LeagueForm = {
    leagueName: string;
    teams: number;
    draftType: 'auction';
    rosterSlots: RosterSlots;
  };

  const DEFAULT_FORM: LeagueForm = {
    leagueName: '',
    teams: 12,
    draftType: 'auction',
    rosterSlots: { ...DEFAULT_ROSTER_SLOTS },
  };

  const [form, setForm] = useState<LeagueForm>(DEFAULT_FORM);

  const canSubmit = useMemo(() => {
    return form.leagueName.trim().length > 0 && form.teams > 1;
  }, [form.leagueName, form.teams]);

  function handleRosterSlotChange(position: keyof RosterSlots, value: string) {
    const parsed = Number.parseInt(value, 10);

    setForm((prev) => ({
      ...prev,
      rosterSlots: {
        ...prev.rosterSlots,
        [position]: Number.isNaN(parsed) || parsed < 0 ? 0 : parsed,
      },
    }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
  }

  function handleClose() {
    createLeagueMutation.reset();
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    const payload: CreateLeagueInput = {
      name: form.leagueName.trim(),
      teams: form.teams,
      draftType: form.draftType,
      rosterSlots: form.rosterSlots,
    };

    try {
      await createLeagueMutation.mutateAsync(payload);
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
        <ModalHeader>Create League</ModalHeader>
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
                  const value = Number.parseInt(e.target.value, 10);

                  setForm((prev) => ({
                    ...prev,
                    teams: Number.isNaN(value) ? 2 : Math.max(2, value),
                  }));
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

            {createLeagueMutation.isError ? (
              <Text color="red.500" fontSize="sm">
                Failed to create league. Check API connection and API key.
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
            isLoading={createLeagueMutation.isPending}
          >
            Create League
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
