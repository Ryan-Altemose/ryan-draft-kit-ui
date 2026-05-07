'use client';

import { Input } from '@chakra-ui/react';
import type { Player } from '@/shared/hooks/usePlayers';
import { formatPlayerDisplay } from '@/shared/utils/format';

export function isPlayerAllowedForPosition(
  player: Player,
  position: string,
): boolean {
  if (position === 'MiLB') return !player.mlbDebutDate;
  if (position === 'BENCH') return true;
  if (position === 'UTIL') return player.playerType === 'hitter';
  if (position === 'CI')
    return player.positions.includes('1B') || player.positions.includes('3B');
  if (position === 'MI')
    return player.positions.includes('2B') || player.positions.includes('SS');
  return player.positions.includes(position);
}

type PlayerSearchInputProps = {
  players: Player[];
  unavailablePlayerIds: Set<string>;
  position?: string;
  value: string;
  onChange: (searchText: string, playerId: string, team: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
  listId: string;
};

export default function PlayerSearchInput({
  players,
  unavailablePlayerIds,
  position,
  value,
  onChange,
  isDisabled,
  placeholder = 'Search players...',
  listId,
}: PlayerSearchInputProps) {
  const allowedPlayers = players.filter(
    (player) =>
      (position === undefined ||
        isPlayerAllowedForPosition(player, position)) &&
      !unavailablePlayerIds.has(player._id),
  );

  function handleChange(inputValue: string) {
    const exactMatch = allowedPlayers.find(
      (player) =>
        player.name === inputValue ||
        formatPlayerDisplay(player) === inputValue,
    );
    onChange(
      exactMatch ? formatPlayerDisplay(exactMatch) : inputValue,
      exactMatch?._id ?? '',
      exactMatch?.team ?? '',
    );
  }

  return (
    <>
      <Input
        size="sm"
        bg="white"
        value={value}
        placeholder={placeholder}
        list={listId}
        onChange={(e) => handleChange(e.target.value)}
        isDisabled={isDisabled}
      />
      <datalist id={listId}>
        {allowedPlayers.map((player) => (
          <option key={player._id} value={player.name} />
        ))}
      </datalist>
    </>
  );
}
