import type { RosterSlots } from '../types/leagues.types';

export const DEFAULT_ROSTER_SLOTS: RosterSlots = {
  C: 1,
  '1B': 1,
  '2B': 1,
  '3B': 1,
  SS: 1,
  CI: 1,
  MI: 1,
  OF: 3,
  SP: 2,
  RP: 2,
  UTIL: 0,
  P: 0,
  BENCH: 0,
};

export const ROSTER_POSITIONS: (keyof RosterSlots)[] = [
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'CI',
  'MI',
  'OF',
  'SP',
  'RP',
  'P',
  'UTIL',
  'BENCH',
];

export function parseTeamsFromDescription(
  description?: string,
): number | undefined {
  if (!description) return undefined;
  const match = description.match(/(\d+)\s*teams?/i);
  if (!match) return undefined;
  const value = Number.parseInt(match[1] ?? '', 10);
  return Number.isNaN(value) ? undefined : value;
}
