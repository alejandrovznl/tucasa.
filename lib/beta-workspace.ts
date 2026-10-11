import { z } from 'zod';
import { type HistoryEntry, type SearchResult, type Workspace } from './tucasa';

export type BetaSession = { id: string; name: string; company: string };
const sessionSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(80), company: z.string().trim().min(1).max(80) });
const ACTIVE_KEY = 'tucasa.beta.session.v1';
const LAST_KEY = 'tucasa.beta.last-profile.v1';
const workspaceKey = (session: BetaSession) => `tucasa.beta.workspace.v1.${session.id}`;

export function readBetaSession(storage: Storage): BetaSession | null {
  try { return sessionSchema.parse(JSON.parse(storage.getItem(ACTIVE_KEY) || 'null')); } catch { return null; }
}
export function startBetaSession(storage: Storage, name: string, company?: string): BetaSession {
  let previous: BetaSession | null = null;
  try { previous = sessionSchema.parse(JSON.parse(storage.getItem(LAST_KEY) || 'null')); } catch { /* First visit. */ }
  const sameUser = previous?.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase();
  const selectedCompany = company === undefined ? (sameUser ? previous!.company : 'Mi inmobiliaria') : company.trim();
  const matching = sameUser && previous!.company.toLocaleLowerCase() === selectedCompany.toLocaleLowerCase();
  const session = sessionSchema.parse({ id: matching ? previous!.id : crypto.randomUUID(), name: name.trim(), company: selectedCompany });
  storage.setItem(ACTIVE_KEY, JSON.stringify(session)); storage.setItem(LAST_KEY, JSON.stringify(session));
  return session;
}
export function endBetaSession(storage: Storage) { storage.removeItem(ACTIVE_KEY); }
export function initialBetaWorkspace(session: BetaSession): Workspace {
  return { profile: { company: session.company, advisor: session.name, plan: 'prueba' }, favorites: [], history: [] };
}
export function readBetaWorkspace(storage: Storage, session: BetaSession): Workspace {
  const stored = storage.getItem(workspaceKey(session));
  if (!stored) return initialBetaWorkspace(session);
  try {
    const workspace = JSON.parse(stored) as Workspace;
    if (!workspace.profile || !Array.isArray(workspace.favorites) || !Array.isArray(workspace.history)) return initialBetaWorkspace(session);
    return { ...workspace, favorites: workspace.favorites.slice(0, 100), history: workspace.history.slice(0, 25) };
  } catch { return initialBetaWorkspace(session); }
}
export function writeBetaWorkspace(storage: Storage, session: BetaSession, workspace: Workspace) {
  storage.setItem(workspaceKey(session), JSON.stringify(workspace));
}
export function rememberBetaSearch(storage: Storage, session: BetaSession, result: SearchResult) {
  const workspace = readBetaWorkspace(storage, session);
  const entry: HistoryEntry = { id: result.id, filters: result.filters, count: result.properties.length, createdAt: result.createdAt };
  writeBetaWorkspace(storage, session, { ...workspace, history: [entry, ...workspace.history.filter(item => item.id !== entry.id)].slice(0, 25) });
}
