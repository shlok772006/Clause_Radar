import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/store';
import { generateNegotiationEmail, generateLawyerQuestions } from '@/lib/act';
import { Concern } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    sessionId?: string;
    type?: 'email' | 'questions';
    selectedConcerns?: Concern[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const { sessionId, type = 'email', selectedConcerns = [] } = body;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'missing_session_id', message: 'Session ID is required.' },
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

  if (type === 'email') {
    const email = await generateNegotiationEmail(
      session.findings,
      selectedConcerns,
      session.clauses
    );
    return NextResponse.json({ type: 'email', content: email });
  }

  if (type === 'questions') {
    const questions = await generateLawyerQuestions(
      session.findings,
      session.clauses
    );
    return NextResponse.json({ type: 'questions', content: questions });
  }

  return NextResponse.json(
    { error: 'invalid_type', message: 'Action type must be "email" or "questions".' },
    { status: 400 }
  );
}
