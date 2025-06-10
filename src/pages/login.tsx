import { useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@civic/auth-web3/react";
import { AuthLayout, Loading } from "../components";
import { useAuth } from "../hooks";

const REDIRECT_KEY = 'streamlink_redirect_path';

const Login = () => {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;
    
    // Don't redirect if we've already done it (prevents loops)
    if (hasRedirected.current) return;
    
    // If user is authenticated
    if (user) {
      hasRedirected.current = true;
      console.log("User authenticated on login page");
      
      // First priority: session storage redirect
      const savedPath = sessionStorage.getItem(REDIRECT_KEY);
      if (savedPath) {
        console.log("Redirecting to saved path:", savedPath);
        sessionStorage.removeItem(REDIRECT_KEY);
        navigate(savedPath, { replace: true });
        return;
      }
      
      // Second priority: location state (from Navigate component)
      const from = location.state?.from?.pathname;
      if (from) {
        console.log("Redirecting to location state:", from);
        navigate(from, { replace: true });
        return;
      }
      
      // Default: go to /create
      console.log("No saved redirect, going to /create");
      navigate("/create", { replace: true });
    }
  }, [isLoading, user, navigate, location.state]);

  // Show loading while Civic is initializing
  if (isLoading) {
    return <Loading />;
  }

  return (
    <AuthLayout>
      <div className="w-full flex flex-col gap-y-3">
        <p className="w-full lg:w-9/12 text-[#3A3A3A] text-2xl lg:text-5xl font-poppins">
          Stream Calls and meetings for everyone.
        </p>
        <p className="text-[#626262] font-inter">
          Connect, collaborate, and celebrate from anywhere with StreamLink.
        </p>

        <div className="flex flex-row items-stretch cursor-pointer" onClick={signUp}>
          <div className="border border-[#DCCCF6] p-[2px] rounded-l-xl">
            <div className="border border-[#DCCCF6] p-4 rounded-l-xl">
              <FcGoogle className="text-xl" />
            </div>
          </div>

          <div className="border border-[#4300B1] p-[2px] rounded-r-xl flex justify-center items-center">
            <div className="bg-[#4300B1] p-4 rounded-r-xl">
              <p className="text-white text-sm">Sign Up with Google</p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;