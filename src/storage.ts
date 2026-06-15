// localStorage persistence helpers for FlowMind

const USER_DATA_PREFIX = 'flowmind_user_';
const USERS_KEY = 'flowmind_registered_users';

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
}

export interface UserData {
  tasks: unknown;
  sessions: unknown;
  notes: unknown;
  messages: unknown;
  calendarSlots: unknown;
  notifications: unknown;
}

// ─── Registered users (shared across all sessions) ──────────────────────────

export function saveRegisteredUsers(users: RegisteredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save registered users:', e);
  }
}

export function loadRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser[]) : [];
  } catch (e) {
    console.warn('Failed to load registered users:', e);
    return [];
  }
}

// ─── Per-user data ──────────────────────────────────────────────────────────

export function saveUserData(email: string, data: UserData): void {
  try {
    localStorage.setItem(USER_DATA_PREFIX + email, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save user data:', e);
  }
}

export function loadUserData(email: string): UserData | null {
  try {
    const raw = localStorage.getItem(USER_DATA_PREFIX + email);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch (e) {
    console.warn('Failed to load user data:', e);
    return null;
  }
}

export function clearUserData(email: string): void {
  try {
    localStorage.removeItem(USER_DATA_PREFIX + email);
  } catch (e) {
    console.warn('Failed to clear user data:', e);
  }
}

// Remember the last logged-in user so we can auto-restore session on refresh
const LAST_USER_KEY = 'flowmind_last_user';

export function saveLastUser(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(LAST_USER_KEY, email);
    } else {
      localStorage.removeItem(LAST_USER_KEY);
    }
  } catch (e) {
    // ignore
  }
}

export function loadLastUser(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch (e) {
    return null;
  }
}
