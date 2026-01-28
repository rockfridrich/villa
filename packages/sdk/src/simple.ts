/**
 * Villa SDK - Simplified API
 *
 * Zero-config, one-liner authentication for Villa ID.
 *
 * @example
 * ```typescript
 * import { villa } from '@rockfridrich/villa-sdk'
 *
 * // One-liner sign in
 * const user = await villa.signIn()
 * console.log(user.address, user.nickname)
 *
 * // Check auth state
 * if (villa.user) {
 *   console.log('Logged in as', villa.user.nickname)
 * }
 *
 * // Sign out
 * villa.signOut()
 * ```
 */

import type {
  Identity,
  VillaConfig,
  VillaSession,
  AvatarConfig,
  AvatarStyle,
} from "./types";
import { VillaBridge } from "./iframe/bridge";
import { createVillaConfigFromManifest } from "./config/runtime";
import {
  saveSession,
  loadSession,
  clearSession,
  isSessionValid,
} from "./session";
import {
  signInToTinyCloud,
  saveProfile as saveTinyCloudProfile,
  getProfile as getTinyCloudProfile,
  isTinyCloudSignedIn,
  type VillaProfile as TinyCloudProfile,
} from "./tinycloud";

export interface VillaUser {
  address: `0x${string}`;
  nickname: string;
  avatar: string;
  createdAt?: string;
  raw: Identity;
}

export interface SettingsResult {
  avatar?: { style: string; seed: string };
  nickname?: string;
  loggedOut?: boolean;
}

export interface SimpleSignInOptions {
  silent?: boolean;
  timeout?: number;
}

export interface SimpleProfile {
  nickname: string;
  avatar: string;
  address: `0x${string}`;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileUpdateData {
  nickname?: string;
  bio?: string;
  avatar?: { style: AvatarStyle; seed: string };
}

export interface VillaInternalAPI {
  getWallet: () => any;
  getAddress: () => `0x${string}` | null;
  getPrivateKey: () => string | null;
  getSession: () => any;
  getClient: () => any;
  getRawIdentity: () => Identity | null;
}

interface VillaInstance {
  user: VillaUser | null;
  signIn: (options?: SimpleSignInOptions) => Promise<VillaUser>;
  signOut: () => void;
  settings: () => Promise<SettingsResult>;
  getProfile: (address?: string) => Promise<SimpleProfile | null>;
  updateProfile: (updates: ProfileUpdateData) => Promise<SimpleProfile>;
  uploadAvatar: (file: File) => Promise<string>;
  onAuthChange: (callback: (user: VillaUser | null) => void) => () => void;
  config: (options: Partial<VillaConfig>) => void;
  internal: VillaInternalAPI;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const API_URL = "https://villa.cash";

let _config: VillaConfig = {
  network: "base-sepolia",
};

let _user: VillaUser | null = null;
let _listeners: Set<(user: VillaUser | null) => void> = new Set();
let _initialized = false;
let _currentSession: VillaSession | null = null;

function identityToUser(identity: Identity): VillaUser {
  const avatarUrl = identity.avatar
    ? `https://api.dicebear.com/7.x/${identity.avatar.style}/svg?seed=${identity.avatar.seed}`
    : `https://api.dicebear.com/7.x/lorelei/svg?seed=${identity.address}`;

  return {
    address: identity.address,
    nickname: identity.nickname || identity.address.slice(0, 8),
    avatar: avatarUrl,
    raw: identity,
  };
}

function notifyListeners() {
  _listeners.forEach((cb) => {
    try {
      cb(_user);
    } catch {}
  });
}

function init() {
  if (_initialized) return;
  _initialized = true;

  const session = loadSession();
  if (session && isSessionValid(session)) {
    _user = identityToUser(session.identity);
  }
}

function configure(options: Partial<VillaConfig>) {
  _config = { ..._config, ...options };
}

async function getResolvedConfig(): Promise<VillaConfig> {
  try {
    return await createVillaConfigFromManifest(_config);
  } catch {
    return _config;
  }
}

async function signIn(options?: SimpleSignInOptions): Promise<VillaUser> {
  init();

  if (_user && options?.silent) {
    return _user;
  }

  return new Promise(async (resolve, reject) => {
    try {
      const resolvedConfig = await getResolvedConfig();
      const bridge = new VillaBridge({
        appId: resolvedConfig.appId,
        network: resolvedConfig.network,
        timeout: options?.timeout || 5 * 60 * 1000,
      });

      bridge.on("success", (identity) => {
        const user = identityToUser(identity);
        _user = user;

        saveSession({
          identity,
          expiresAt: Date.now() + SESSION_DURATION_MS,
          isValid: true,
        });

        notifyListeners();
        resolve(user);
      });

      bridge.on("cancel", () => {
        reject(new Error("User cancelled authentication"));
      });

      bridge.on("error", (error) => {
        reject(new Error(error));
      });

      bridge.open(["profile"]).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

function signOut() {
  _user = null;
  clearSession();
  notifyListeners();
}

async function openSettings(): Promise<SettingsResult> {
  init();

  if (!_user) {
    throw new Error("Must be signed in to open settings");
  }

  return new Promise(async (resolve, reject) => {
    try {
      const resolvedConfig = await getResolvedConfig();
      const bridge = new VillaBridge({
        appId: resolvedConfig.appId,
        network: resolvedConfig.network,
        timeout: 10 * 60 * 1000,
      });

      bridge.on("success", (identity) => {
        const user = identityToUser(identity);
        _user = user;

        saveSession({
          identity,
          expiresAt: Date.now() + SESSION_DURATION_MS,
          isValid: true,
        });

        notifyListeners();
        resolve({
          avatar: identity.avatar,
          nickname: identity.nickname,
        });
      });

      bridge.on("cancel", () => {
        resolve({});
      });

      bridge.on("error", (error, code) => {
        if (code === "LOGOUT") {
          signOut();
          resolve({ loggedOut: true });
        } else {
          reject(new Error(error));
        }
      });

      bridge.open(["settings"], { address: _user!.address }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

function onAuthChange(callback: (user: VillaUser | null) => void): () => void {
  init();
  _listeners.add(callback);
  callback(_user);
  return () => _listeners.delete(callback);
}

function getUser(): VillaUser | null {
  init();
  return _user;
}

async function getProfile(address?: string): Promise<SimpleProfile | null> {
  init();

  const targetAddress = address || _user?.address;
  if (!targetAddress) {
    return null;
  }

  try {
    const response = await fetch(
      `${_config.apiUrl || API_URL}/api/profile/${targetAddress.toLowerCase()}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const avatarUrl = data.avatar
      ? `https://api.dicebear.com/7.x/${data.avatar.style}/svg?seed=${data.avatar.selection || data.avatar.seed}`
      : `https://api.dicebear.com/7.x/lorelei/svg?seed=${targetAddress}`;

    return {
      nickname: data.nickname || targetAddress.slice(0, 8),
      avatar: avatarUrl,
      address: targetAddress as `0x${string}`,
    };
  } catch {
    return null;
  }
}

async function uploadAvatar(file: File): Promise<string> {
  init();

  if (!_user) {
    throw new Error("Must be signed in to upload avatar");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("address", _user.address);

  const response = await fetch(`${_config.apiUrl || API_URL}/api/profile`, {
    method: "PATCH",
    body: JSON.stringify({
      address: _user.address,
      avatar: {
        style: "custom",
        selection: file.name,
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to upload avatar");
  }

  const data = await response.json();
  const avatarUrl = data.avatar
    ? `https://api.dicebear.com/7.x/${data.avatar.style}/svg?seed=${data.avatar.selection || data.avatar.seed}`
    : `https://api.dicebear.com/7.x/lorelei/svg?seed=${_user.address}`;

  _user = { ..._user, avatar: avatarUrl };
  notifyListeners();

  return avatarUrl;
}

async function updateProfile(data: ProfileUpdateData): Promise<SimpleProfile> {
  init();

  if (!_user) {
    throw new Error("Must be signed in to update profile");
  }

  const updatePayload: any = { address: _user.address };

  if (data.nickname) {
    updatePayload.nickname = data.nickname;
  }

  if (data.bio) {
    updatePayload.bio = data.bio;
  }

  if (data.avatar) {
    updatePayload.avatar = data.avatar;
  }

  const response = await fetch(`${_config.apiUrl || API_URL}/api/profile`, {
    method: "PATCH",
    body: JSON.stringify(updatePayload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  const responseData = await response.json();

  if (data.nickname || data.avatar) {
    const avatarUrl = responseData.avatar
      ? `https://api.dicebear.com/7.x/${responseData.avatar.style}/svg?seed=${responseData.avatar.selection || responseData.avatar.seed}`
      : _user.avatar;

    _user = {
      ..._user,
      nickname: data.nickname || _user.nickname,
      avatar: avatarUrl,
    };

    if (_currentSession) {
      _currentSession.identity = {
        ..._currentSession.identity,
        nickname: _user.nickname,
        avatar: data.avatar || _currentSession.identity.avatar,
      };
      saveSession(_currentSession);
    }

    notifyListeners();
  }

  return {
    nickname: responseData.nickname || _user.nickname,
    avatar: responseData.avatar
      ? `https://api.dicebear.com/7.x/${responseData.avatar.style}/svg?seed=${responseData.avatar.selection || responseData.avatar.seed}`
      : _user.avatar,
    address: _user.address,
    bio: responseData.bio,
    createdAt: responseData.createdAt,
    updatedAt: responseData.updatedAt,
  };
}

const createInternalAPI = (): VillaInternalAPI => ({
  getWallet: () => {
    init();
    return null;
  },
  getAddress: () => {
    init();
    return _user?.address || null;
  },
  getPrivateKey: () => {
    init();
    return null;
  },
  getSession: () => {
    init();
    return _currentSession;
  },
  getClient: () => {
    init();
    return null;
  },
  getRawIdentity: () => {
    init();
    return _currentSession ? (_currentSession as any).identity : null;
  },
});

export const villa: VillaInstance = {
  get user() {
    return getUser();
  },
  signIn,
  signOut,
  settings: openSettings,
  getProfile,
  updateProfile,
  uploadAvatar,
  onAuthChange,
  config: configure,
  internal: createInternalAPI(),
};

export async function signInWithVilla(
  options?: SimpleSignInOptions,
): Promise<VillaUser> {
  return villa.signIn(options);
}

export function getVillaUser(): VillaUser | null {
  return villa.user;
}

export function signOutVilla(): void {
  villa.signOut();
}

export async function syncProfileToTinyCloud(user: VillaUser): Promise<void> {
  if (!isTinyCloudSignedIn()) {
    await signInToTinyCloud();
  }

  const profile: TinyCloudProfile = {
    nickname: user.nickname,
    avatar: {
      style: user.raw.avatar?.style || "lorelei",
      seed: user.raw.avatar?.seed || user.address,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = await getTinyCloudProfile();
  if (existing) {
    profile.createdAt = existing.createdAt;
  }

  await saveTinyCloudProfile(profile);
}

export async function loadProfileFromTinyCloud(): Promise<TinyCloudProfile | null> {
  if (!isTinyCloudSignedIn()) {
    await signInToTinyCloud();
  }

  return getTinyCloudProfile();
}
