import { useSyncExternalStore } from "react";
import {
  getStoredOrganization,
  getStoredUser,
  hasStoredSession,
  setStoredOrganization,
  setStoredUser,
} from "./session";
import type { AuthOrganization, AuthUser } from "./types";

interface AuthState {
  user: AuthUser | null;
  organization: AuthOrganization | null;
}

function getInitialUser(): AuthUser | null {
  if (!hasStoredSession()) return null;
  return getStoredUser();
}

let state: AuthState = {
  user: getInitialUser(),
  organization: hasStoredSession() ? getStoredOrganization() : null,
};

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

function set(partial: Partial<AuthState>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const auth = {
  setSession: (user: AuthUser | null, organization: AuthOrganization | null) => {
    setStoredUser(user);
    setStoredOrganization(organization);
    set({ user, organization });
  },
  setUser: (user: AuthUser | null) => {
    setStoredUser(user);
    set({ user });
  },
  setOrganization: (organization: AuthOrganization | null) => {
    setStoredOrganization(organization);
    set({ organization });
  },
  clearUser: () => {
    setStoredUser(null);
    setStoredOrganization(null);
    set({ user: null, organization: null });
  },
  getUser: () => state.user,
  getOrganization: () => state.organization,
};
