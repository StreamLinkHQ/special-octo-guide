import React, { useState, useCallback } from "react";
import {
  useParticipantList,
  useStreamContext,
  useChat,
  MicrophoneControl,
  ScreenShareControl,
  // RecordControl,
  CameraControl,
  BaseCallControls,
  type CallControlsRenderProps,
} from "@vidbloq/react";
import { TfiAgenda } from "react-icons/tfi";
import { FaRegLightbulb } from "react-icons/fa";
import Modal from "../ui/v-modal";
import { Icon } from "../icons";
import {
  ChatModal,
  ParticipantListModal,
  YouTubeStreamingModal,
  FeatureModal,
} from "../modals";
import { ShareModal, isMobileDevice } from "@vidbloq/react";
import Reactions from "./reactions";
import ChatNotificationManager from "./chat-notification-manager";
import Tooltip from "../ui/tooltip";

export type CallControlsProps = {
  onRaiseHand?: () => void;
  onReturnToGuest?: () => void;
  onDisconnect?: () => void;
  onAgendaToggle: () => void;
  onChatToggle?: () => void;
  onReactionsToggle?: () => void;
  onRecordToggle?: () => void;
};

/**
 * CallControls provides the UI for stream call controls
 * Uses the BaseCallControls headless component for functionality
 */
const CallControls: React.FC<CallControlsProps> = ({
  onRaiseHand,
  onReturnToGuest,
  onDisconnect,
  onAgendaToggle,
  onChatToggle,
  onReactionsToggle,
  onRecordToggle,
}) => {
  const { participants, count } = useParticipantList();
  const { streamMetadata } = useStreamContext();

  // Chat hook for notifications
  const { getFormattedMessages, chatMessages } = useChat({
    participants,
  });

  const [showLink, setShowLink] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showParticipantList, setShowParticipantList] =
    useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showReactions, setShowReactions] = useState<boolean>(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState<boolean>(false);
  const [showFeatureModal, setShowFeatureModal] = useState<boolean>(false);

  const handleReactionsToggle = useCallback(() => {
    setShowReactions(!showReactions);
    onReactionsToggle?.();
  }, [showReactions, onReactionsToggle]);

  // Function to open chat modal (for notifications)
  const handleOpenChat = useCallback(() => {
    setShowChat(true);
    onChatToggle?.();
  }, [onChatToggle]);

  // Handle YouTube streaming modal
  const handleYouTubeModalToggle = useCallback(() => {
    setShowYouTubeModal(!showYouTubeModal);
  }, [showYouTubeModal]);

  // Handle feature modal
  const handleFeatureModalToggle = useCallback(() => {
    setShowFeatureModal(!showFeatureModal);
  }, [showFeatureModal]);

  // Get formatted messages for notifications
  const formattedMessages = getFormattedMessages(chatMessages);

  return (
    <BaseCallControls
      onRaiseHand={onRaiseHand}
      onReturnToGuest={onReturnToGuest}
      onDisconnect={onDisconnect}
      onRecordToggle={onRecordToggle}
      render={(props: CallControlsRenderProps) => {
        const {
          canAccessMediaControls,
          isGuest,
          hasPendingRequest,
          // isRecording,
          handleDisconnectClick,
          requestToSpeak,
          userType,
          toggleMic,
          toggleCamera,
          toggleScreenShare,
          // toggleRecording,
          // New raise hand props
          isHandRaised,
          canRaiseHand,
          raiseHand,
          lowerHand,
        } = props;

        return (
          <>
            {/* Chat Notification Manager */}
            <ChatNotificationManager
              messages={formattedMessages}
              participants={participants}
              isChatOpen={showChat}
              onOpenChat={handleOpenChat}
            />

            {/* Modals */}
            <ShareModal isOpen={showLink} onClose={() => setShowLink(false)} />
            <ParticipantListModal
              isOpen={showParticipantList}
              onClose={() => setShowParticipantList(false)}
            />
            <ChatModal
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              participants={participants}
            />
            <YouTubeStreamingModal
              isOpen={showYouTubeModal}
              onClose={() => setShowYouTubeModal(false)}
            />
            <FeatureModal
              isOpen={showFeatureModal}
              onClose={() => setShowFeatureModal(false)}
            />
            <Reactions showReactions={showReactions} />

            {/* Mobile Menu Modal */}
            {showMobileMenu && (
              <Modal
                onClose={() => setShowMobileMenu(false)}
                position="bottom"
                childClassName="bg-[var(--sdk-bg-primary-color)] h-auto w-full rounded-t-xl"
              >
                <div className="flex flex-row justify-between items-center w-[88%] mx-auto p-2">
                  <div
                    className="bg-[var(--sdk-bg-primary-color)] border flex flex-row lg:hidden items-center justify-between p-0.5 rounded-2xl gap-x-2 cursor-pointer"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowParticipantList(true);
                    }}
                  >
                    <span>{count}</span>
                    <div className="bg-[#DCCCF63D] p-2 rounded-xl">
                      <Icon name="users" className="text-primary" />
                    </div>
                  </div>
                  <div
                    className="bg-[var(--sdk-bg-primary-color)] border flex flex-row items-center justify-between p-0.5 rounded-2xl gap-x-2 cursor-pointer"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowLink(true);
                    }}
                  >
                    <Icon name="circle" className="text-[#F5F5F5]" size={12} />
                    <div className="bg-[#DCCCF63D] p-2 rounded-xl">
                      <Icon name="link" className="text-primary" />
                    </div>
                  </div>
                  <div className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[50px] w-[50px]">
                    <div
                      className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center"
                      onClick={onAgendaToggle}
                    >
                      {/* <Icon name="smiley" className="text-yellow-400" /> */}
                       <TfiAgenda className="text-primary text-xl" />
                    </div>
                  </div>
                  <div className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[50px] w-[50px]">
                    <div
                      className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center"
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleOpenChat();
                      }}
                    >
                      <Icon name="chat" className="text-primary" />
                    </div>
                  </div>
                  {/* YouTube Streaming in mobile menu */}
                  {userType === "host" && (
                    <div className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[50px] w-[50px]">
                      <div
                        className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center"
                        onClick={() => {
                          setShowMobileMenu(false);
                          handleYouTubeModalToggle();
                        }}
                      >
                        <Icon name="video" className="text-red-600" />
                      </div>
                    </div>
                  )}
                  {/* Feature suggestion in mobile menu */}
                  <div className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[50px] w-[50px]">
                    <div
                      className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center"
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleFeatureModalToggle();
                      }}
                    >
                      {/* <Icon name="lightbulb" className="text-primary" /> */}
                      <FaRegLightbulb className="text-primary" />
                    </div>
                  </div>
                </div>
              </Modal>
            )}

            {/* Main Controls UI */}
            <div className={`w-full max-6xl mx-auto`}>
              <div className="flex items-center justify-between">
                {/* Left group - Link and Menu icons */}
                <div className="bg-[#F2EFFE] rounded-full lg:py-2 lg:px-3 flex items-center space-x-2">
                  <Tooltip content="Share link">
                    <div
                      className="bg-[var(--sdk-bg-primary-color)] hidden lg:flex flex-row items-center justify-between p-0.5 rounded-2xl gap-x-2 cursor-pointer"
                      onClick={() => setShowLink(true)}
                    >
                      <Icon
                        name="circle"
                        className="text-[#F5F5F5]"
                        size={12}
                      />
                      <div className="bg-[#DCCCF63D] p-2 rounded-xl">
                        <Icon name="link" className="text-primary" />
                      </div>
                    </div>
                  </Tooltip>
                  <Tooltip content="Suggest Feature">
                    <div
                      className="bg-[var(--sdk-bg-primary-color)] hidden lg:flex cursor-pointer flex-row items-center justify-between p-0.5 rounded-2xl gap-x-2"
                      onClick={handleFeatureModalToggle}
                    >
                      <div className="bg-[#DCCCF63D] p-2 rounded-xl">
                        {/* <Icon name="lightbulb" className="text-primary" /> */}
                        <FaRegLightbulb className="text-primary" />
                      </div>
                    </div>
                  </Tooltip>
                  <div
                    className="bg-[var(--sdk-bg-primary-color)] hidden lg:flex flex-row items-center justify-between p-0.5 rounded-2xl gap-x-2 cursor-pointer"
                    onClick={() => setShowParticipantList(true)}
                  >
                    <span>{count}</span>
                    <div className="bg-[#DCCCF63D] p-2 rounded-xl">
                      <Icon name="users" className="text-primary" />
                    </div>
                  </div>
                </div>

                {/* Record/YouTube Streaming button */}
                <div className="hidden lg:block">
                  {userType === "host" && (
                    <Tooltip content="Stream to YouTube">
                      <div
                        className="bg-red-600 hover:bg-red-700 rounded-2xl p-2 cursor-pointer flex items-center gap-2 text-white"
                        onClick={handleYouTubeModalToggle}
                      >
                        <Icon name="video" className="text-white" size={16} />
                        <span className="text-sm">YouTube</span>
                      </div>
                    </Tooltip>
                  )}
                </div>

                {/* Icon group - main middle section */}
                <div className="bg-secondary-light [#F2EFFE] rounded-full py-2 px-3 flex items-center space-x-2">
                  {/* Raise hand for LIVESTREAMS (existing logic) */}
                  {streamMetadata?.streamSessionType === "livestream" &&
                    isGuest &&
                    !canAccessMediaControls &&
                    !hasPendingRequest &&
                    requestToSpeak && (
                      <div
                        className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px]"
                        onClick={requestToSpeak}
                      >
                        <div className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center">
                          <Icon name="hand" className="text-primary" />
                        </div>
                      </div>
                    )}

                  {streamMetadata?.streamSessionType === "livestream" &&
                    isGuest &&
                    !canAccessMediaControls &&
                    hasPendingRequest && (
                      <div className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px]">
                        <div className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center">
                          <Icon name="hand" className="text-green-500" />
                        </div>
                      </div>
                    )}

                  {/* Raise hand for MEETINGS (new logic) */}
                  {streamMetadata?.streamSessionType === "meeting" &&
                    canRaiseHand &&
                    !isHandRaised &&
                    raiseHand && (
                      <div
                        className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px]"
                        onClick={raiseHand}
                        title="Raise hand to speak"
                      >
                        <div className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center">
                          <Icon name="hand" className="text-primary" />
                        </div>
                      </div>
                    )}

                  {streamMetadata?.streamSessionType === "meeting" &&
                    canRaiseHand &&
                    isHandRaised &&
                    lowerHand && (
                      <div
                        className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px]"
                        onClick={lowerHand}
                        title="Lower hand"
                      >
                        <div className="bg-primary rounded-2xl h-full flex flex-col items-center justify-center">
                          <Icon
                            name="hand"
                            className="text-white animate-pulse"
                          />
                        </div>
                      </div>
                    )}
                  <div className="bg-[var(--sdk-bg-primary-color)] p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px] hidden lg:flex items-center justify-center flex-col" onClick={onAgendaToggle}>
                    <TfiAgenda className="text-primary text-xl" />
                  </div>

                  {/* Screen share */}
                  {canAccessMediaControls &&
                    !isMobileDevice() &&
                    toggleScreenShare && (
                      <ScreenShareControl
                        showLabel={false}
                        onChange={() => toggleScreenShare()}
                      />
                    )}

                  {/* Microphone */}
                  {canAccessMediaControls && toggleMic && (
                    <MicrophoneControl showLabel={false} />
                  )}

                  {/* Camera */}
                  {canAccessMediaControls && toggleCamera && (
                    <CameraControl
                      showLabel={false}
                      onError={(error) => console.error("Camera error:", error)}
                    />
                  )}

                  {/* Reactions */}
                  <div
                    className={`p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px] ${
                      showReactions
                        ? "bg-primary"
                        : "bg-[var(--sdk-bg-primary-color)]"
                    } `}
                  >
                    <div
                      className={` rounded-2xl h-full flex flex-col items-center justify-center
                        ${showReactions ? "bg-primary" : "bg-[#DCCCF63D]"}
                        `}
                      onClick={handleReactionsToggle}
                    >
                      <Icon name="smiley" className="text-yellow-400" />
                    </div>
                  </div>

                  <div
                    className="bg-[var(--sdk-bg-primary-color)] border flex flex-row lg:hidden items-center justify-between p-0.5 rounded-2xl gap-x-2 cursor-pointer"
                    onClick={() => setShowMobileMenu(true)}
                  >
                    <Icon
                      name="circle"
                      className="text-[#F5F5F5] hidden"
                      size={12}
                    />
                    <div className="bg-[#DCCCF63D] p-2 rounded-xl">
                      <Icon name="more" className="text-primary" />
                    </div>
                  </div>

                  {/* Chat */}
                  <div
                    className="bg-[var(--sdk-bg-primary-color)] hidden lg:block p-0.5 rounded-2xl cursor-pointer h-[44px] w-[44px]"
                    onClick={handleOpenChat}
                  >
                    <div className="bg-[#DCCCF63D] rounded-2xl h-full flex flex-col items-center justify-center">
                      <Icon name="chat" className="text-primary" />
                    </div>
                  </div>
                </div>

                {/* End call button */}
                {handleDisconnectClick && (
                  <div
                    className="rounded-2xl p-0.5 bg-[#D40000] flex flex-row text-white items-center gap-x-2 cursor-pointer"
                    onClick={handleDisconnectClick}
                  >
                    <>
                      <span className="ml-2 hidden lg:block">End</span>
                      <div className="rounded-2xl bg-[#FF5555] p-2">
                        <Icon name="phone" className="text-white" />
                      </div>
                    </>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      }}
    />
  );
};

export default CallControls;
