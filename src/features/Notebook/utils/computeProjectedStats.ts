import type { Player } from '../types/notebook.types';
import { ROOKIE_AVERAGES } from './rookieAverages';

const TARGET_SEASONS = ['2023', '2024', '2025'] as const;

// Weight per season, oldest to most recent
const SEASON_WEIGHTS: Record<string, number> = {
  '2023': 0.1,
  '2024': 0.3,
  '2025': 0.6,
};

export function computeProjectedStats(player: Player): Record<string, number> {
  const playerType = player.playerType === 'pitcher' ? 'pitcher' : 'hitter';
  const primaryPosition = player.positions?.[0] ?? '';

  // Index the player's actual stats by season year
  const statsBySeason: Record<string, Record<string, number>> = {};
  for (const stat of (player.stats ?? []).filter(
    (s) => s.type === playerType,
  )) {
    const data: Record<string, number> = {};
    for (const [key, val] of Object.entries(stat.data ?? {})) {
      if (typeof val === 'number') data[key] = val;
    }
    statsBySeason[String(stat.season)] = data;
  }

  // For each target season, use the player's real stats or the rookie average fallback
  const seasons = TARGET_SEASONS.map((year) => ({
    data:
      statsBySeason[year] ??
      (ROOKIE_AVERAGES[year]?.[
        primaryPosition as keyof (typeof ROOKIE_AVERAGES)[typeof year]
      ] as Record<string, number> | undefined) ??
      {},
    weight: SEASON_WEIGHTS[year],
  }));

  const allKeys = new Set(seasons.flatMap((s) => Object.keys(s.data)));
  if (allKeys.size === 0) return {};

  const result: Record<string, number> = {};

  for (const key of allKeys) {
    let weightedSum = 0;
    let usedWeight = 0;

    for (const { data, weight } of seasons) {
      const val = data[key];
      if (typeof val === 'number') {
        weightedSum += val * weight;
        usedWeight += weight;
      }
    }

    if (usedWeight > 0) {
      result[key] = weightedSum / usedWeight;
    }
  }

  return result;
}
