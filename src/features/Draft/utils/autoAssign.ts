import type { Player } from '@/shared/hooks/usePlayers';
import type {
  RosterSlots,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { ROSTER_POSITIONS } from '@/features/Leagues/utils/leagueForm';
import { isPlayerAllowedForPosition } from '@/shared/components/ui/PlayerSearchInput';

export function autoAssignSlot(
  player: Player,
  teamId: string,
  currentTakenPlayers: TakenPlayer[],
  rosterSlots: RosterSlots,
  minorLeagueSlots: number,
): string {
  const occupiedSlots = new Set(
    currentTakenPlayers
      .filter(([, tid]) => tid === teamId)
      .map(([, , slot]) => slot),
  );

  for (const position of ROSTER_POSITIONS) {
    const count = rosterSlots[position] ?? 0;
    for (let i = 0; i < count; i++) {
      const slotId = `${position}-${i}`;
      if (
        !occupiedSlots.has(slotId) &&
        isPlayerAllowedForPosition(player, position)
      ) {
        return slotId;
      }
    }
  }

  for (let i = 0; i < minorLeagueSlots; i++) {
    const slotId = `MiLB-${i}`;
    if (
      !occupiedSlots.has(slotId) &&
      isPlayerAllowedForPosition(player, 'MiLB')
    ) {
      return slotId;
    }
  }

  return 'UNSLOTTED';
}
