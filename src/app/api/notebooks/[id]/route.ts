import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deleteNotebook,
  getNotebookById,
  updateNotebook,
} from '@/features/Notebook/server/notebooks.store';

const UpdateNotebookSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    content: z.string().optional(),
    playerName: z.string().trim().min(1).optional(),
    playerId: z.string().trim().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const notebook = await getNotebookById(id);

  if (!notebook) {
    return NextResponse.json(
      {
        success: false,
        message: 'Notebook not found',
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: notebook,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const updates = UpdateNotebookSchema.parse(body);
  const notebook = await updateNotebook(id, updates);

  if (!notebook) {
    return NextResponse.json(
      {
        success: false,
        message: 'Notebook not found',
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: notebook,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const notebook = await deleteNotebook(id);

  if (!notebook) {
    return NextResponse.json(
      {
        success: false,
        message: 'Notebook not found',
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: notebook,
  });
}
