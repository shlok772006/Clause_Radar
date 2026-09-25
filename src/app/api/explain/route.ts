import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/store';
import { explainClause } from '@/lib/explain';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { sessionId?: string; clauseId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const { sessionId, clauseId } = body;

  if (!sessionId || !clauseId) {
    return NextResponse.json(
      { error: 'missing_fields', message: 'Both sessionId and clauseId are required.' },
      { status: 400 }
    );
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found', message: 'Session expired or not found.' },
      { status: 404 }
    );
  }

  const clause = session.clauses.find((c) => c.id === clauseId);
  if (!clause) {
    return NextResponse.json(
      { error: 'clause_not_found', message: `Clause ${clauseId} not found in this document.` },
      { status: 404 }
    );
  }

  const result = await explainClause(clause);

  return NextResponse.json(result);
}
