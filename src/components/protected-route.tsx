// import { useUser } from "@civic/auth-web3/react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Loading } from "../components";

type ProtectedRouteProps = {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading while checking authentication
  if (isLoading) {
    return <Loading />;
  }
  
  // Redirect to login if not authenticated, passing current location
  if (!user) {
    console.log("User is not authenticated:", "protected-route");
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  console.log("User is authenticated:", "protected-route2");
  // User is authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;