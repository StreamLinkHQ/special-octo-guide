export interface AuthState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
  signUp: () => Promise<void>;
  isLoading: boolean;
}

export interface GoogleCredentials {
  name: string;
  picture: string;
  email?: string;
  savedAt: string; // Always include timestamp for consistency
}

export interface UserPreferences {
  selectedAvatar: number;
  useGoogleAvatar: boolean;
  username: string;
  useGoogleName: boolean;
  theme: string;
  status: string;
  lastUpdated: string;
}

export interface DisplayCredentials {
  name: string;
  avatar: string | null;
  isUsingGoogleName: boolean;
  isUsingGoogleAvatar: boolean;
  hasCustomPreferences: boolean;
}

// Storage keys - centralize these too for consistency
export const STORAGE_KEYS = {
  GOOGLE_CREDENTIALS: 'streamlink_google_credentials',
  USER_PREFERENCES: 'streamlink-preferences',
  REDIRECT_PATH: 'streamlink_redirect_path'
} as const;