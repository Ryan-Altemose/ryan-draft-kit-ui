import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createNotebook,
  listNotebooks,
} from '@/features/Notebook/server/notebooks.store';

const NotebookKindSchema = z.enum(['custom', 'player']);

const CreateNotebookSchema = z.object({
  kind: NotebookKindSchema,
  name: z.string().trim().min(1),
  content: z.string().optional(),
  playerName: z.string().trim().min(1).optional(),
  playerId: z.string().trim().min(1).optional(),
});

const NotebookFiltersSchema = z.object({
  kind: NotebookKindSchema.optional(),
  playerName: z.string().trim().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const filters = NotebookFiltersSchema.parse({
    kind: request.nextUrl.searchParams.get('kind') ?? undefined,
    playerName: request.nextUrl.searchParams.get('playerName') ?? undefined,
  });
  const notebooks = await listNotebooks(filters);

  return NextResponse.json({
    success: true,
    data: notebooks,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const input = CreateNotebookSchema.parse(body);
  const notebook = await createNotebook(input);

  return NextResponse.json(
    {
      success: true,
      data: notebook,
    },
    { status: 201 },
  );
}
