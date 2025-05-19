import { CiStreamOn } from "react-icons/ci";
import { usePrejoin, useRequirePublicKey } from "@vidbloq/react";
import { RiLink } from "react-icons/ri";
import { StreamLayout } from "./layout";
import Loading from "./ui/loader";

const Prejoin = () => {
  const { publicKey } = useRequirePublicKey();
  const { nickname, setNickname, joinStream, isLoading } = usePrejoin({
    publicKey,
  });
  return (
    <>
      <StreamLayout>
        <div className="w-full flex flex-col gap-4">
          <p className="text-3xl lg:!text-4xl font-poppins font-medium">
            Join Stream?
          </p>
          <p className="text-[#626262] font-inter">
            Enter a username for easy recognition during stream
          </p>

          <div className="flex flex-col lg:!flex-row gap-4 w-full lg:!w-2/4">
            <div className="flex flex-row w-full lg:!w-1/2">
              <div className="border-2 p-2 rounded-l-xl border-[#F5F5F5]">
                <RiLink className="text-2xl text-[#4300B1]" />
              </div>
              <div className="rounded-r-xl border-2 border-[#F5F5F5] p-2 flex-1 flex">
                <input
                  placeholder="Enter a username"
                  className="focus:outline-none w-full text-sm"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
            </div>

            <div
              className="flex flex-row w-full lg:!w-1/2 cursor-pointer"
              onClick={joinStream}
            >
              <div className="border-2 p-2 rounded-l-xl border-[#DCCCF6]">
                <CiStreamOn className="text-2xl text-[#4300B1]" />
              </div>
              <div className="bg-[#4300B1] p-2 rounded-r-xl border-2 border-[#4300B1] flex-1 flex lg:!flex-none items-center justify-center">
                <p className="text-white text-sm">Ask to join...</p>
              </div>
            </div>
          </div>
        </div>
      </StreamLayout>
      {isLoading && <Loading />}
    </>
  );
};

export default Prejoin;
