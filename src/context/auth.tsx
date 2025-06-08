import { useUser } from "@civic/auth-web3/react";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
  signUp: () => Promise<void>;
  isLoading: boolean;
  //   isAuthenticated: boolean;
  //   signIn: () => Promise<void>;
  //   signOut: () => Promise<void>;
  //   error: string | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const userContext = useUser();
  const [user, setUser] = useState(userContext.user);
  const [isLoading, setIsLoading] = useState(false);

  const signUp = async () => {
    try {
      setIsLoading(true);
      await userContext.signIn();
      // After successful sign in, the useEffect above will handle the redirect
    } catch (error) {
      console.error("Sign in failed:", error);
      // Handle sign in error here if needed
    }
  };
  useEffect(() => {
    if (userContext.user) {
             console.log("User is authenticated:", userContext.user, "authcontext");
     setIsLoading(false);
      setUser(userContext.user);

    }
  }, [userContext.user]);


  const contextValue: AuthState = {
    user,
    signUp,
    isLoading: isLoading ,
    // isAuthenticated: !!userContext.user && !userContext.isLoading && isInitialized,
    // signIn,
    // signOut, ?? isLoading
    // error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      { children }
    </AuthContext.Provider>
  );
};

export default AuthProvider;


export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};