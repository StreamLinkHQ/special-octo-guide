import { useState, useCallback } from "react";
import {
  useParticipantList,
  useStreamContext,
  useChat,
  MicrophoneControl,
  ScreenShareControl,
  CameraControl,
  BaseCallControls,
  type CallControlsRenderProps,
  // useAllStreamTransactions,
  // useMyStreamTransactions,
  // useTransactionHistory
} from "@vidbloq/react";
import { TfiAgenda } from "react-icons/tfi";
import { FaRegLightbulb } from "react-icons/fa";
import { Modal, Tooltip } from "../ui";
import { Icon } from "../icons";
import { ChatModal, ParticipantListModal, FeatureModal, ShareModalSimple } from "../modals";
import Reactions from "./reactions";
import ChatNotificationManager from "./chat-notification-manager";
import { useStream } from "../../hooks";
import RecordingControls from "./recording-controls"; // Import the new component

type CallControlsProps = {
  onRaiseHand?: () => void;
  onReturnToGuest?: () => void;
  onDisconnect?: () => void;
  onChatToggle?: () => void;
  onReactionsToggle?: () => void;
  onRecordToggle?: () => void;
  onAgendaToggle: () => void;
  showParticipantList: boolean;
  setShowParticipantList: (show: boolean) => void;
};

const CallControls = ({
  onRaiseHand,
  onReturnToGuest,
  onDisconnect,
  onAgendaToggle,
  onChatToggle,
  onReactionsToggle,
  onRecordToggle,
  showParticipantList,
  setShowParticipantList,
}: CallControlsProps) => {
  const { participants, count } = useParticipantList();
  const { streamMetadata } = useStreamContext();
  const { agendas } = useStream();
  const { getFormattedMessages, chatMessages } = useChat({ participants });
  // const { transactions: myAllTx } = useTransactionHistory({});        // All my transactions
  // const { transactions: myStreamTx } = useMyStreamTransactions();  // My transactions in this stream
  // const { transactions: allStreamTx } = useAllStreamTransactions({});

  // console.log({ myAllTx, myStreamTx, allStreamTx });
  const [showLink, setShowLink] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showReactions, setShowReactions] = useState<boolean>(false);
  const [showFeatureModal, setShowFeatureModal] = useState<boolean>(false);

  const handleReactionsToggle = useCallback(() => {
    setShowReactions(!showReactions);
    onReactionsToggle?.();
  }, [showReactions, onReactionsToggle]);

  const handleOpenChat = useCallback(() => {
    setShowChat(true);
    onChatToggle?.();
  }, [onChatToggle]);

  const handleFeatureModalToggle = useCallback(() => {
    setShowFeatureModal(!showFeatureModal);
  }, [showFeatureModal]);

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
          handleDisconnectClick,
          requestToSpeak,
          userType,
          toggleMic,
          toggleCamera,
          toggleScreenShare,
          isHandRaised,
          canRaiseHand,
          raiseHand,
          lowerHand,
        } = props;

        return (
          <>
            <ChatNotificationManager
              messages={formattedMessages}
              participants={participants}
              isChatOpen={showChat}
              onOpenChat={handleOpenChat}
            />

            {/* Modals */}
            <ShareModalSimple isOpen={showLink} onClose={() => setShowLink(false)} />
            <ParticipantListModal
              isOpen={showParticipantList}
              onClose={() => setShowParticipantList(false)}
            />
            <ChatModal
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              participants={participants}
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
                childClassName="bg-white h-auto w-full rounded-t-3xl shadow-2xl"
              >
                <div className="w-full px-4 pb-8 pt-6">
                  <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-6"></div>

                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    {/* Participants */}
                    <button
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowParticipantList(true);
                      }}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
                          <Icon
                            name="users"
                            className="text-[#8b5cf6] w-6 h-6"
                          />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-[#8b5cf6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {count}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        Participants
                      </span>
                    </button>

                    {/* Share Link */}
                    <button
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowLink(true);
                      }}
                    >
                      <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
                        <Icon name="link" className="text-[#8b5cf6] w-6 h-6" />
                      </div>
                      <span className="text-xs text-gray-600">Share</span>
                    </button>

                    {/* Agenda */}
                    {(userType === "host" ||
                      (agendas && agendas.length > 0)) && (
                      <button
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
                        onClick={() => {
                          setShowMobileMenu(false);
                          onAgendaToggle();
                        }}
                      >
                        <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
                          <TfiAgenda className="text-[#8b5cf6] text-xl" />
                        </div>
                        <span className="text-xs text-gray-600">Agenda</span>
                      </button>
                    )}

                    {/* Chat */}
                    <button
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleOpenChat();
                      }}
                    >
                      <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
                        <Icon name="chat" className="text-[#8b5cf6] w-6 h-6" />
                      </div>
                      <span className="text-xs text-gray-600">Chat</span>
                    </button>

                    {/* Recording Controls - Mobile Menu Version */}
                    <RecordingControls
                      isMobileMenu={true}
                      onMobileMenuClick={() => setShowMobileMenu(false)}
                    />

                    {/* Feature Suggestion */}
                    <button
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleFeatureModalToggle();
                      }}
                    >
                      <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
                        <FaRegLightbulb className="text-[#8b5cf6] text-xl" />
                      </div>
                      <span className="text-xs text-gray-600">Suggest</span>
                    </button>
                  </div>
                </div>
              </Modal>
            )}

            {/* Main Controls UI */}
            <div className="w-full px-2 sm:!px-4 py-3">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Left Section - Desktop only */}
                <div className="hidden lg:!flex items-center gap-3">
                  {/* Participants Count */}
                  <Tooltip content="View participants">
                    <button
                      className="flex items-center gap-2 h-10 px-3 bg-gray-100 backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200"
                      onClick={() => setShowParticipantList(true)}
                    >
                      <Icon name="users" className="text-[#8b5cf6] w-5 h-5" />
                      <span className="font-medium text-sm text-gray-700">
                        {count}
                      </span>
                    </button>
                  </Tooltip>

                  {/* Recording Controls - Desktop Version */}
                  <RecordingControls />

                  {/* Share Link */}
                  <Tooltip content="Share meeting link">
                    <button
                      className="flex items-center justify-center w-10 h-10 bg-gray-100 backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200"
                      onClick={() => setShowLink(true)}
                    >
                      <Icon name="link" className="text-[#8b5cf6] w-5 h-5" />
                    </button>
                  </Tooltip>

                  {/* Feature Suggestion */}
                  <Tooltip content="Suggest a feature">
                    <button
                      className="flex items-center justify-center w-10 h-10 bg-gray-100 backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200"
                      onClick={handleFeatureModalToggle}
                    >
                      <FaRegLightbulb className="text-[#8b5cf6] w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>

                {/* Center Section - Main Controls */}
                <div className="flex items-center gap-2 mx-auto lg:!mx-0">
                  <div className="flex items-center lg:!gap-x-3 bg-gray-100 gap-x-1.5 backdrop-blur-sm rounded-2xl shadow-lg px-1 py-1">
                    {/* Raise hand for LIVESTREAMS */}
                    {streamMetadata?.streamSessionType === "livestream" &&
                      isGuest &&
                      !canAccessMediaControls &&
                      !hasPendingRequest &&
                      requestToSpeak && (
                        <button
                          className="p-3 rounded-xl hover:bg-gray-200 transition-colors relative group"
                          onClick={requestToSpeak}
                        >
                          <Icon
                            name="hand"
                            className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors"
                          />
                        </button>
                      )}

                    {streamMetadata?.streamSessionType === "livestream" &&
                      isGuest &&
                      !canAccessMediaControls &&
                      hasPendingRequest && (
                        <button className="p-3 rounded-xl bg-green-100 relative">
                          <Icon
                            name="hand"
                            className="text-green-600 w-5 h-5 animate-pulse"
                          />
                        </button>
                      )}

                    {/* Raise hand for MEETINGS */}
                    {streamMetadata?.streamSessionType === "meeting" &&
                      canRaiseHand &&
                      !isHandRaised &&
                      raiseHand && (
                        <button
                          className="p-3 rounded-xl hover:bg-gray-200 transition-colors relative group"
                          onClick={raiseHand}
                          title="Raise hand to speak"
                        >
                          <Icon
                            name="hand"
                            className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors"
                          />
                        </button>
                      )}

                    {streamMetadata?.streamSessionType === "meeting" &&
                      canRaiseHand &&
                      isHandRaised &&
                      lowerHand && (
                        <button
                          className="p-3 rounded-xl bg-[#8b5cf6]/10 relative"
                          onClick={lowerHand}
                          title="Lower hand"
                        >
                          <Icon
                            name="hand"
                            className="text-[#8b5cf6] w-5 h-5 animate-pulse"
                          />
                        </button>
                      )}

                    {/* Agenda - Hidden on mobile */}
                    {(userType === "host" ||
                      (agendas && agendas.length > 0)) && (
                      <Tooltip content="Agenda">
                        <button
                          className="p-3 rounded-xl hover:bg-gray-200 transition-colors hidden lg:!block group"
                          onClick={onAgendaToggle}
                        >
                          <TfiAgenda className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors" />
                        </button>
                      </Tooltip>
                    )}

                    {/* Screen share - Hidden on mobile */}
                    {canAccessMediaControls && toggleScreenShare && (
                      <div className="hidden lg:!block">
                        <ScreenShareControl showLabel={false} />
                      </div>
                    )}

                    {/* Microphone */}
                    {canAccessMediaControls && toggleMic && (
                      <MicrophoneControl showLabel={false} />
                    )}

                    {/* Camera */}
                    {canAccessMediaControls && toggleCamera && (
                      <CameraControl
                        showLabel={false}
                        onError={(error) =>
                          console.error("Camera error:", error)
                        }
                      />
                    )}

                    {/* Reactions */}
                    <button
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        showReactions ? "bg-[#8b5cf6]/10" : "hover:bg-gray-200"
                      }`}
                      onClick={handleReactionsToggle}
                    >
                      <Icon
                        name="smiley"
                        className={`w-5 h-5 ${
                          showReactions ? "text-yellow-500" : "text-yellow-500"
                        }`}
                      />
                    </button>

                    {/* Chat - Hidden on mobile */}
                    <button
                      className="p-3 rounded-xl hover:bg-gray-200 transition-colors hidden lg:!block group"
                      onClick={handleOpenChat}
                    >
                      <Icon
                        name="chat"
                        className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors"
                      />
                    </button>

                    {/* Mobile menu button */}
                    <button
                      className="p-3 rounded-xl hover:bg-gray-200 transition-colors lg:!hidden"
                      onClick={() => setShowMobileMenu(true)}
                    >
                      <Icon name="more" className="text-gray-600 w-5 h-5" />
                    </button>
                  </div>

                  {/* End call button */}
                  {handleDisconnectClick && (
                    <button
                      className="flex items-center gap-2 px-4 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-2xl shadow-lg transition-all duration-200 group"
                      onClick={handleDisconnectClick}
                    >
                      <Icon
                        name="phone"
                        className="w-5 h-5 rotate-135 group-hover:rotate-180 transition-transform"
                      />
                      <span className="hidden sm:!block text-sm font-medium">
                        End
                      </span>
                    </button>
                  )}
                </div>

                {/* Right Section - Desktop only - REMOVED YouTube button */}
                <div className="hidden lg:!flex items-center gap-3">
                  {/* YouTube button removed - now handled by RecordingControls */}
                </div>
              </div>
            </div>
          </>
        );
      }}
    />
  );
};

export default CallControls;


// import { useState, useCallback } from "react";
// import {
//   useParticipantList,
//   useStreamContext,
//   useChat,
//   MicrophoneControl,
//   ScreenShareControl,
//   // RecordControl,
//   CameraControl,
//   BaseCallControls,
//   type CallControlsRenderProps,
//   useStreamRecording,
//   useStreamRoom,
// } from "@vidbloq/react";
// import { TfiAgenda } from "react-icons/tfi";
// import { FaRegLightbulb } from "react-icons/fa";
// import Modal from "../ui/v-modal";
// import { Icon } from "../icons";
// import {
//   ChatModal,
//   ParticipantListModal,
//   // YouTubeStreamingModal,
//   FeatureModal,
//   YouTubeStreamingModal,
// } from "../modals";
// import { ShareModal } from "@vidbloq/react";
// import Reactions from "./reactions";
// import ChatNotificationManager from "./chat-notification-manager";
// import Tooltip from "../ui/tooltip";
// import { useStream } from "../../hooks";

// type CallControlsProps = {
//   onRaiseHand?: () => void;
//   onReturnToGuest?: () => void;
//   onDisconnect?: () => void;
//   onChatToggle?: () => void;
//   onReactionsToggle?: () => void;
//   onRecordToggle?: () => void;
//   onAgendaToggle: () => void;
//   showParticipantList: boolean;
//   setShowParticipantList: (show: boolean) => void;
// };

// /**
//  * CallControls provides the UI for stream call controls
//  * Uses the BaseCallControls headless component for functionality
//  */
// const CallControls = ({
//   onRaiseHand,
//   onReturnToGuest,
//   onDisconnect,
//   onAgendaToggle,
//   onChatToggle,
//   onReactionsToggle,
//   onRecordToggle,
//   showParticipantList,
//   setShowParticipantList,
// }: CallControlsProps) => {
//   const { participants, count } = useParticipantList();
//   const { streamMetadata } = useStreamContext();

//   const { agendas } = useStream();

//   const { getFormattedMessages, chatMessages } = useChat({
//     participants,
//   });

//   const [showLink, setShowLink] = useState<boolean>(false);
//   const [showChat, setShowChat] = useState<boolean>(false);

//   const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
//   const [showReactions, setShowReactions] = useState<boolean>(false);
//   const [showYouTubeModal, setShowYouTubeModal] = useState<boolean>(false);
//   const [showFeatureModal, setShowFeatureModal] = useState<boolean>(false);
//   const meeting = useStreamRoom();
//   const recording = useStreamRecording();

//   const handleReactionsToggle = useCallback(() => {
//     setShowReactions(!showReactions);
//     onReactionsToggle?.();
//   }, [showReactions, onReactionsToggle]);

//   // Function to open chat modal (for notifications)
//   const handleOpenChat = useCallback(() => {
//     setShowChat(true);
//     onChatToggle?.();
//   }, [onChatToggle]);

//   // Handle YouTube streaming modal
//   const handleYouTubeModalToggle = useCallback(() => {
//     setShowYouTubeModal(!showYouTubeModal);
//   }, [showYouTubeModal]);

//   // Handle feature modal
//   const handleFeatureModalToggle = useCallback(() => {
//     setShowFeatureModal(!showFeatureModal);
//   }, [showFeatureModal]);

//   // Get formatted messages for notifications
//   const formattedMessages = getFormattedMessages(chatMessages);

//   const handleStartRecording = async () => {
//   await recording.startRecording({
//     quality: 'high',
//     audioTracks: meeting.tracks.microphone,
//     room: meeting.room, // Pass the LiveKit room for direct access
//     watermarks: [
//         {
//           type: "image",
//           content: "/logo.png",
//           position: "top-right",
//           opacity: 0.8,
//           width: 50,
//           height: 50,
//         },
//       ],
//   });
// };

//   return (
//     <BaseCallControls
//       onRaiseHand={onRaiseHand}
//       onReturnToGuest={onReturnToGuest}
//       onDisconnect={onDisconnect}
//       onRecordToggle={onRecordToggle}
//       render={(props: CallControlsRenderProps) => {
//         const {
//           canAccessMediaControls,
//           isGuest,
//           hasPendingRequest,
//           // isRecording,
//           handleDisconnectClick,
//           requestToSpeak,
//           userType,
//           toggleMic,
//           toggleCamera,
//           toggleScreenShare,
//           // toggleRecording,
//           // New raise hand props
//           isHandRaised,
//           canRaiseHand,
//           raiseHand,
//           lowerHand,
//         } = props;

//         return (
//           <>
//             {/* Chat Notification Manager */}
//             <ChatNotificationManager
//               messages={formattedMessages}
//               participants={participants}
//               isChatOpen={showChat}
//               onOpenChat={handleOpenChat}
//             />

//             {/* Modals */}
//             <ShareModal isOpen={showLink} onClose={() => setShowLink(false)} />
//             <ParticipantListModal
//               isOpen={showParticipantList}
//               onClose={() => setShowParticipantList(false)}
//             />
//             <ChatModal
//               isOpen={showChat}
//               onClose={() => setShowChat(false)}
//               participants={participants}
//             />
//             <YouTubeStreamingModal
//               isOpen={showYouTubeModal}
//               onClose={() => setShowYouTubeModal(false)}
//             />
//             <FeatureModal
//               isOpen={showFeatureModal}
//               onClose={() => setShowFeatureModal(false)}
//             />
//             <Reactions showReactions={showReactions} />

//             {/* Mobile Menu Modal */}
//             {showMobileMenu && (
//               <Modal
//                 onClose={() => setShowMobileMenu(false)}
//                 position="bottom"
//                 childClassName="bg-white h-auto w-full rounded-t-3xl shadow-2xl"
//               >
//                 <div className="w-full px-4 pb-8 pt-6">
//                   {/* Modal handle */}
//                   <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-6"></div>

//                   <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
//                     {/* Participants */}
//                     <button
//                       className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//                       onClick={() => {
//                         setShowMobileMenu(false);
//                         setShowParticipantList(true);
//                       }}
//                     >
//                       <div className="relative">
//                         <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
//                           <Icon
//                             name="users"
//                             className="text-[#8b5cf6] w-6 h-6"
//                           />
//                         </div>
//                         <span className="absolute -top-1 -right-1 bg-[#8b5cf6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
//                           {count}
//                         </span>
//                       </div>
//                       <span className="text-xs text-gray-600">
//                         Participants
//                       </span>
//                     </button>

//                     {/* Share Link */}
//                     <button
//                       className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//                       onClick={() => {
//                         setShowMobileMenu(false);
//                         setShowLink(true);
//                       }}
//                     >
//                       <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
//                         <Icon name="link" className="text-[#8b5cf6] w-6 h-6" />
//                       </div>
//                       <span className="text-xs text-gray-600">Share</span>
//                     </button>

//                     {/* Agenda */}
//                     {(userType === "host" ||
//                       (agendas && agendas.length > 0)) && (
//                       <button
//                         className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//                         onClick={() => {
//                           setShowMobileMenu(false);
//                           onAgendaToggle();
//                         }}
//                       >
//                         <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
//                           <TfiAgenda className="text-[#8b5cf6] text-xl" />
//                         </div>
//                         <span className="text-xs text-gray-600">Agenda</span>
//                       </button>
//                     )}

//                     {/* Chat */}
//                     <button
//                       className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//                       onClick={() => {
//                         setShowMobileMenu(false);
//                         handleOpenChat();
//                       }}
//                     >
//                       <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
//                         <Icon name="chat" className="text-[#8b5cf6] w-6 h-6" />
//                       </div>
//                       <span className="text-xs text-gray-600">Chat</span>
//                     </button>

//                     {/* YouTube Streaming - Only for hosts */}

//                     {userType === "host" && (
//                       <button
//                         className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//                         onClick={() => {
//                           setShowMobileMenu(false);
//                           handleYouTubeModalToggle();
//                         }}
//                       >
//                         <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center">
//                           <Icon name="video" className="text-red-500 w-6 h-6" />
//                         </div>
//                         <span className="text-xs text-gray-600">YouTube</span>
//                       </button>
//                     )}

//                     {/* Feature Suggestion */}
//                     <button
//                       className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//                       onClick={() => {
//                         setShowMobileMenu(false);
//                         handleFeatureModalToggle();
//                       }}
//                     >
//                       <div className="w-12 h-12 bg-[#5b21b6]/20 rounded-full flex items-center justify-center">
//                         <FaRegLightbulb className="text-[#8b5cf6] text-xl" />
//                       </div>
//                       <span className="text-xs text-gray-600">Suggest</span>
//                     </button>
//                   </div>
//                 </div>
//               </Modal>
//             )}

//             {/* Main Controls UI */}
//             <div className="w-full px-2 sm:!px-4 py-3">
//               <div className="flex items-center justify-between max-w-7xl mx-auto">
//                 {/* Left Section - Desktop only */}
//                 <div className="hidden lg:!flex items-center gap-3">
//                   {/* Participants Count */}
//                   <Tooltip content="View participants">
//                     <button
//                       className="flex items-center gap-2 h-10 px-3 bg-gray-100 backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200"
//                       onClick={() => setShowParticipantList(true)}
//                     >
//                       <Icon name="users" className="text-[#8b5cf6] w-5 h-5" />
//                       <span className="font-medium text-sm text-gray-700">
//                         {count}
//                       </span>
//                     </button>
//                   </Tooltip>

//                   <button
//                     onClick={
//                       recording.isRecording
//                         ? recording.stopRecording
//                         : handleStartRecording
//                     }
//                   >
//                     {recording.isRecording
//                       ? `Stop Recording (${recording.recordingTime}s)`
//                       : "Start Recording"}
//                   </button>

//                   {/* Share Link */}
//                   <Tooltip content="Share meeting link">
//                     <button
//                       className="flex items-center justify-center w-10 h-10 bg-gray-100 backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200"
//                       onClick={() => setShowLink(true)}
//                     >
//                       <Icon name="link" className="text-[#8b5cf6] w-5 h-5" />
//                     </button>
//                   </Tooltip>

//                   {/* Feature Suggestion */}
//                   <Tooltip content="Suggest a feature">
//                     <button
//                       className="flex items-center justify-center w-10 h-10 bg-gray-100 backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200"
//                       onClick={handleFeatureModalToggle}
//                     >
//                       <FaRegLightbulb className="text-[#8b5cf6] w-5 h-5" />
//                     </button>
//                   </Tooltip>
//                 </div>

//                 {/* Center Section - Main Controls */}
//                 <div className="flex items-center gap-2 mx-auto lg:!mx-0">
//                   {/* Main control pill */}
//                   <div className="flex items-center lg:!gap-x-3 bg-gray-100  gap-x-1.5 backdrop-blur-sm rounded-2xl shadow-lg px-1 py-1">
//                     {/* Raise hand for LIVESTREAMS */}
//                     {streamMetadata?.streamSessionType === "livestream" &&
//                       isGuest &&
//                       !canAccessMediaControls &&
//                       !hasPendingRequest &&
//                       requestToSpeak && (
//                         <button
//                           className="p-3 rounded-xl hover:bg-gray-200 transition-colors relative group"
//                           onClick={requestToSpeak}
//                         >
//                           <Icon
//                             name="hand"
//                             className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors"
//                           />
//                         </button>
//                       )}

//                     {streamMetadata?.streamSessionType === "livestream" &&
//                       isGuest &&
//                       !canAccessMediaControls &&
//                       hasPendingRequest && (
//                         <button className="p-3 rounded-xl bg-green-100 relative">
//                           <Icon
//                             name="hand"
//                             className="text-green-600 w-5 h-5 animate-pulse"
//                           />
//                         </button>
//                       )}

//                     {/* Raise hand for MEETINGS */}
//                     {streamMetadata?.streamSessionType === "meeting" &&
//                       canRaiseHand &&
//                       !isHandRaised &&
//                       raiseHand && (
//                         <button
//                           className="p-3 rounded-xl hover:bg-gray-200 transition-colors relative group"
//                           onClick={raiseHand}
//                           title="Raise hand to speak"
//                         >
//                           <Icon
//                             name="hand"
//                             className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors"
//                           />
//                         </button>
//                       )}

//                     {streamMetadata?.streamSessionType === "meeting" &&
//                       canRaiseHand &&
//                       isHandRaised &&
//                       lowerHand && (
//                         <button
//                           className="p-3 rounded-xl bg-[#8b5cf6]/10 relative"
//                           onClick={lowerHand}
//                           title="Lower hand"
//                         >
//                           <Icon
//                             name="hand"
//                             className="text-[#8b5cf6] w-5 h-5 animate-pulse"
//                           />
//                         </button>
//                       )}

//                     {/* Agenda - Hidden on mobile */}
//                     {(userType === "host" ||
//                       (agendas && agendas.length > 0)) && (
//                       <Tooltip content="Agenda">
//                         <button
//                           className="p-3 rounded-xl hover:bg-gray-200 transition-colors hidden lg:!block group"
//                           onClick={onAgendaToggle}
//                         >
//                           <TfiAgenda className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors" />
//                         </button>
//                       </Tooltip>
//                     )}

//                     {/* Screen share - Hidden on mobile */}
//                     {canAccessMediaControls && toggleScreenShare && (
//                       <div className="hidden lg:!block">
//                         <ScreenShareControl showLabel={false} />
//                       </div>
//                     )}

//                     {/* Microphone */}
//                     {canAccessMediaControls && toggleMic && (
//                       <MicrophoneControl showLabel={false} />
//                     )}

//                     {/* Camera */}
//                     {canAccessMediaControls && toggleCamera && (
//                       <CameraControl
//                         showLabel={false}
//                         onError={(error) =>
//                           console.error("Camera error:", error)
//                         }
//                       />
//                     )}

//                     {/* Reactions */}
//                     <button
//                       className={`p-3 rounded-xl transition-all duration-200 ${
//                         showReactions ? "bg-[#8b5cf6]/10" : "hover:bg-gray-200"
//                       }`}
//                       onClick={handleReactionsToggle}
//                     >
//                       <Icon
//                         name="smiley"
//                         className={`w-5 h-5 ${
//                           showReactions ? "text-yellow-500" : "text-yellow-500"
//                         }`}
//                       />
//                     </button>

//                     {/* Chat - Hidden on mobile */}
//                     <button
//                       className="p-3 rounded-xl hover:bg-gray-200 transition-colors hidden lg:!block group"
//                       onClick={handleOpenChat}
//                     >
//                       <Icon
//                         name="chat"
//                         className="text-gray-600 w-5 h-5 group-hover:text-[#8b5cf6] transition-colors"
//                       />
//                     </button>

//                     {/* Mobile menu button */}
//                     <button
//                       className="p-3 rounded-xl hover:bg-gray-200 transition-colors lg:!hidden"
//                       onClick={() => setShowMobileMenu(true)}
//                     >
//                       <Icon name="more" className="text-gray-600 w-5 h-5" />
//                     </button>
//                   </div>

//                   {/* End call button */}
//                   {handleDisconnectClick && (
//                     <button
//                       className="flex items-center gap-2 px-4 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-2xl shadow-lg transition-all duration-200 group"
//                       onClick={handleDisconnectClick}
//                     >
//                       <Icon
//                         name="phone"
//                         className="w-5 h-5 rotate-135 group-hover:rotate-180 transition-transform"
//                       />
//                       <span className="hidden sm:!block text-sm font-medium">
//                         End
//                       </span>
//                     </button>
//                   )}
//                 </div>

//                 {/* Right Section - Desktop only */}
//                 <div className="hidden lg:!flex items-center gap-3">
//                   {/* YouTube Streaming */}
//                   {userType === "host" && (
//                     <Tooltip content="Stream to YouTube">
//                       <button
//                         className="flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
//                         onClick={handleYouTubeModalToggle}
//                       >
//                         <Icon name="video" className="w-5 h-5" />
//                         <span className="text-sm font-medium">YouTube</span>
//                       </button>
//                     </Tooltip>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </>
//         );
//       }}
//     />
//   );
// };

// export default CallControls;