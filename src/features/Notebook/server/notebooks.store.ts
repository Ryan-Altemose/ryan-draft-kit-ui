import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type StoredNotebook = {
  _id: string;
  kind: 'custom' | 'player';
  name: string;
  content: string;
  playerName?: string;
  playerId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotebookFilters = {
  kind?: 'custom' | 'player';
  playerName?: string;
};

type CreateNotebookInput = {
  kind: 'custom' | 'player';
  name: string;
  content?: string;
  playerName?: string;
  playerId?: string;
};

type UpdateNotebookInput = {
  name?: string;
  content?: string;
  playerName?: string;
  playerId?: string;
};

const DEFAULT_NOTEBOOKS_FILE = path.join(
  process.cwd(),
  'src',
  'features',
  'Notebook',
  'server',
  'data',
  'notebooks.json',
);

function getNotebooksFilePath(): string {
  return process.env.NOTEBOOKS_DATA_FILE || DEFAULT_NOTEBOOKS_FILE;
}

async function ensureStoreFile(): Promise<string> {
  const filePath = getNotebooksFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, 'utf8');
  } catch {
    await writeFile(filePath, '[]', 'utf8');
  }

  return filePath;
}

function isStoredNotebook(value: unknown): value is StoredNotebook {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const notebook = value as Partial<StoredNotebook>;

  return (
    typeof notebook._id === 'string' &&
    (notebook.kind === 'custom' || notebook.kind === 'player') &&
    typeof notebook.name === 'string' &&
    typeof notebook.content === 'string' &&
    typeof notebook.createdAt === 'string' &&
    typeof notebook.updatedAt === 'string'
  );
}

async function readNotebooks(): Promise<StoredNotebook[]> {
  const filePath = await ensureStoreFile();
  const fileContents = await readFile(filePath, 'utf8');

  try {
    const parsed = JSON.parse(fileContents) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isStoredNotebook);
  } catch {
    return [];
  }
}

async function writeNotebooks(notebooks: StoredNotebook[]): Promise<void> {
  const filePath = await ensureStoreFile();
  await writeFile(filePath, JSON.stringify(notebooks, null, 2), 'utf8');
}

export async function listNotebooks(
  filters: NotebookFilters = {},
): Promise<StoredNotebook[]> {
  const notebooks = await readNotebooks();

  return notebooks
    .filter((notebook) => {
      if (filters.kind && notebook.kind !== filters.kind) {
        return false;
      }

      if (filters.playerName && notebook.playerName !== filters.playerName) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getNotebookById(
  id: string,
): Promise<StoredNotebook | null> {
  const notebooks = await readNotebooks();
  return notebooks.find((notebook) => notebook._id === id) ?? null;
}

export async function createNotebook(
  input: CreateNotebookInput,
): Promise<StoredNotebook> {
  const notebooks = await readNotebooks();
  const now = new Date().toISOString();

  if (input.kind === 'player' && input.playerName) {
    const existingIndex = notebooks.findIndex(
      (notebook) =>
        notebook.kind === 'player' && notebook.playerName === input.playerName,
    );

    if (existingIndex >= 0) {
      const updatedNotebook: StoredNotebook = {
        ...notebooks[existingIndex],
        name: input.name,
        content: input.content ?? '',
        playerName: input.playerName,
        playerId: input.playerId,
        updatedAt: now,
      };

      notebooks[existingIndex] = updatedNotebook;
      await writeNotebooks(notebooks);
      return updatedNotebook;
    }
  }

  const notebook: StoredNotebook = {
    _id: randomUUID(),
    kind: input.kind,
    name: input.name,
    content: input.content ?? '',
    playerName: input.playerName,
    playerId: input.playerId,
    createdAt: now,
    updatedAt: now,
  };

  notebooks.push(notebook);
  await writeNotebooks(notebooks);
  return notebook;
}

export async function updateNotebook(
  id: string,
  updates: UpdateNotebookInput,
): Promise<StoredNotebook | null> {
  const notebooks = await readNotebooks();
  const index = notebooks.findIndex((notebook) => notebook._id === id);

  if (index < 0) {
    return null;
  }

  const updatedNotebook: StoredNotebook = {
    ...notebooks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  notebooks[index] = updatedNotebook;
  await writeNotebooks(notebooks);
  return updatedNotebook;
}

export async function deleteNotebook(
  id: string,
): Promise<StoredNotebook | null> {
  const notebooks = await readNotebooks();
  const index = notebooks.findIndex((notebook) => notebook._id === id);

  if (index < 0) {
    return null;
  }

  const [deletedNotebook] = notebooks.splice(index, 1);
  await writeNotebooks(notebooks);
  return deletedNotebook;
}
