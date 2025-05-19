import { FcGoogle } from "react-icons/fc";
import wave from "../../assets/auth-wave.png";
import mobileWave from "../../assets/mobile-auth-wave.png";

type AuthLayoutProps = {
  children: React.ReactElement;
};
const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <>
      <div className="hidden lg:flex overflow-y-hidden p-2 lg:p-3.5 h-screen justify-between">
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
        <div className="hidden lg:flex h-[98%] my-auto w-[38%] relative bg-[#10002A] rounded-3xl">
          <img
            src={wave}
            alt="Wave Background"
            className="hidden md:block lg:flex object-contain w-full rounded-3xl"
          />
          <div className="absolute bottom-20">
            <div className="w-[80%] mx-auto">
              <div className="bg-white rounded-full flex flex-col items-center p-2 h-[50px] w-[50px] mb-4">
                <FcGoogle className="text-3xl" />
              </div>
              <p className="font-poppins text-[32px] text-[#CACACA] font-light">
                Seamlessly connect your account, in one click.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="block lg:hidden h-screen relative">
        <div className="block lg:hidden bg-[#10002A] relative rounded-b-3xl h-[55%]">
          <img
            src={mobileWave}
            alt="Wave Background"
            className="block lg:hidden h-full object-cover w-full"
          />
          <p className="text-[#DCCCF6] text-4xl font-bold absolute top-3 left-4 font-poppins">
            StreamLink
          </p>
          <div className="absolute bottom-8 left-3">
            <div className="bg-white rounded-full flex flex-col items-center p-2 h-[35px] w-[35px] mb-4">
              <FcGoogle className="text-3xl" />
            </div>
            <p className="font-poppins text-[23px] text-[#CACACA] font-light">
              Seamlessly connect your account, in one click.
            </p>
          </div>
        </div>
        <div className="p-4">{children}</div>
        <p className="text-[#6E2ADB] text-sm absolute bottom-3 left-4">
          Learn more <span className="text-black">about Streamlink</span>
        </p>
      </div>
    </>
  );
};

export default AuthLayout;
