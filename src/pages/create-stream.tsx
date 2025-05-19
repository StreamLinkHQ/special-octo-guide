import { useState } from "react";
import { RiLink } from "react-icons/ri";
import { LuRadio } from "react-icons/lu";
import { MdKeyboardArrowDown } from "react-icons/md";
import { StreamLayout } from "../components";

type Option = "stream" | "meeting";
const CreateStream = () => {
  const [selectedOption, setSelectedOption] = useState<Option>("stream");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const selectTab = (option: Option) => {
    setSelectedOption(option);
    setActiveDropdown(null);
  };
  return (
    <StreamLayout>
      <div className="w-full">
        <p>Hello </p>
        <h2 className="text-gray-800 text-3xl lg:!text-4xl font-medium mb-3 font-poppins">
          Creating a Stream or Meeting?
        </h2>

        <div className="flex items-center mb-6 font-inter">
          <span className="mr-2">Select,</span>
          {/* Stream Tab */}
          <button
            onClick={() => selectTab("stream")}
            className={`text-[#6E2ADB] font-medium mr-2 ${
              selectedOption === "stream"
                ? "border-b-2 border-[#6E2ADB]"
                : "opacity-60 hover:opacity-100 transition-opacity"
            }`}
          >
            Stream
          </button>
          <span className="text-gray-500 mr-2">or</span>
          {/* Meeting Tab */}
          <button
            onClick={() => selectTab("meeting")}
            className={`text-[#6E2ADB] font-medium ${
              selectedOption === "meeting"
                ? "border-b-2 border-[#6E2ADB]"
                : "opacity-60 hover:opacity-100 transition-opacity"
            }`}
          >
            Meeting
          </button>
          <span className="ml-2">to start.</span>
        </div>
        <div
          className={`space-y-4 w-full lg:!w-2/4 ${
            selectedOption !== "stream" ? "hidden" : ""
          }`}
        >
          <div className="relative font-poppins">
            <div className="flex flex-col gap-y-3 lg:!gap-y-0 lg:!flex-row items-center">
              <div
                className="flex flex-row cursor-pointer w-full lg:!w-1/2 bg-red-70"
                onClick={() => toggleDropdown("stream")}
              >
                <div className="p-[1px] border rounded-l-xl border-[#DCCCF6]">
                  <div className="border-2 p-2 rounded-l-xl border-[#DCCCF6]">
                    <LuRadio className="text-2xl text-[#4300B1]" />
                  </div>
                </div>

                <div className="p-[2px] border rounded-r-xl border-[#4300B1]">
                  <div className="bg-[#4300B1] p-2 rounded-r-xl border-2 border-[#4300B1] flex-1 flex lg:!flex-none items-center justify-center">
                    <p className="text-white text-sm">New Stream </p>
                    <MdKeyboardArrowDown className="text-white" />
                  </div>
                </div>
              </div>
              <div className="flex flex-row w-full lg:!w-1/2">
                <div className="border-2 p-2 rounded-l-xl border-[#F5F5F5]">
                  <RiLink className="text-2xl text-[#4300B1]" />
                </div>
                <div className="rounded-r-xl border-2 border-[#F5F5F5] p-2 flex-1 flex">
                  <input
                    placeholder="Paste link to join stream or meeting..."
                    className="focus:outline-none w-full text-sm"
                  />
                </div>
              </div>
            </div>

            <div
              className={`absolute left-0 top-full mt-2 w-60 bg-white rounded-lg shadow-lg p-2 z-10 origin-top transition-all duration-200 ${
                activeDropdown === "stream"
                  ? "opacity-100 scale-y-100"
                  : "opacity-0 scale-y-0 pointer-events-none"
              }`}
            >
              <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                <div className="text-[#6E2ADB]">
                  {/* <Clock className="w-5 h-5" /> */}
                </div>
                <span className="text-gray-700">Start instant stream</span>
              </div>
              <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                <div className="text-[#6E2ADB]">
                  {/* <Calendar className="w-5 h-5" /> */}
                </div>
                <span className="text-gray-700">Schedule Stream</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`space-y-4 w-full lg:!w-2/4  ${
            selectedOption !== "meeting" ? "hidden" : ""
          }`}
        >
          <div className="relative">
            <div className="flex items-center flex-col gap-y-3 lg:!gap-y-0 lg:!flex-row">
              <div
                className="flex flex-row  cursor-pointer w-full lg:!w-1/2"
                onClick={() => toggleDropdown("meeting")}
              >
                <div className="border-2 p-2 rounded-l-xl border-[#DCCCF6]">
                  <LuRadio className="text-2xl text-[#4300B1]" />
                </div>
                <div className="bg-[#4300B1] p-2 rounded-r-xl border-2 border-[#4300B1] flex-1 flex lg:!flex-none items-center justify-center">
                  <p className="text-white text-sm">New Meeting</p>
                  <MdKeyboardArrowDown className="text-white" />
                </div>
              </div>

              <div className="flex flex-row w-full lg:!w-1/2">
                <div className="border-2 p-2 rounded-l-xl border-[#F5F5F5]">
                  <RiLink className="text-2xl text-[#4300B1]" />
                </div>
                <div className="rounded-r-xl border-2 border-[#F5F5F5] p-2 flex-1 flex">
                  <input
                    placeholder="Enter a username"
                    className="focus:outline-none w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Meeting Dropdown Menu */}
            <div
              className={`absolute left-0 top-full mt-2 w-60 bg-white rounded-lg shadow-lg p-2 z-10 origin-top transition-all duration-200 ${
                activeDropdown === "meeting"
                  ? "opacity-100 scale-y-100"
                  : "opacity-0 scale-y-0 pointer-events-none"
              }`}
            >
              <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                <div className="text-[#6E2ADB]">
                  {/* <Clock className="w-5 h-5" /> */}
                </div>
                <span className="text-gray-700">Start instant meeting</span>
              </div>
              <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                <div className="text-[#6E2ADB]">
                  {/* <LinkIcon className="w-5 h-5" /> */}
                </div>
                <span className="text-gray-700">Create meeting for later</span>
              </div>
              <div className="py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-3 cursor-pointer">
                <div className="text-[#6E2ADB]">
                  {/* <Calendar className="w-5 h-5" /> */}
                </div>
                <span className="text-gray-700">Schedule meeting</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StreamLayout>
  );
};

export default CreateStream;
