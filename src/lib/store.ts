// In-memory Session Store for Clause Radar with 30-minute TTL
import { Session } from './types';

const TTL_MS = 30 * 60 * 1000; // 30 minutes

const globalForSessions = globalThis as unknown as {
  clauseRadarSessions?: Map<string, Session>;
};

const sessions = globalForSessions.clauseRadarSessions ?? new Map<string, Session>();
if (process.env.NODE_ENV !== 'production') {
  globalForSessions.clauseRadarSessions = sessions;
}

export function sweep(): void {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function createSession(data: Omit<Session, 'id' | 'createdAt'>): string {
  sweep();
  const id = crypto.randomUUID();
  const session: Session = {
    ...data,
    id,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return id;
}

export function getSession(id: string): Session | null {
  sweep();
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.createdAt > TTL_MS) {
    sessions.delete(id);
    return null;
  }
  return s;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function clearAllSessions(): void {
  sessions.clear();
}
