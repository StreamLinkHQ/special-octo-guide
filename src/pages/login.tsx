import { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@civic/auth-web3/react";
import { AuthLayout, Loading } from "../components";
import { useAuth } from "../context/auth";

const Login = () => {
  const userContext = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();

  useEffect(() => {
    if (userContext.user) {
      console.log("User is authenticated:", userContext.user, "loginpage");
      // Get the page they were trying to access, or default to /create || '/create'
      const from = location.state?.from?.pathname || "/create";
      navigate(from, { replace: true });
    }
  }, [userContext.user, navigate, location.state]);

  if (userContext.isLoading) {
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

        <div className="flex flex-row items-stretch" onClick={signUp}>
          <div className="border border-[#DCCCF6] p-[2px] rounded-l-xl">
            <div className="border border-[#DCCCF6] p-4 rounded-l-xl">
              <FcGoogle className="text-xl" />
            </div>
          </div>

          <div className="border cursor-pointer border-[#4300B1] p-[2px] rounded-r-xl flex justify-center items-center">
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

