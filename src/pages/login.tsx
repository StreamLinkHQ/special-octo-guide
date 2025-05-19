import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { useWallet, useUser } from "@civic/auth-web3/react";
import { AuthLayout } from "../components";

const Login = () => {
  const test = useWallet({ type: "solana" });
  console.log({ test });
  const userContext = useUser();

  const navigate = useNavigate();
  const signUp = async () => {
    await userContext.signIn();
    navigate("/create");
  };

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
              {/* {user ? (
                <p className="text-white text-sm">{user?.name}</p>
              ) : ( */}
              <p className="text-white text-sm">Sign Up with Google</p>
              {/* )} */}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;

//   useEffect(() => {
//     if (userContext.user) {
//      ;
//       (async()=>{
//             if (userContext.user && !userHasWallet(userContext)) {
//          await userContext.createWallet();
//             }
//  console.log(userContext.user)
//       })()

//     }
//   }, [userContext.user]);

// import { signIn } from "@civic/auth/react";
// import { useWallet } from "@civic/auth-web3/react";
// import { userHasWallet } from "@civic/auth-web3";
// import { useEffect } from "react";
// useWallet({ type: "solana" })
