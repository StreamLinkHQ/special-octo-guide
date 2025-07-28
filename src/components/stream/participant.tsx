import { useState } from "react";
import { type Participant } from "@vidbloq/react";
import { Icon } from "../icons";
import { useWallet } from "@civic/auth-web3/react";

type ParticipantSmallProps = {
  participant: Participant;
  onSendClick?: (participant: Participant) => void;
};

const ParticipantSmall = ({ participant, onSendClick }: ParticipantSmallProps) => {
  const { userName, avatarUrl } = participant;
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const wallet = useWallet({ type: "solana" });

  const isCurrentUser = wallet?.address !== participant.walletAddress;

  const handleClick = () => {
    setShowDropdown(!showDropdown);
  };
  
  const handleSendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendClick) {
      onSendClick(participant);
      setShowDropdown(false);
    }
  };

  const handleClickOutside = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };
  
  return (
    <div className="relative">
      <div 
        className="flex flex-col items-center cursor-pointer" 
        onClick={handleClick}
      >
        <img
          src={avatarUrl}
          className="h-[48px] w-[48px] rounded"
          alt={`${userName}'s avatar`}
        />
        <p className="text-sm">@{userName}</p>
      </div>
      
      {showDropdown && isCurrentUser && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleClickOutside}
          ></div>
          <div className="absolute z-20 mt-1 w-24 bg-white shadow-lg rounded-lg py-1 right-0">
            <div 
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={handleSendClick}
            >
              <Icon name="moneyTransfer" size={16} className="mr-2 text-primary" />
              {/* <RiMoneyDollarCircleFill className="mr-2 text-primary" /> */}
              <span>Send</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParticipantSmall;