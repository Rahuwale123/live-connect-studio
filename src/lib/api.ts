export const BASE_API = 'http://localhost:8000';

export interface User { id: number; name: string; email: string; created_at: string; }
export interface Participant { id: number; name: string; }
export interface ChatMessage { id: number; user_id: number; name: string; message: string; timestamp: string; }
export interface JoinMeetingResponse { message: string; participants: Participant[]; host_id: number; }

export function getToken(): string | null { return localStorage.getItem('token'); }
export function setToken(t: string) { localStorage.setItem('token', t); }
export function setUser(u: User) { localStorage.setItem('user', JSON.stringify(u)); }
export function getUser(): User | null { try { return JSON.parse(localStorage.getItem('user')||'null'); } catch { return null; } }
export function clearAuth() { localStorage.removeItem('token'); localStorage.removeItem('user'); }

async function request<T>(path: string, opts: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(opts.headers);
  if (!headers.has('Content-Type') && opts.body && !(opts.body instanceof FormData)) headers.set('Content-Type','application/json');
  if (auth) {
    const t = getToken(); if (t) headers.set('Authorization', `Bearer ${t}`);
  }
  const res = await fetch(`${BASE_API}${path}`, { ...opts, headers });
  if (!res.ok) { const text = await res.text(); let msg = text; try { const j = JSON.parse(text); msg = (j as any).detail || (j as any).message || text; } catch {} throw new Error(msg || res.statusText); }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return (await res.text()) as any;
}

export async function signup(name: string, email: string, password: string) {
  await request<{ token: string }>(`/auth/signup`, { method: 'POST', body: JSON.stringify({ name, email, password }) }, false);
  clearAuth();
}

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: User }>(`/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }, false);
  setToken(data.token);
  setUser(data.user);
  return data.user;
}

export async function createMeeting(title?: string) {
  return request<{ meeting_id: string; join_url: string }>(`/meeting/create`, { method: 'POST', body: JSON.stringify({ title: title || null }) });
}

export async function joinMeeting(meeting_id: string) {
  return request<JoinMeetingResponse>(`/meeting/join`, { method: 'POST', body: JSON.stringify({ meeting_id }) });
}

export async function listParticipants(meeting_id: string) {
  return request<Participant[]>(`/meeting/${meeting_id}/participants`);
}

export async function getChat(meeting_id: string) {
  const res = await request<any>(`/meeting/${meeting_id}/chat`);
  return Array.isArray(res) ? (res as ChatMessage[]) : [];
}

export async function getTurn() { return request<{ iceServers: any[] }>(`/config/turn`); }

export async function endMeeting(meeting_id: string) {
  return request<{ message: string }>(`/meeting/end`, { method: 'POST', body: JSON.stringify({ meeting_id }) });
}

export async function getProfile() {
  return request<User>(`/user/profile`);
}

export function wsUrl(meeting_id: string): string {
  const t = getToken();
  return `${BASE_API.replace(/^http/, 'ws')}/ws/meetings/${encodeURIComponent(meeting_id)}?token=${encodeURIComponent(t||'')}`;
}
