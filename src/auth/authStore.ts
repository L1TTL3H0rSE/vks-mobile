import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { authorize, refresh, revoke } from "react-native-app-auth";
import { create } from "zustand";
import { keycloakAuthConfig } from "./authConfig";

const SESSION_KEY = "vks.auth.session";

type StoredAuthSession = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpirationDate: string;
};

type DecodedToken = {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
};

export type AuthUser = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  roles: Set<string>;
};

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

type AuthState = StoredAuthSession & {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  restoreSession: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  getAccessToken: (minValiditySeconds?: number) => Promise<string | null>;
};

const emptySession: StoredAuthSession = {
  accessToken: "",
  refreshToken: null,
  idToken: null,
  accessTokenExpirationDate: "",
};

function createUser(accessToken: string): AuthUser {
  const decoded = jwtDecode<DecodedToken>(accessToken);
  const roles = new Set<string>();

  decoded.realm_access?.roles?.forEach((role) => roles.add(role));
  Object.values(decoded.resource_access ?? {}).forEach((resource) => {
    resource.roles?.forEach((role) => roles.add(role));
  });

  return {
    id: decoded.sub,
    name: decoded.name,
    username: decoded.preferred_username,
    email: decoded.email,
    roles,
  };
}

function isExpiredSoon(expirationDate: string, minValiditySeconds: number) {
  if (!expirationDate) return true;
  const expiresAt = new Date(expirationDate).getTime();
  return expiresAt - Date.now() <= minValiditySeconds * 1000;
}

async function saveSession(session: StoredAuthSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

async function readSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as StoredAuthSession;
}

async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptySession,
  status: "idle",
  user: null,
  error: null,

  async restoreSession() {
    set({ status: "loading", error: null });
    try {
      const stored = await readSession();
      if (!stored?.accessToken) {
        set({ ...emptySession, status: "anonymous", user: null });
        return;
      }

      set({
        ...stored,
        status: "authenticated",
        user: createUser(stored.accessToken),
      });

      await get().getAccessToken(30);
    } catch (error) {
      await clearSession();
      set({
        ...emptySession,
        status: "anonymous",
        user: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async login() {
    set({ status: "loading", error: null });
    try {
      const result = await authorize(keycloakAuthConfig);
      const session: StoredAuthSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      };

      await saveSession(session);
      set({
        ...session,
        status: "authenticated",
        user: createUser(session.accessToken),
      });
    } catch (error) {
      set({
        ...emptySession,
        status: "anonymous",
        user: null,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async logout() {
    const refreshToken = get().refreshToken;
    set({ status: "loading", error: null });

    try {
      if (refreshToken) {
        await revoke(keycloakAuthConfig, {
          tokenToRevoke: refreshToken,
          sendClientId: true,
        });
      }
    } catch {
      // Local logout must still clear tokens if remote revoke fails.
    } finally {
      await clearSession();
      set({ ...emptySession, status: "anonymous", user: null });
    }
  },

  async refreshSession() {
    const refreshToken = get().refreshToken;
    if (!refreshToken) return null;

    try {
      const result = await refresh(keycloakAuthConfig, { refreshToken });
      const session: StoredAuthSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? refreshToken,
        idToken: result.idToken ?? get().idToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      };

      await saveSession(session);
      set({
        ...session,
        status: "authenticated",
        user: createUser(session.accessToken),
        error: null,
      });
      return session.accessToken;
    } catch (error) {
      await clearSession();
      set({
        ...emptySession,
        status: "anonymous",
        user: null,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  async getAccessToken(minValiditySeconds = 5) {
    const { accessToken, accessTokenExpirationDate } = get();
    if (!accessToken) return null;
    if (!isExpiredSoon(accessTokenExpirationDate, minValiditySeconds)) {
      return accessToken;
    }
    return get().refreshSession();
  },
}));
