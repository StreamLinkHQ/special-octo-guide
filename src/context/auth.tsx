import { createContext, useState, useEffect } from "react";
import { useUser } from "@civic/auth-web3/react";
import type { AuthState } from "../types";
import { saveGoogleCredentials } from "../utils";

export const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const userContext = useUser();
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Store Google credentials when user data becomes available
  useEffect(() => {
    if (userContext.user && userContext.user.name && userContext.user.picture) {
      saveGoogleCredentials({
        name: userContext.user.name,
        picture: userContext.user.picture,
        email: userContext.user.email
      });
    }
  }, [userContext.user]);

  const signUp = async () => {
    try {
      setSignUpLoading(true);
      await userContext.signIn();
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setSignUpLoading(false);
    }
  };

  const contextValue: AuthState = {
    user: userContext.user,
    signUp,
    isLoading: signUpLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};