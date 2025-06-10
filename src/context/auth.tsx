import { useUser } from "@civic/auth-web3/react";
import { createContext, useState } from "react";
import type { AuthState } from "../types";


export const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const userContext = useUser();
  const [signUpLoading, setSignUpLoading] = useState(false);

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


