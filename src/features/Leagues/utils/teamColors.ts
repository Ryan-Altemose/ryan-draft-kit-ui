export const TEAM_COLORS = [
  'red.100',
  'orange.100',
  'yellow.100',
  'green.100',
  'blue.100',
  'purple.100',
  'pink.100',
  'teal.100',
  'red.200',
  'orange.200',
  'yellow.200',
  'green.200',
  'blue.200',
  'purple.200',
  'pink.200',
  'gray.200',
] as const;

export const MAX_TEAMS = 16;

export function getTeamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}
