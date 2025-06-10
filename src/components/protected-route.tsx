import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@civic/auth-web3/react";
import { Loading } from "../components";

type ProtectedRouteProps = {
  children: React.ReactNode;
}

const REDIRECT_KEY = 'streamlink_redirect_path';

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useUser();
  const location = useLocation();
  
  // ALWAYS show loading while Civic is checking authentication
  // This prevents any premature redirects
  if (isLoading) {
    return <Loading />;
  }
  
  // Only after loading is complete, check authentication
  if (!user) {
    // Save the intended destination
    sessionStorage.setItem(REDIRECT_KEY, location.pathname);
    console.log("User not authenticated, saving path:", location.pathname);
    
    // Redirect to login
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // User is authenticated
  console.log("User is authenticated:", user);
  return <>{children}</>;
};

export default ProtectedRoute;