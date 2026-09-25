import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/store';
import { askQuestion } from '@/lib/ask';

interface AskRequestBody {
  sessionId?: string;
  question?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  let body: AskRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const { sessionId, question } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json(
      { error: 'missing_session_id', message: 'sessionId is required' },
      { status: 400 }
    );
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json(
      { error: 'missing_question', message: 'question is required' },
      { status: 400 }
    );
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found', message: 'Session expired or not found. Please re-upload your document.' },
      { status: 404 }
    );
  }

  if (session.clauses.length === 0) {
    return NextResponse.json({
      status: 'insufficient_evidence',
      claims: [],
      nearestClauseIds: [],
      clarifyWithProfessional: [
        'Could you verify that the document contains text and is not an unread scanned image?',
      ],
      discardedCount: 0,
    });
  }

  try {
    const verifiedEnvelope = await askQuestion(question, session.clauses);

    const elapsedMs = Date.now() - startTime;
    // Log IDs, counts, timings ONLY (AGENTS.md rule 8)
    console.info(
      `[ask] sessionId=${sessionId} qLength=${question.length} status=${verifiedEnvelope.status} claims=${verifiedEnvelope.claims.length} discarded=${verifiedEnvelope.discardedCount} elapsedMs=${elapsedMs}`
    );

    return NextResponse.json(verifiedEnvelope);
  } catch (err) {
    const elapsedMs = Date.now() - startTime;
    const errorType = err instanceof Error ? err.name : 'UnknownError';
    console.error(`[ask_error] sessionId=${sessionId} errorType=${errorType} elapsedMs=${elapsedMs}`);

    // If Gemini API fails, return clean fallback refusal envelope
    return NextResponse.json(
      {
        status: 'insufficient_evidence',
        claims: [],
        nearestClauseIds: session.clauses.slice(0, 3).map((c) => c.id),
        clarifyWithProfessional: [
          'The AI model service encountered a temporary error. Would you like to retry your question?',
        ],
        discardedCount: 0,
        error: 'model_unavailable',
      },
      { status: 200 }
    );
  }
}
