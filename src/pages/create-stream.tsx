import { useState } from "react";
import { useCreateStream, useRequirePublicKey } from "@vidbloq/react";
import { useNavigate } from "react-router-dom";
import { RiLink } from "react-icons/ri";
import { LuRadio, LuCircleFadingPlus } from "react-icons/lu";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { TbCalendarPlus, TbVideo } from "react-icons/tb";
import { StreamLayout, Loading, ShareModal } from "../components";

type Option = "livestream" | "meeting";

enum StreamSessionType {
  Livestream = "Livestream",
  Meeting = "Meeting",
  // Podcast = "Podcast",
}

const CreateStream = () => {
  const [selectedOption, setSelectedOption] = useState<Option>("meeting");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };
  const { publicKey } = useRequirePublicKey();

  const { createStream, stream, isLoading } = useCreateStream();

  const createNewStream = async (
    type: StreamSessionType,
    isInstant: boolean = true
  ) => {
    const newStream = await createStream({
      streamSessionType: type,
      wallet: publicKey?.toString() ?? "",
    });
    if (isInstant && newStream) {
      navigate(`/${newStream.name}`);
    } else {
      setShowModal(true);
    }
  };

  const selectTab = (option: Option) => {
    setSelectedOption(option);
    setActiveDropdown(null);
  };
  return (
    <>
      <StreamLayout>
        <div className="w-full">
          <p>Hello </p>
          <h2 className="text-gray-800 text-3xl lg:!text-4xl font-medium mb-3 font-poppins">
            Creating a Livestream or Meeting?
          </h2>

          <div className="flex items-center mb-6 font-inter">
            <span className="mr-2">Select,</span>
            <button
              onClick={() => selectTab("meeting")}
              className={`text-[#6E2ADB] font-medium mr-2 ${
                selectedOption === "meeting"
                  ? "border-b-2 border-[#6E2ADB]"
                  : "opacity-60 hover:opacity-100 transition-opacity"
              }`}
            >
              Meeting
            </button>

            <span className="text-gray-500 mr-2">or</span>
            <button
              onClick={() => selectTab("livestream")}
              className={`text-[#6E2ADB] font-medium ${
                selectedOption === "livestream"
                  ? "border-b-2 border-[#6E2ADB]"
                  : "opacity-60 hover:opacity-100 transition-opacity"
              }`}
            >
              Livestream
            </button>
            <span className="ml-2">to start.</span>
          </div>
          <div
            className={`space-y-4 w-full lg:!w-3/5 ${
              selectedOption !== "livestream" ? "hidden" : ""
            }`}
          >
            <div className="relative font-poppins">
              <div className="flex flex-col gap-y-3 lg:!gap-x-2 lg:!gap-y-0 lg:!flex-row items-center">
                <div
                  className="flex flex-row items-stretch cursor-pointer w-full lg:!w-2/3"
                  onClick={() => toggleDropdown("livestream")}
                >
                  <div className="p-[1px] border rounded-l-xl border-[#DCCCF6]">
                    <div className="border-[1.5px] p-2 rounded-l-xl border-[#DCCCF6]">
                      <LuRadio className="text-2xl text-[#4300B1]" />
                    </div>
                  </div>

                  <div className="p-[2px] border rounded-r-xl border-[#4300B1] w-full">
                    <div className="bg-[#4300B1] p-2 rounded-r-xl border-2 border-[#4300B1] flex-1 flex lg:!flex-none items-center justify-center">
                      <p className="text-white text-sm">New Livestream </p>
                      {activeDropdown === "livestream" ? (
                        <MdKeyboardArrowUp className="text-white" />
                      ) : (
                        <MdKeyboardArrowDown className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row w-full lg:!w-[70%]">
                  <div className="p-[1px] border rounded-l-xl border-[#F5F5F5]">
                    <div className="border-2 p-2 rounded-l-xl border-[#F5F5F5]">
                      <RiLink className="text-2xl text-[#4300B1]" />
                    </div>
                  </div>
                  <div className="p-[2px] border rounded-r-xl border-[#F5F5F5] w-full">
                    <div className="rounded-r-xl border-2 border-[#F5F5F5] p-2 flex-1 flex">
                      <input
                        placeholder="Paste link to join livestream or meeting..."
                        className="focus:outline-none w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`absolute left-0 top-10 bg-white w-60 rounded-lg shadow-lg p-2 z-10 origin-top transition-all duration-200 ${
                  activeDropdown === "livestream"
                    ? "opacity-100 scale-y-100"
                    : "opacity-0 scale-y-0 pointer-events-none"
                }`}
              >
                <div
                  className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    createNewStream(StreamSessionType.Livestream, true)
                  }
                >
                  <div className="text-[#6E2ADB]">
                    <LuCircleFadingPlus className="" />
                  </div>
                  <span className="text-gray-700 text-sm font-inter">
                    Start instant livestream
                  </span>
                </div>
                <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                  <div className="text-[#6E2ADB]">
                    <TbCalendarPlus className="" />
                  </div>
                  <span className="text-gray-700 text-sm font-inter">
                    Schedule livestream
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`space-y-4 w-full lg:!w-3/5  ${
              selectedOption !== "meeting" ? "hidden" : ""
            }`}
          >
            <div className="relative font-poppins">
              <div className="flex items-center flex-col gap-y-3 lg:!gap-x-2 lg:!gap-y-0 lg:!flex-row">
                <div
                  className="flex flex-row  cursor-pointer w-full lg:!w-1/2"
                  onClick={() => toggleDropdown("meeting")}
                >
                  <div className="p-[1px] border rounded-l-xl border-[#DCCCF6]">
                    <div className="border-[1.5px] p-2 rounded-l-xl border-[#DCCCF6]">
                      <TbVideo className="text-2xl text-[#4300B1]" />
                    </div>
                  </div>
                  <div className="p-[2px] border rounded-r-xl border-[#4300B1] w-full">
                    <div className="bg-[#4300B1] p-2 rounded-r-xl border-2 border-[#4300B1] flex-1 flex lg:!flex-none items-center justify-center">
                      <p className="text-white text-sm">New Meeting</p>
                      {activeDropdown === "meeting" ? (
                        <MdKeyboardArrowUp className="text-white" />
                      ) : (
                        <MdKeyboardArrowDown className="text-white" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row w-full lg:!w-2/3">
                  <div className="p-[1px] border rounded-l-xl border-[#F5F5F5]">
                    <div className="border-2 p-2 rounded-l-xl border-[#F5F5F5]">
                      <RiLink className="text-2xl text-[#4300B1]" />
                    </div>
                  </div>

                  <div className="p-[2px] border rounded-r-xl border-[#F5F5F5] w-full">
                    <div className="rounded-r-xl border-2 border-[#F5F5F5] p-2 flex-1 flex">
                      <input
                        placeholder="Paste link to join livestream or meeting..."
                        className="focus:outline-none w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Dropdown Menu */}
              <div
                className={`absolute left-0 top-10 mt-2 w-60 bg-white rounded-lg shadow-lg p-2 z-10 origin-top transition-all duration-200 ${
                  activeDropdown === "meeting"
                    ? "opacity-100 scale-y-100"
                    : "opacity-0 scale-y-0 pointer-events-none"
                }`}
              >
                <div
                  className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    createNewStream(StreamSessionType.Meeting, true)
                  }
                >
                  <div className="text-[#6E2ADB]">
                    <LuCircleFadingPlus className="" />
                  </div>
                  <span className="text-gray-700 text-sm font-inter">
                    Start instant meeting
                  </span>
                </div>
                <div
                  className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    createNewStream(StreamSessionType.Meeting, false)
                  }
                >
                  <div className="text-[#6E2ADB]">
                    <RiLink className="" />
                  </div>
                  <span className="text-gray-700 text-sm font-inter">
                    Create meeting for later
                  </span>
                </div>
                <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                  <div className="text-[#6E2ADB]">
                    <TbCalendarPlus className="" />
                  </div>
                  <span className="text-gray-700 text-sm font-inter">
                    Schedule meeting
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StreamLayout>
      {isLoading && <Loading />}
      {stream && showModal && (
        <ShareModal stream={stream} closeFunc={() => setShowModal(false)} />
      )}
    </>
  );
};

export default CreateStream;
