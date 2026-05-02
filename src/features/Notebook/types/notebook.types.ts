'use client';

import type { BaseEntity } from '@/shared/types/api';

export type Player = {
  _id: string;
  name: string;
  team: string;
  positions: string[];
  playerType?: string;
  league?: string;
  injuryStatus: string;
  active?: boolean;
  age?: number;
  batSide?: string;
  pitchHand?: string;
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
