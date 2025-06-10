
export interface AuthState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
  signUp: () => Promise<void>;
  isLoading: boolean;
}