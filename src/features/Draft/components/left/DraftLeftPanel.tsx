'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Divider, Flex, Select, Spinner } from '@chakra-ui/react';
import { useLeagues } from '@/features/Leagues/hooks/useLeagues';
import { useLeague } from '@/features/Leagues/hooks/useLeague';
import { useLeagueDrafts } from '@/features/Leagues/hooks/useLeagueDrafts';
import type {
  League,
  LeagueDraft as EmbeddedLeagueDraft,
} from '@/features/Leagues/types/leagues.types';
import type { LeagueDraft as ArchivedLeagueDraft } from '@/features/Leagues/types/leagueDrafts.types';
import LeagueInfo from './LeagueInfo';

export type DraftSelection =
  | ArchivedLeagueDraft
  | (EmbeddedLeagueDraft & {
      _id?: string;
      taken_players?: never;
      teams?: never;
      leagueId?: string;
      totalBudget?: number;
    });

type Props = {
  onLeagueChange: (league: League | null) => void;
  onDraftChange: (draft: DraftSelection | null) => void;
  onCopySelectedDraft?: () => void;
  canCopySelectedDraft?: boolean;
  isCopyingDraft?: boolean;
  initialLeagueId?: string;
};

export default function DraftLeftPanel({
  onLeagueChange,
  onDraftChange,
  onCopySelectedDraft,
  canCopySelectedDraft = false,
  isCopyingDraft = false,
  initialLeagueId,
}: Props) {
  const { data, isLoading } = useLeagues({
    endpoint: '/api/draft-save/leagues',
    queryKey: ['draft-save-leagues'],
  });
  const leagues = data?.data ?? [];
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedDraftName, setSelectedDraftName] = useState<string>('');
  const { data: leagueData } = useLeague(selectedLeagueId || undefined, {
    endpointBase: '/api/draft-save/leagues',
    queryKeyPrefix: 'draft-save-league',
  });
  const { data: leagueDraftsData } = useLeagueDrafts(
    selectedLeagueId || undefined,
    {
      endpointBase: '/api/draft-save/leagues',
      queryKeyPrefix: 'draft-save-league-drafts',
    },
  );
  const lastEmittedLeague = useRef<League | null>(null);

  useEffect(() => {
    if (!initialLeagueId) return;
    setSelectedLeagueId(initialLeagueId);
    lastEmittedLeague.current = null;
  }, [initialLeagueId]);

  useEffect(() => {
    const league = leagueData?.data;
    if (!league) return;

    // Block re-emission of the exact same object. React Query's structural sharing
    // preserves the reference when data hasn't changed, so a refetch returning
    // identical data won't propagate. A refetch returning updated data (new player,
    // new pick, etc.) produces a new reference and will propagate normally.
    if (league === lastEmittedLeague.current) return;
    lastEmittedLeague.current = league;
    onLeagueChange(league);
  }, [leagueData?.data, onLeagueChange]);

  function handleLeagueChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedLeagueId(id);
    setSelectedDraftName('');
    lastEmittedLeague.current = null;
    onDraftChange(null);
    if (!id) onLeagueChange(null);
  }

  const drafts = useMemo(() => {
    const draftsByName = new Map<string, DraftSelection>();

    (leagueData?.data?.drafts ?? []).forEach((draft) => {
      draftsByName.set(draft.name, draft);
    });

    (leagueDraftsData?.data ?? []).forEach((draft) => {
      draftsByName.set(draft.name, draft);
    });

    return Array.from(draftsByName.values());
  }, [leagueData?.data?.drafts, leagueDraftsData?.data]);

  return (
    <Flex direction="column" gap={3} p={4}>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <Select
          placeholder="Select a league"
          size="sm"
          aria-label="League select"
          value={selectedLeagueId}
          onChange={handleLeagueChange}
        >
          {leagues.map((league) => (
            <option key={league._id} value={league._id}>
              {league.name}
            </option>
          ))}
        </Select>
      )}

      <Select
        placeholder="Previous drafts"
        size="sm"
        aria-label="Draft select"
        value={selectedDraftName}
        onChange={(e) => {
          const name = e.target.value;
          setSelectedDraftName(name);
          const draft =
            name && drafts.length > 0
              ? (drafts.find((d) => d.name === name) ?? null)
              : null;
          onDraftChange(draft);
        }}
        isDisabled={!selectedLeagueId || drafts.length === 0}
      >
        {drafts.map((draft) => (
          <option key={draft.name} value={draft.name}>
            {draft.name}
          </option>
        ))}
      </Select>
      {selectedDraftName ? (
        <Button
          size="sm"
          colorScheme="green"
          onClick={onCopySelectedDraft}
          isDisabled={!canCopySelectedDraft}
          isLoading={isCopyingDraft}
        >
          Copy This Draft
        </Button>
      ) : null}

      <Divider />
      <LeagueInfo league={leagueData?.data ?? null} />
    </Flex>
  );
}
