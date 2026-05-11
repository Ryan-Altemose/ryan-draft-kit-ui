import { describe, it, expect } from 'vitest';
import {
  isLowerBetter,
  getOrdinal,
  getFakeProjection,
  getRank,
  getStatColors,
  BATTING_LOWER_IS_BETTER,
  PITCHING_LOWER_IS_BETTER,
} from './CompareModal';

describe('isLowerBetter', () => {
  it('returns true for batting K', () => {
    expect(isLowerBetter('K', 'Batting')).toBe(true);
  });

  it('returns false for all other batting stats', () => {
    for (const stat of [
      'R',
      'HR',
      'RBI',
      'SB',
      'AVG',
      'OBP',
      'SLG',
      'OPS',
      'H',
      '2B',
      '3B',
      'BB',
    ]) {
      expect(isLowerBetter(stat, 'Batting')).toBe(false);
    }
  });

  it('returns true for pitching lower-is-better stats', () => {
    for (const stat of PITCHING_LOWER_IS_BETTER) {
      expect(isLowerBetter(stat, 'Pitching')).toBe(true);
    }
  });

  it('returns false for pitching higher-is-better stats', () => {
    for (const stat of ['W', 'SV', 'K', 'QS', 'IP', 'HLD', 'SV+HLD']) {
      expect(isLowerBetter(stat, 'Pitching')).toBe(false);
    }
  });

  it('K is higher-is-better for pitching (strikeouts)', () => {
    expect(isLowerBetter('K', 'Pitching')).toBe(false);
  });

  it('H is lower-is-better for pitching but higher-is-better for batting', () => {
    expect(isLowerBetter('H', 'Pitching')).toBe(true);
    expect(isLowerBetter('H', 'Batting')).toBe(false);
  });

  it('HR is lower-is-better for pitching but higher-is-better for batting', () => {
    expect(isLowerBetter('HR', 'Pitching')).toBe(true);
    expect(isLowerBetter('HR', 'Batting')).toBe(false);
  });

  it('BB is lower-is-better for pitching but higher-is-better for batting', () => {
    expect(isLowerBetter('BB', 'Pitching')).toBe(true);
    expect(isLowerBetter('BB', 'Batting')).toBe(false);
  });
});

describe('getOrdinal', () => {
  it('handles st suffix', () => {
    expect(getOrdinal(1)).toBe('1st');
    expect(getOrdinal(21)).toBe('21st');
    expect(getOrdinal(31)).toBe('31st');
  });

  it('handles nd suffix', () => {
    expect(getOrdinal(2)).toBe('2nd');
    expect(getOrdinal(22)).toBe('22nd');
  });

  it('handles rd suffix', () => {
    expect(getOrdinal(3)).toBe('3rd');
    expect(getOrdinal(23)).toBe('23rd');
  });

  it('handles th suffix', () => {
    expect(getOrdinal(4)).toBe('4th');
    expect(getOrdinal(10)).toBe('10th');
    expect(getOrdinal(11)).toBe('11th');
    expect(getOrdinal(12)).toBe('12th');
    expect(getOrdinal(13)).toBe('13th');
    expect(getOrdinal(20)).toBe('20th');
  });

  it('handles teen exceptions (11th, 12th, 13th)', () => {
    expect(getOrdinal(111)).toBe('111th');
    expect(getOrdinal(112)).toBe('112th');
    expect(getOrdinal(113)).toBe('113th');
  });
});

describe('getFakeProjection', () => {
  it('always returns a positive integer', () => {
    for (let t = 0; t < 12; t++) {
      for (let s = 0; s < 15; s++) {
        const val = getFakeProjection(t, s);
        expect(val).toBeGreaterThan(0);
        expect(Number.isInteger(val)).toBe(true);
      }
    }
  });

  it('produces different values for different team/stat combinations', () => {
    const values = new Set(
      Array.from({ length: 12 }, (_, t) =>
        Array.from({ length: 10 }, (_, s) => getFakeProjection(t, s)),
      ).flat(),
    );
    expect(values.size).toBeGreaterThan(1);
  });

  it('is deterministic', () => {
    expect(getFakeProjection(3, 5)).toBe(getFakeProjection(3, 5));
  });
});

describe('getRank', () => {
  it('gives rank 1 to the best value (higher-is-better)', () => {
    expect(getRank(100, [100, 80, 60, 40], false)).toBe(1);
  });

  it('gives rank 1 to the best value (lower-is-better)', () => {
    expect(getRank(1, [1, 2, 3, 4], true)).toBe(1);
  });

  it('gives the correct rank for a middle value', () => {
    expect(getRank(60, [100, 80, 60, 40], false)).toBe(3);
  });

  it('gives the correct rank when lower-is-better', () => {
    expect(getRank(3, [1, 2, 3, 4], true)).toBe(3);
  });

  it('handles ties — both tied values get the same rank', () => {
    expect(getRank(80, [100, 80, 80, 40], false)).toBe(2);
  });

  it('skips ranks after a tie (no 3rd when two teams tied for 2nd)', () => {
    const allValues = [100, 80, 80, 40];
    expect(getRank(40, allValues, false)).toBe(4);
  });

  it('returns rank 1 when all values are equal', () => {
    expect(getRank(5, [5, 5, 5], false)).toBe(1);
    expect(getRank(5, [5, 5, 5], true)).toBe(1);
  });
});

describe('getStatColors', () => {
  it('returns blue for both when values are equal', () => {
    const result = getStatColors(5, 5, 'HR', 'Batting');
    expect(result).toEqual({ leftColor: 'blue.500', rightColor: 'blue.500' });
  });

  it('left is green when left has more HRs (higher-is-better)', () => {
    const result = getStatColors(10, 5, 'HR', 'Batting');
    expect(result).toEqual({ leftColor: 'green.500', rightColor: 'red.500' });
  });

  it('right is green when right has more HRs', () => {
    const result = getStatColors(5, 10, 'HR', 'Batting');
    expect(result).toEqual({ leftColor: 'red.500', rightColor: 'green.500' });
  });

  it('left is green when left has fewer Ks (lower-is-better batting)', () => {
    const result = getStatColors(50, 100, 'K', 'Batting');
    expect(result).toEqual({ leftColor: 'green.500', rightColor: 'red.500' });
  });

  it('left is green when left has lower ERA (lower-is-better pitching)', () => {
    const result = getStatColors(2, 5, 'ERA', 'Pitching');
    expect(result).toEqual({ leftColor: 'green.500', rightColor: 'red.500' });
  });

  it('right is green when right has lower WHIP', () => {
    const result = getStatColors(1.5, 1.1, 'WHIP', 'Pitching');
    expect(result).toEqual({ leftColor: 'red.500', rightColor: 'green.500' });
  });

  it('left is green for pitching Ks (higher-is-better)', () => {
    const result = getStatColors(200, 150, 'K', 'Pitching');
    expect(result).toEqual({ leftColor: 'green.500', rightColor: 'red.500' });
  });

  it('handles all pitching lower-is-better stats', () => {
    for (const stat of PITCHING_LOWER_IS_BETTER) {
      const result = getStatColors(1, 5, stat, 'Pitching');
      expect(result.leftColor).toBe('green.500');
      expect(result.rightColor).toBe('red.500');
    }
  });

  it('handles all batting higher-is-better stats', () => {
    for (const stat of ['R', 'HR', 'RBI', 'SB', 'AVG', 'OBP', 'SLG', 'OPS']) {
      const result = getStatColors(10, 5, stat, 'Batting');
      expect(result.leftColor).toBe('green.500');
      expect(result.rightColor).toBe('red.500');
    }
  });

  it('handles all batting lower-is-better stats', () => {
    for (const stat of BATTING_LOWER_IS_BETTER) {
      const result = getStatColors(1, 5, stat, 'Batting');
      expect(result.leftColor).toBe('green.500');
      expect(result.rightColor).toBe('red.500');
    }
  });
});
