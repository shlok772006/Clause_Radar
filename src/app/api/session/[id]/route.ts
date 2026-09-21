import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json(
      {
        error: 'session_not_found',
        message: 'This review expired or does not exist. Please upload your document again.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json(session);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const deleted = deleteSession(id);

  if (!deleted) {
    return NextResponse.json(
      { error: 'not_found', message: 'Session not found or already deleted.' },
      { status: 404 }
    );
  }

  // Log ID only
  console.info(`[session] deleted id=${id}`);
  return new NextResponse(null, { status: 204 });
}
