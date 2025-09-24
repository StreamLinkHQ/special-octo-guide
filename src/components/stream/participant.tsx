// import { useState } from "react";
// import { type Participant } from "@vidbloq/react";
// import { useWallet } from "@civic/auth-web3/react";
// import { Icon } from "../icons";

// type ParticipantSmallProps = {
//   participant: Participant;
//   onSendClick?: (participant: Participant) => void;
// };

// const ParticipantSmall = ({ participant, onSendClick }: ParticipantSmallProps) => {
//   const { userName, avatarUrl } = participant;
//   const [showDropdown, setShowDropdown] = useState<boolean>(false);
//   const wallet = useWallet({ type: "solana" });

//   const isCurrentUser = wallet?.address !== participant.walletAddress;

//   const handleClick = () => {
//     setShowDropdown(!showDropdown);
//   };

//   const handleSendClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (onSendClick) {
//       onSendClick(participant);
//       setShowDropdown(false);
//     }
//   };

//   const handleClickOutside = () => {
//     if (showDropdown) {
//       setShowDropdown(false);
//     }
//   };

//   return (
//     <div className="relative">
//       <div
//         className="flex flex-col items-center cursor-pointer"
//         onClick={handleClick}
//       >
//         <img
//           src={avatarUrl}
//           className="h-[48px] w-[48px] rounded"
//           alt={`${userName}'s avatar`}
//         />
//         <p className="text-sm">@{userName}</p>
//       </div>

//       {showDropdown && isCurrentUser && (
//         <>
//           <div
//             className="fixed inset-0 z-10"
//             onClick={handleClickOutside}
//           ></div>
//           <div className="absolute z-20 mt-1 w-24 bg-white shadow-lg rounded-lg py-1 right-0">
//             <div
//               className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
//               onClick={handleSendClick}
//             >
//               <Icon name="moneyTransfer" size={16} className="mr-2 text-primary" />
//               {/* <RiMoneyDollarCircleFill className="mr-2 text-primary" /> */}
//               <span>Send</span>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default ParticipantSmall;

import { useState, useEffect, useRef } from "react";
import { type Participant } from "@vidbloq/react";
import { useWallet } from "@civic/auth-web3/react";
import { useStreamContext } from "@vidbloq/react";
import {
  FaMapPin,
  FaUserAlt,
  FaUserCog,
  FaUserSlash,
  FaVolumeMute,
} from "react-icons/fa";
import { Icon } from "../icons";

type ParticipantSmallProps = {
  participant: Participant;
  onSendClick?: (participant: Participant) => void;
  viewMode?: "grid" | "list";
};

const ParticipantSmall = ({
  participant,
  onSendClick,
  viewMode = "grid",
}: ParticipantSmallProps) => {
  const { userName, avatarUrl } = participant;
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wallet = useWallet({ type: "solana" });
  const {
    userType,
    streamMetadata: { streamSessionType },
  } = useStreamContext();

  const isCurrentUser = wallet?.address === participant.walletAddress;
  const isHost = userType === "host";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "send":
        onSendClick?.(participant);
        break;
      case "pin":
        console.log("Pin participant:", participant.userName);
        // Add your pin logic here
        break;
      case "profile":
        console.log("View profile:", participant.userName);
        // Add navigation to profile
        break;
      case "mute":
        console.log("Toggle mute:", participant.userName);
        // Add mute logic
        break;
      case "hide-video":
        console.log("Hide video:", participant.userName);
        // Add hide video logic
        break;
      case "moderator":
        console.log("Toggle moderator:", participant.userName);
        // Add moderator logic
        break;
      case "remove":
        console.log("Remove participant:", participant.userName);
        // Add remove logic
        break;
    }
    setShowDropdown(false);
  };

  // List View
  if (viewMode === "list") {
    return (
      <div className="relative group">
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  className="w-12 h-12 rounded-xl object-cover"
                  alt={`${userName}'s avatar`}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                  {getInitials(userName)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-800">@{userName}</p>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>

          {!isCurrentUser && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSendClick?.(participant)}
                className="p-2 rounded-lg bg-primary text-white hover:bg-purple-700 transition-colors"
              >
                <Icon name="moneyTransfer" size={14} className="text-white" />
              </button>
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon name="more" size={16} className="text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Menu for List View */}
        {showDropdown && !isCurrentUser && (
          <div
            ref={dropdownRef}
            className="absolute top-14 right-2 z-[100] w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
            style={{
              position: "fixed",
              marginTop: buttonRef.current?.getBoundingClientRect().bottom,
            }}
          >
            <button
              onClick={() => handleAction("send")}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
            >
              <Icon
                name="moneyTransfer"
                size={16}
                className="text-purple-600"
              />
              <span className="text-gray-700">Send Money</span>
            </button>
            <button
              onClick={() => handleAction("pin")}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
            >
              <FaMapPin className="text-gray-600" />
              <span className="text-gray-700">Pin Participant</span>
            </button>
            <button
              onClick={() => handleAction("profile")}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
            >
              <FaUserAlt className="text-gray-600" />
              <span className="text-gray-700">View Profile</span>
            </button>

            {/* Host-only options */}
            {isHost && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleAction("mute")}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
                >
                  <FaVolumeMute className="text-gray-600" />
                  <span className="text-gray-700">Mute</span>
                </button>
                <button
                  onClick={() => handleAction("remove")}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
                >
                  <FaUserSlash className="text-red-600" />
                  <span>Remove from Stream</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grid View (default)
  return (
    <div className="relative group">
      <div className="flex flex-col items-center p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 cursor-pointer">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-14 h-14 rounded-xl object-cover"
              alt={`${userName}'s avatar`}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              {getInitials(userName)}
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        <p className="text-sm text-gray-700 mt-2 font-medium truncate max-w-full">
          @{userName}
        </p>

        {!isCurrentUser && (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="absolute top-2 right-2 p-1 rounded-lg bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white shadow-sm"
          >
            <Icon name="more" size={16} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown Menu for Grid View - Using Portal approach */}
      {showDropdown && !isCurrentUser && (
        <div
          ref={dropdownRef}
          className="absolute top-10 right-2 z-[100] w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
        >
          <button
            onClick={() => handleAction("send")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
          >
            <Icon name="moneyTransfer" size={16} className="text-purple-600" />
            <span className="text-gray-700">Send Money</span>
          </button>
          <button
            onClick={() => handleAction("pin")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
          >
            <FaMapPin className="text-gray-600" />
            <span className="text-gray-700">Pin Participant</span>
          </button>
          <button
            onClick={() => handleAction("profile")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
          >
            <FaUserAlt className="text-gray-600" />
            <span className="text-gray-700">View Profile</span>
          </button>

          {/* Host-only options */}
          {isHost && (
            <>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => handleAction("mute")}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
              >
                <FaVolumeMute className="text-gray-600" />
                <span className="text-gray-700">Mute</span>
              </button>
              {/* <button
                onClick={() => handleAction('hide-video')}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
              >
                <span className="text-gray-700">Hide Video</span>
              </button> */}
              {streamSessionType === "livestream" && (
                <button
                  onClick={() => handleAction("moderator")}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors"
                >
                  <FaUserCog className="text-gray-600" />
                  <span className="text-gray-700">Make Temp-host</span>
                </button>
              )}

              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => handleAction("remove")}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
              >
                <FaUserSlash className="text-red-600" />
                <span>Remove from Stream</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantSmall;
