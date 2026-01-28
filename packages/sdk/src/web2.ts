/**
 * Villa Web2 API - Maximum Abstraction
 *
 * Complete abstraction from blockchain complexity.
 * Provides familiar web service patterns with zero crypto terminology.
 * Perfect for developers who want authentication without blockchain knowledge.
 *
 * @example
 * ```typescript
 * import { auth } from '@rockfridrich/villa-sdk/web2'
 *
 * // Like any modern web service
 * const user = await auth.signIn()
 * console.log(`Hello, ${user.name}!`)
 *
 * // Update user profile
 * await auth.updateProfile({ bio: "Building cool stuff" })
 *
 * // Listen to auth changes
 * auth.onStateChange((user) => {
 *   if (user) {
 *     showDashboard(user)
 *   } else {
 *     showLogin()
 *   }
 * })
 * ```
 */

import {
  villa,
  type VillaUser,
  type ProfileUpdateData,
  type SimpleProfile,
} from "./simple";
import type { VillaConfig } from "./types";

export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  bio?: string;
  joinedAt?: string;
}

export interface UserProfile extends User {
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface AuthState {
  isSignedIn: boolean;
  user: User | null;
  isLoading: boolean;
}

export interface AuthConfig {
  appId?: string;
  environment?: "production" | "staging";
  debug?: boolean;
}

function villaUserToUser(villaUser: VillaUser): User {
  return {
    id: villaUser.address,
    name: villaUser.nickname,
    avatar: villaUser.avatar,
    joinedAt: villaUser.createdAt,
  };
}

function simpleProfileToUser(profile: SimpleProfile): User {
  return {
    id: profile.address,
    name: profile.nickname,
    avatar: profile.avatar,
    bio: profile.bio,
    joinedAt: profile.createdAt,
  };
}

class VillaAuth {
  private listeners: Set<(user: User | null) => void> = new Set();
  private stateListeners: Set<(state: AuthState) => void> = new Set();
  private currentState: AuthState = {
    isSignedIn: false,
    user: null,
    isLoading: false,
  };

  constructor() {
    villa.onAuthChange((villaUser) => {
      const user = villaUser ? villaUserToUser(villaUser) : null;
      this.currentState = {
        isSignedIn: !!user,
        user,
        isLoading: false,
      };

      this.listeners.forEach((callback) => {
        try {
          callback(user);
        } catch (error) {
          console.warn("Auth callback error:", error);
        }
      });

      this.stateListeners.forEach((callback) => {
        try {
          callback(this.currentState);
        } catch (error) {
          console.warn("Auth state callback error:", error);
        }
      });
    });
  }

  configure(config: AuthConfig): void {
    const villaConfig: Partial<VillaConfig> = {};

    if (config.appId) {
      villaConfig.appId = config.appId;
    }

    if (config.environment) {
      villaConfig.target =
        config.environment === "production" ? "production" : "beta";
    }

    if (config.debug !== undefined) {
      villaConfig.debug = config.debug;
    }

    villa.config(villaConfig);
  }

  get isSignedIn(): boolean {
    return this.currentState.isSignedIn;
  }

  get currentUser(): User | null {
    return this.currentState.user;
  }

  get state(): AuthState {
    return { ...this.currentState };
  }

  async signIn(): Promise<User> {
    this.currentState.isLoading = true;
    this.notifyStateChange();

    try {
      const villaUser = await villa.signIn();
      const user = villaUserToUser(villaUser);

      this.currentState = {
        isSignedIn: true,
        user,
        isLoading: false,
      };
      this.notifyStateChange();

      return user;
    } catch (error) {
      this.currentState.isLoading = false;
      this.notifyStateChange();
      throw new Error(
        error instanceof Error ? error.message : "Sign in failed",
      );
    }
  }

  signOut(): void {
    villa.signOut();
  }

  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    try {
      const profile = await villa.getProfile(userId);
      if (!profile) return null;

      return {
        ...simpleProfileToUser(profile),
        preferences: {},
        settings: {},
      };
    } catch (error) {
      console.warn("Failed to get user profile:", error);
      return null;
    }
  }

  async updateProfile(updates: {
    name?: string;
    bio?: string;
    avatar?: any;
  }): Promise<User> {
    if (!this.currentUser) {
      throw new Error("Must be signed in to update profile");
    }

    try {
      const profileUpdates: ProfileUpdateData = {};

      if (updates.name) {
        profileUpdates.nickname = updates.name;
      }

      if (updates.bio) {
        profileUpdates.bio = updates.bio;
      }

      if (updates.avatar) {
        profileUpdates.avatar = updates.avatar;
      }

      const updatedProfile = await villa.updateProfile(profileUpdates);
      const user = simpleProfileToUser(updatedProfile);

      this.currentState.user = user;
      this.notifyStateChange();

      return user;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    try {
      return await villa.uploadAvatar(file);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload avatar",
      );
    }
  }

  onAuthChange(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => this.listeners.delete(callback);
  }

  onStateChange(callback: (state: AuthState) => void): () => void {
    this.stateListeners.add(callback);
    callback(this.state);
    return () => this.stateListeners.delete(callback);
  }

  private notifyStateChange(): void {
    this.stateListeners.forEach((callback) => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.warn("Auth state callback error:", error);
      }
    });
  }
}

export const auth = new VillaAuth();

export function createAuth(config?: AuthConfig): VillaAuth {
  const authInstance = new VillaAuth();
  if (config) {
    authInstance.configure(config);
  }
  return authInstance;
}

export async function signIn(): Promise<User> {
  return auth.signIn();
}

export function signOut(): void {
  auth.signOut();
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function isSignedIn(): boolean {
  return auth.isSignedIn;
}

export async function updateUserProfile(updates: {
  name?: string;
  bio?: string;
}): Promise<User> {
  return auth.updateProfile(updates);
}

export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  return auth.onAuthChange(callback);
}
