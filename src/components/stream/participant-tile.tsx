import { useState } from "react";
import ReactDOM from "react-dom";
import {
  useParticipantControls,
  useParticipantData,
  type SDKParticipant,
  type Participant,
} from "@vidbloq/react";
import { SendModal } from "../modals";

type ParticipantTileContentProps = {
  participant: SDKParticipant;
  isLocal: boolean;
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  isSpeaking?: boolean;
  isActiveSpeaker?: boolean;
  onGiftSuccess?: (participant: SDKParticipant) => void;
};

const ParticipantTileContent = ({
  participant,
  isLocal,
  isCameraOn,
  isMicrophoneOn,
  isSpeaking = false,
  isActiveSpeaker = false,
}: ParticipantTileContentProps) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Participant | null>(null);

  const controls = useParticipantControls({
    participant,
    isLocal,
    isMicrophoneEnabled: isMicrophoneOn,
    isCameraEnabled: isCameraOn,
  });

  const participantData = useParticipantData({
    participant,
  });

  const handleGiftClick = () => {
    const recipient = controls.prepareGiftRecipient();
    if (recipient) {
      setSelectedRecipient(recipient);
      setShowSendModal(true);
    } else {
      console.error("Could not find wallet address for this participant");
    }
  };

  const handleDemoteClick = async () => {
    const result = await controls.demoteParticipant();
    if (result.success) {
      console.log(`${controls.participantMetadata.userName} returned to guest`);
    } else {
      console.error(result.error || "Failed to demote participant");
    }
  };

  return (
    <>
      {!isCameraOn && (
        // Camera off - show avatar view
        <div className="relative w-full h-full overflow-hidden rounded-lg">
          {/* Background with avatar */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${participantData.avatarUrl})`,
              filter: "blur(8px)",
              transform: "scale(1.3)",
              opacity: "0.9",
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-10" />

          {/* Central avatar - responsive sizing */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden">
              {participantData.avatarUrl ? (
                <img
                  src={participantData.avatarUrl}
                  alt={participantData.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white text-base sm:text-lg md:text-xl lg:text-2xl font-semibold">
                  {participantData.initials}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User info - optimized for mobile with proper spacing */}
      <div className="absolute bottom-1 left-1 right-20 sm:right-auto z-10">
        <div className="bg-black bg-opacity-50 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex items-center space-x-1.5 sm:space-x-2 max-w-[calc(100%-5rem)] sm:max-w-full">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden flex-shrink-0">
            {participantData.avatarUrl ? (
              <img
                src={participantData.avatarUrl}
                alt={participantData.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white text-xs">
                {participantData.initials}
              </div>
            )}
          </div>
          <span
            className="text-white text-[10px] sm:text-xs truncate flex-1 min-w-0"
            title={participantData.userName}
          >
            {participantData.userName}
          </span>
        </div>
      </div>

      {/* Bottom right controls - unified for mobile and desktop */}
      <div className="absolute bottom-1 right-1 z-10">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Gift button - now visible on all screen sizes */}
          {controls.canGift && (
            <button
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-light transition-colors"
              onClick={handleGiftClick}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}

          {/* Demote button - only show on desktop */}
          {controls.canDemote && (
            <button
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors hidden sm:flex ${
                controls.isDemoting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={controls.isDemoting ? undefined : handleDemoteClick}
              disabled={controls.isDemoting}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                />
              </svg>
            </button>
          )}

          {/* Integrated mic indicator with speaking animation */}
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
              controls.micEnabled ? "bg-primary" : "bg-gray-500 bg-opacity-60"
            }`}
          >
            {(isSpeaking || isActiveSpeaker) && controls.micEnabled ? (
              // Speaking animation
              <div className="flex items-center justify-center space-x-0.5">
                <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-white rounded-full animate-pulse" />
                <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded-full animate-pulse animation-delay-100" />
                <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-white rounded-full animate-pulse animation-delay-200" />
              </div>
            ) : (
              // Static mic icon
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {controls.micEnabled ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                )}
              </svg>
            )}
          </div>

          {/* Camera status indicator - smaller on mobile */}
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
              controls.cameraEnabled
                ? "bg-primary"
                : "bg-gray-500 bg-opacity-60"
            }`}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {controls.cameraEnabled ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Send Modal - Rendered through Portal */}
      {showSendModal && selectedRecipient && 
        ReactDOM.createPortal(
          <SendModal
            selectedUser={selectedRecipient}
            closeFunc={() => {
              setShowSendModal(false);
              setSelectedRecipient(null);
            }}
          />,
          document.body
        )
      }
    </>
  );
};

export default ParticipantTileContent;