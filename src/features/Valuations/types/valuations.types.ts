export type PlayerValuation = {
  playerId: string;
  name: string;
  team: string;
  positions: string[];
  dollarValue: number;
  playerType?: 'hitter' | 'pitcher';
  age?: number;
  injuryStatus?: string;
  depthChartStatus?: string;
  depthChartOrder?: number;
  averagedStats?: Record<string, number>;
};

export type LeagueValuationsData = {
  leagueId?: string;
  leagueName: string;
  valuations: PlayerValuation[];
  pagination: { page: number; limit: number; total: number };
};

export type LeagueValuationsResponse = {
  success: boolean;
  data: LeagueValuationsData;
};
