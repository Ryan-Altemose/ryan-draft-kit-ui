'use client';

import type { BaseEntity } from '@/shared/types/api';

export type PlayerStat = {
  season: string; // e.g. "2023"
  type: 'hitter' | 'pitcher';
  data: Record<string, number | string | null | undefined>;
};

export type Player = {
  _id: string;
  name: string;
  team: string;
  positions: string[];
  playerType?: string;
  league?: string;
  injuryStatus: string;
  depthChartStatus?: 'starter' | 'backup' | 'reserve' | 'minors';
  depthChartOrder?: number;
  active?: boolean;
  age?: number;
  batSide?: string;
  pitchHand?: string;
  stats?: PlayerStat[];
};

export type PlayersResponse = {
  success?: boolean;
  data?: Player[];
  pagination?: {
    totalPages?: number;
  };
};

export type NotebookKind = 'custom' | 'player';

export type Notebook = BaseEntity & {
  userId?: string;
  kind: NotebookKind;
  name: string;
  content: string;
  playerName?: string;
  playerId?: string;
};

export type NotebookListEntry = Pick<Notebook, '_id' | 'name'>;

export type UpdateNotebookInput = {
  name?: string;
  content?: string;
  playerName?: string;
  playerId?: string;
};

export type NotebookResponse = {
  success: boolean;
  data: Notebook;
};

export type NotebooksResponse = {
  success: boolean;
  data: Notebook[];
};

export type NotebookWindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
