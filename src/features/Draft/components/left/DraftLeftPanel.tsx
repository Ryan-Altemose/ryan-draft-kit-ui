'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Divider, Flex, Select, Spinner } from '@chakra-ui/react';
import { useLeagues } from '@/features/Leagues/hooks/useLeagues';
import { useLeague } from '@/features/Leagues/hooks/useLeague';
import { useLeagueDrafts } from '@/features/Leagues/hooks/useLeagueDrafts';
import type { League } from '@/features/Leagues/types/leagues.types';
import type { LeagueDraft } from '@/features/Leagues/types/leagueDrafts.types';
import LeagueInfo from './LeagueInfo';

export type DraftSelection = LeagueDraft;

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
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
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
    setSelectedDraftId('');
    lastEmittedLeague.current = null;
    onDraftChange(null);
    if (!id) onLeagueChange(null);
  }

  const drafts = useMemo(
    () => leagueDraftsData?.data ?? [],
    [leagueDraftsData?.data],
  );

  useEffect(() => {
    if (!selectedDraftId) return;

    const draft = drafts.find((entry) => entry._id === selectedDraftId) ?? null;
    onDraftChange(draft);
  }, [drafts, onDraftChange, selectedDraftId]);

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
        value={selectedDraftId}
        onChange={(e) => {
          const draftId = e.target.value;
          setSelectedDraftId(draftId);
          onDraftChange(
            draftId && drafts.length > 0
              ? (drafts.find((d) => d._id === draftId) ?? null)
              : null,
          );
        }}
        isDisabled={!selectedLeagueId || drafts.length === 0}
      >
        {drafts.map((draft) => (
          <option key={draft._id} value={draft._id}>
            {draft.name}
          </option>
        ))}
      </Select>
      {selectedDraftId ? (
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
