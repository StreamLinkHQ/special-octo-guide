import { useEffect, useState } from "react";
import { LuRadio } from "react-icons/lu";
import { RiLink } from "react-icons/ri";
import { TbVideo } from "react-icons/tb";
import {
  usePrejoin,
  useRequirePublicKey,
  useStreamContext,
} from "@vidbloq/react";
import { StreamLayout } from "./layout";
import { Loading } from "./ui";
import { getDisplayCredentials } from "../utils";

const Prejoin = () => {
  const { publicKey } = useRequirePublicKey();
   const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const { nickname, setNickname, joinStream, isLoading } = usePrejoin({
    publicKey,
    avatarUrl
  });
  const {
    streamMetadata: { creatorWallet, streamSessionType },
  } = useStreamContext();

  const [hasInitialized, setHasInitialized] = useState(false);

  // Auto-populate nickname ONLY on initial component mount
  useEffect(() => {
    // Only run this once when component first mounts and nickname is empty
    if (!hasInitialized && !nickname) {
      const displayCreds = getDisplayCredentials();
      setNickname(displayCreds.name);
      setHasInitialized(true);
      setAvatarUrl(displayCreds.avatar || undefined);
      
      console.log('Auto-populated nickname from profile:', displayCreds.name, {
        isUsingGoogleName: displayCreds.isUsingGoogleName,
        hasCustomPreferences: displayCreds.hasCustomPreferences
      });
    }
  }, [nickname, setNickname, hasInitialized, setAvatarUrl]);

  return (
    <>
      <StreamLayout>
        <div className="w-full flex flex-col gap-4">
          <p className="text-3xl lg:!text-4xl font-poppins font-medium capitalize">
            Join {streamSessionType}?
          </p>
          <p className="text-[#626262] font-inter">
            Enter a username for easy recognition during {streamSessionType}.
          </p>

          <div className="flex flex-col lg:!flex-row gap-4 w-full lg:!w-2/4 font-poppins">
            <div className="flex flex-row w-full lg:!w-1/2">
              <div className="p-[1px] border rounded-l-xl border-[#F5F5F5]">
                <div className="border-[1.5px] p-2 rounded-l-xl border-[#F5F5F5]">
                  <RiLink className="text-2xl text-[#4300B1]" />
                </div>
              </div>
              <div className="p-[2px] border rounded-r-xl border-[#F5F5F5] w-full bg-slate-00">
                <div className="rounded-r-xl border border-[#F5F5F5] p-2 flex-1 flex bg-red-00">
                  <input
                    placeholder="Enter a username"
                    className="focus:outline-none w-full text-sm"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div
              className="flex flex-row w-full lg:!w-1/2 cursor-pointer"
              onClick={joinStream}
            >
              <div className="p-[1px] border rounded-l-xl border-[#DCCCF6]">
                <div className="border-[1.5px] p-2 rounded-l-xl border-[#DCCCF6]">
                  {streamSessionType === "livestream" ? (
                    <LuRadio className="text-2xl text-[#4300B1]" />
                  ) : (
                    <TbVideo className="text-2xl text-[#4300B1]" />
                  )}
                </div>
              </div>

              <div className="p-[2px] border rounded-r-xl border-[#4300B1] w-full">
                <div className="bg-[#4300B1] p-2 rounded-r-xl border-[1.5px] border-[#4300B1] flex-1 flex lg:!flex-none items-center justify-center">
                  <p className="text-white text-sm">
                    {creatorWallet === publicKey?.toString()
                      ? "Join"
                      : "Ask to join..."}
                  </p>
                </div>
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