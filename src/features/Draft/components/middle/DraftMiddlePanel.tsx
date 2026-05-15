'use client';

import { Box, Flex } from '@chakra-ui/react';
import type {
  DraftPick,
  LeagueTeam,
  RosterSlots,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';
import DraftBoard from './DraftBoard';
import ValuationSearch from './ValuationSearch';

type DraftMiddlePanelProps = {
  teams?: LeagueTeam[];
  takenPlayers?: TakenPlayer[];
  draftPicks?: DraftPick[];
  startingBudget?: number;
  rosterSlots?: RosterSlots;
  minorLeagueSlots?: number;
  leagueType?: 'MLB' | 'AL' | 'NL';
  onPickEntered?: (pick: DraftPick, takenEntry: TakenPlayer) => void;
  onUndo?: () => void;
  onFinishDraft?: (name: string) => void | Promise<void>;
  onValuationPlayerClick?: (player: NotebookPlayer) => void;
  readOnly?: boolean;
};

export default function DraftMiddlePanel({
  teams,
  takenPlayers,
  draftPicks,
  startingBudget,
  rosterSlots,
  minorLeagueSlots,
  leagueType,
  onPickEntered,
  onUndo,
  onFinishDraft,
  onValuationPlayerClick,
  readOnly = false,
}: DraftMiddlePanelProps) {
  return (
    <Flex direction="column" h="100%">
      <Box
        flex="2"
        borderBottomWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <DraftBoard
          teams={teams}
          takenPlayers={takenPlayers}
          draftPicks={draftPicks}
          startingBudget={startingBudget}
          rosterSlots={rosterSlots}
          minorLeagueSlots={minorLeagueSlots}
          leagueType={leagueType}
          onPickEntered={onPickEntered}
          onUndo={onUndo}
          onFinishDraft={onFinishDraft}
          readOnly={readOnly}
        />
      </Box>
      <Box flex="1" overflow="hidden" p={4}>
        <ValuationSearch onPlayerClick={onValuationPlayerClick} />
      </Box>
    </Flex>
  );
}
