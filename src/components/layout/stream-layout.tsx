import { useWallet, CivicAuthIframeContainer, useUser } from "@civic/auth-web3/react";
import wave from "../../assets/wave.png";
import mobileWave from "../../assets/mobile-wave.png";
import { CustomWalletProvider } from "../custom-wallet-provider";


type StreamLayoutProps = {
  children: React.ReactElement;
};

const StreamLayout = ({ children }: StreamLayoutProps) => {
  const { user } = useUser();
  const userWallet = useWallet({ type: "solana" });
  console.log({userWallet})

  if(!user) {
    return <CivicAuthIframeContainer />
  }

  return (
    <CustomWalletProvider userWallet={userWallet}>
      <div className="hidden lg:flex overflow-y-hidden p-2 h-screen justify-between">
        <div className="relative w-3/6 mx-auto h-full flex flex-col">
          <p className="text-[#36008D] text-4xl font-bold my-3 font-poppins">
            StreamLink
          </p>
          <div className="w-full flex h-full justify-center items-center">
            {children}
          </div>

          <p className="text-[#6E2ADB] text-sm absolute bottom-3 left-0">
            Learn more <span className="text-black">about Streamlink</span>
          </p>
        </div>
        <div className="hidden lg:flex h-[98%] my-auto w-1/3 relative bg-[#DCCCF629] rounded-3xl">
          <img
            src={wave}
            alt="Wave Background"
            className="hidden md:block lg:flex h-full object-cover w-full rounded-3xl"
          />
          <p className="text-[#8B55E2] text-4xl absolute bottom-5 right-5">
            Welcome!
          </p>
        </div>
      </div>
      <div className="block lg:hidden h-screen relative">
        <div className="block lg:hidden bg-[#DCCCF629] relative">
          <img
            src={mobileWave}
            alt="Wave Background"
            className="block lg:hidden h-full object-cover w-full"
          />
          <p className="text-[#36008D] text-4xl font-bold absolute top-3 left-4 font-poppins">
            StreamLink
          </p>
        </div>
        <div className="p-4">{children}</div>
        <p className="text-[#6E2ADB] text-sm absolute bottom-3 left-4">
          Learn more <span className="text-black">about Streamlink</span>
        </p>
      </div>
    </CustomWalletProvider>
  );
};

export default StreamLayout;
