'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Notebook, Player } from '../types/notebook.types';
import { useCreateNotebook } from './useCreateNotebook';
import { useDeleteNotebook } from './useDeleteNotebook';
import { useNotebooks } from './useNotebooks';
import { useUpdateNotebook } from './useUpdateNotebook';
import { useUpsertPlayerNotebook } from './useUpsertPlayerNotebook';

type PendingNotebookUpdate = {
  name?: string;
  content?: string;
};

function buildEmptyPlayerNotebook(player: Player, content: string): Notebook {
  const now = new Date().toISOString();

  return {
    _id: '',
    kind: 'player',
    name: player.name,
    playerId: player._id,
    playerName: player.name,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export function useNotebookManager() {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(
    null,
  );
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(
    null,
  );
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localNotebooks, setLocalNotebooks] = useState<Notebook[]>([]);
  const [localPlayerNotes, setLocalPlayerNotes] = useState<
    Record<string, Notebook>
  >({});
  const notebookSaveTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const notebookPendingUpdatesRef = useRef<
    Record<string, PendingNotebookUpdate>
  >({});
  const playerSaveTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const notebooksQuery = useNotebooks();
  const createNotebookMutation = useCreateNotebook();
  const deleteNotebookMutation = useDeleteNotebook();
  const updateNotebookMutation = useUpdateNotebook();
  const upsertPlayerNotebookMutation = useUpsertPlayerNotebook();

  useEffect(() => {
    if (!notebooksQuery.data?.data) {
      return;
    }

    const notebooks = notebooksQuery.data.data;
    const customNotebooks = notebooks.filter(
      (notebook) => notebook.kind === 'custom',
    );
    const playerNotebooks = notebooks
      .filter((notebook) => notebook.kind === 'player' && notebook.playerName)
      .reduce<Record<string, Notebook>>((accumulator, notebook) => {
        accumulator[notebook.playerName!] = notebook;
        return accumulator;
      }, {});

    setLocalNotebooks(customNotebooks);
    setLocalPlayerNotes(playerNotebooks);
  }, [notebooksQuery.data]);

  useEffect(() => {
    return () => {
      Object.values(notebookSaveTimeoutsRef.current).forEach(clearTimeout);
      Object.values(playerSaveTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const selectedNotebook = useMemo(
    () =>
      localNotebooks.find((notebook) => notebook._id === selectedNotebookId) ??
      null,
    [localNotebooks, selectedNotebookId],
  );

  const selectedItemName = selectedPlayerName ?? selectedNotebook?.name ?? null;
  const selectedItemContent = selectedPlayerName
    ? (localPlayerNotes[selectedPlayerName]?.content ?? '')
    : (selectedNotebook?.content ?? '');

  const scheduleNotebookSave = (id: string, updates: PendingNotebookUpdate) => {
    notebookPendingUpdatesRef.current[id] = {
      ...notebookPendingUpdatesRef.current[id],
      ...updates,
    };
    clearTimeout(notebookSaveTimeoutsRef.current[id]);

    notebookSaveTimeoutsRef.current[id] = setTimeout(async () => {
      try {
        const response = await updateNotebookMutation.mutateAsync({
          id,
          updates: notebookPendingUpdatesRef.current[id] ?? {},
        });

        setLocalNotebooks((current) =>
          current.map((notebook) =>
            notebook._id === id ? response.data : notebook,
          ),
        );
        setSaveError(null);
      } catch {
        setSaveError('Unable to save notebook changes.');
      } finally {
        delete notebookPendingUpdatesRef.current[id];
        delete notebookSaveTimeoutsRef.current[id];
      }
    }, 500);
  };

  const schedulePlayerNoteSave = (player: Player, content: string) => {
    clearTimeout(playerSaveTimeoutsRef.current[player.name]);

    playerSaveTimeoutsRef.current[player.name] = setTimeout(async () => {
      try {
        const response = await upsertPlayerNotebookMutation.mutateAsync({
          playerId: player._id,
          playerName: player.name,
          content,
        });

        setLocalPlayerNotes((current) => ({
          ...current,
          [player.name]: response.data,
        }));
        setSaveError(null);
      } catch {
        setSaveError(`Unable to save note for ${player.name}.`);
      } finally {
        delete playerSaveTimeoutsRef.current[player.name];
      }
    }, 500);
  };

  const addNotebook = async () => {
    try {
      const response = await createNotebookMutation.mutateAsync('New Notebook');
      const notebook = response.data;

      setLocalNotebooks((current) => [notebook, ...current]);
      setSelectedPlayerName(null);
      setSelectedPlayer(null);
      setSelectedNotebookId(notebook._id);
      setSaveError(null);
    } catch {
      setSaveError('Unable to create a notebook.');
    }
  };

  const renameNotebook = (id: string, name: string) => {
    setLocalNotebooks((current) =>
      current.map((notebook) =>
        notebook._id === id ? { ...notebook, name } : notebook,
      ),
    );
    scheduleNotebookSave(id, { name });
  };

  const removeNotebook = async (id: string) => {
    clearTimeout(notebookSaveTimeoutsRef.current[id]);
    delete notebookSaveTimeoutsRef.current[id];
    delete notebookPendingUpdatesRef.current[id];

    try {
      await deleteNotebookMutation.mutateAsync(id);

      setLocalNotebooks((current) =>
        current.filter((notebook) => notebook._id !== id),
      );

      if (selectedNotebookId === id) {
        setSelectedNotebookId(null);
      }

      setSaveError(null);
    } catch {
      setSaveError('Unable to delete notebook.');
    }
  };

  const updateNotebookContent = (id: string, content: string) => {
    setLocalNotebooks((current) =>
      current.map((notebook) =>
        notebook._id === id ? { ...notebook, content } : notebook,
      ),
    );
    scheduleNotebookSave(id, { content });
  };

  const updatePlayerContent = (playerName: string, content: string) => {
    const activePlayer =
      selectedPlayer?.name === playerName ? selectedPlayer : null;

    if (!activePlayer) {
      return;
    }

    setLocalPlayerNotes((current) => ({
      ...current,
      [playerName]:
        current[playerName] ?? buildEmptyPlayerNotebook(activePlayer, content),
    }));
    setLocalPlayerNotes((current) => ({
      ...current,
      [playerName]: {
        ...(current[playerName] ??
          buildEmptyPlayerNotebook(activePlayer, content)),
        content,
      },
    }));
    schedulePlayerNoteSave(activePlayer, content);
  };

  const openNotebook = (id: string) => {
    setSelectedPlayerName(null);
    setSelectedPlayer(null);
    setSelectedNotebookId(id);
  };

  const openPlayerNotebook = (player: Player) => {
    setSelectedNotebookId(null);
    setSelectedPlayerName(player.name);
    setSelectedPlayer(player);
  };

  const closeNotebook = () => {
    setSelectedNotebookId(null);
    setSelectedPlayerName(null);
    setSelectedPlayer(null);
  };

  return {
    notebooks: localNotebooks,
    selectedNotebookId,
    selectedNotebookName: selectedItemName,
    selectedNotebookContent: selectedItemContent,
    selectedPlayerName,
    selectedPlayer,
    isLoadingNotebooks: notebooksQuery.isLoading,
    notebooksError: notebooksQuery.isError
      ? 'Unable to load notebook data from the backend.'
      : null,
    saveError,
    addNotebook,
    renameNotebook,
    removeNotebook,
    updateNotebookContent,
    updatePlayerContent,
    openNotebook,
    openPlayerNotebook,
    closeNotebook,
  };
}
