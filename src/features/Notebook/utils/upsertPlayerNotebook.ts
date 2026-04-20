import { backendClient } from '@/shared/utils/api-client';
import type { NotebookResponse } from '../types/notebook.types';

type UpsertPlayerNotebookInput = {
  playerId: string;
  playerName: string;
  content: string;
};

export async function upsertPlayerNotebook({
  playerId,
  playerName,
  content,
}: UpsertPlayerNotebookInput): Promise<NotebookResponse> {
  return backendClient.post<NotebookResponse>('/api/notebooks', {
    kind: 'player',
    name: playerName,
    playerId,
    playerName,
    content,
  });
}
