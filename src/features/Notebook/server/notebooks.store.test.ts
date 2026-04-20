import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createNotebook,
  deleteNotebook,
  getNotebookById,
  listNotebooks,
  updateNotebook,
} from './notebooks.store';

describe('notebooks.store', () => {
  let tempDirectory: string;
  let notebooksFile: string;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'notebooks-store-'));
    notebooksFile = path.join(tempDirectory, 'notebooks.json');
    process.env.NOTEBOOKS_DATA_FILE = notebooksFile;
  });

  afterEach(async () => {
    delete process.env.NOTEBOOKS_DATA_FILE;
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('creates and lists custom notebooks', async () => {
    const notebook = await createNotebook({
      kind: 'custom',
      name: 'Draft Targets',
      content: 'Track value bats',
    });

    const notebooks = await listNotebooks({ kind: 'custom' });

    expect(notebook._id).toBeTruthy();
    expect(notebooks).toHaveLength(1);
    expect(notebooks[0].name).toBe('Draft Targets');
  });

  it('upserts player notebooks by player name', async () => {
    const first = await createNotebook({
      kind: 'player',
      name: 'Aaron Judge',
      playerName: 'Aaron Judge',
      playerId: '592450',
      content: 'Monitor health',
    });

    const second = await createNotebook({
      kind: 'player',
      name: 'Aaron Judge',
      playerName: 'Aaron Judge',
      playerId: '592450',
      content: 'Cleared to play',
    });

    const notebooks = await listNotebooks({ kind: 'player' });

    expect(first._id).toBe(second._id);
    expect(notebooks).toHaveLength(1);
    expect(notebooks[0].content).toBe('Cleared to play');
  });

  it('updates and deletes notebooks by id', async () => {
    const notebook = await createNotebook({
      kind: 'custom',
      name: 'Auction Notes',
      content: 'Save cash for closers',
    });

    const updated = await updateNotebook(notebook._id, {
      name: 'Auction Plan',
      content: 'Push power early',
    });
    const fetched = await getNotebookById(notebook._id);
    const deleted = await deleteNotebook(notebook._id);
    const afterDelete = await getNotebookById(notebook._id);

    expect(updated?.name).toBe('Auction Plan');
    expect(fetched?.content).toBe('Push power early');
    expect(deleted?._id).toBe(notebook._id);
    expect(afterDelete).toBeNull();
  });

  it('persists data to disk', async () => {
    await createNotebook({
      kind: 'custom',
      name: 'Persistent Note',
      content: 'Should be written to file',
    });

    const fileContents = await readFile(notebooksFile, 'utf8');
    expect(fileContents).toContain('Persistent Note');
  });
});
