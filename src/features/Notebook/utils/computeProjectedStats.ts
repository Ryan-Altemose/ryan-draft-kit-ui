import type { Player } from '../types/notebook.types';

// Weights from oldest to most recent season (must sum to 1.0 for 3 seasons)
const SEASON_WEIGHTS = [0.1, 0.3, 0.6];

export function computeProjectedStats(player: Player): Record<string, number> {
  const relevantStats = (player.stats ?? [])
    .filter((s) => s.type === player.playerType)
    .sort((a, b) => String(a.season).localeCompare(String(b.season)))
    .slice(-3);

  if (relevantStats.length === 0) return {};

  // Take the last N weights and normalize so they always sum to 1,
  // which handles players with fewer than 3 seasons gracefully.
  const rawWeights = SEASON_WEIGHTS.slice(-relevantStats.length);
  const weightTotal = rawWeights.reduce((a, b) => a + b, 0);
  const weights = rawWeights.map((w) => w / weightTotal);

  const result: Record<string, number> = {};

  const allKeys = new Set(
    relevantStats.flatMap((s) => Object.keys(s.data ?? {})),
  );

  for (const key of allKeys) {
    let weightedSum = 0;
    let usedWeight = 0;

    for (let i = 0; i < relevantStats.length; i++) {
      const val = relevantStats[i].data?.[key];
      if (typeof val === 'number') {
        weightedSum += val * weights[i];
        usedWeight += weights[i];
      }
    }

    // Normalize per-key so missing seasons in a key don't skew the result
    if (usedWeight > 0) {
      result[key] = weightedSum / usedWeight;
    }
  }

  return result;
}
