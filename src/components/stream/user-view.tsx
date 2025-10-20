/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useStreamContext, useTenantContext, useBalance } from "@vidbloq/react";
import { Wallet } from "lucide-react";
import { ContestConfigProvider, StreamProvider } from "../../context";
import { AddonIndicator, AgendaTabs } from "../agenda";
import CallControls from "./call-controls";

import Livestream from "./livestream";
import { Tooltip } from "../ui";
import Meeting from "./meeting";
import RequestCard, { type GuestRequest } from "./request-card";
import { ParticipantNotifications } from "./participant-notifications";
import { PersistentCallWidget } from "../widget";
import { RaisedHandsToast } from "./raised-hands-toast";
import { RaisedHandsSidebar } from "./raised-hands-sidebar";
import {
  ContestConfigTrigger,
  ContestConfigPanel,
  ContestWrapper,
} from "../contest";
import InStreamWalletModal from "./user-wallet";

// Memoize child components to prevent unnecessary re-renders
const MemoizedMeeting = memo(Meeting);
const MemoizedLivestream = memo(Livestream);
const MemoizedCallControls = memo(CallControls);
const MemoizedAddonIndicator = memo(AddonIndicator);
const MemoizedAgendaTabs = memo(AgendaTabs);
const MemoizedParticipantNotifications = memo(ParticipantNotifications);
// const MemoizedContest = memo(Contest);
// const MemoizedContestUI = memo(ContestUI);
const MemoizedContestWrapper = memo(ContestWrapper);
const MemoizedContestConfigPanel = memo(ContestConfigPanel);

const UserView = () => {
  const { streamMetadata, guestRequests, userType, roomName, raisedHands } =
    useStreamContext();

  const { websocket, isConnected } = useTenantContext();

  const [localGuestRequests, setLocalGuestRequests] = useState<GuestRequest[]>(
    []
  );
  const [showAgenda, setShowAgenda] = useState<boolean>(false);
  const [showRaisedHandsSidebar, setShowRaisedHandsSidebar] =
    useState<boolean>(false);

  const [showParticipantList, setShowParticipantList] =
    useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const { usdcBalance: balance } = useBalance();

  // Simplified tracking - no need for extensive refs
  const processedRequestIds = useRef(new Set<string>());

  // Simplified request filtering
  const filterRequests = useCallback((requests: GuestRequest[]) => {
    if (!Array.isArray(requests)) return [];
    return requests.filter(
      (req) =>
        req?.participantId &&
        !processedRequestIds.current.has(req.participantId)
    );
  }, []);

  // Handle guest requests from props
  useEffect(() => {
    const filtered = filterRequests(guestRequests || []);
    setLocalGuestRequests(filtered);
  }, [guestRequests, filterRequests]);

  // Simplified event handlers
  const handleGuestRequestsUpdate = useCallback(
    (event: any) => {
      const requests = event?.detail || event?.data || event;

      if (!Array.isArray(requests)) {
        console.warn("Invalid guest requests data:", requests);
        return;
      }

      const filtered = filterRequests(requests);
      setLocalGuestRequests(filtered);
    },
    [filterRequests]
  );

  const handleInviteGuest = useCallback(
    (event: any) => {
      const data = event?.detail || event?.data || event;

      if (!data?.participantId) {
        console.warn("Invalid invite guest data:", data);
        return;
      }

      if (data.roomName === roomName) {
        processedRequestIds.current.add(data.participantId);

        setLocalGuestRequests((prev) =>
          prev.filter((req) => req?.participantId !== data.participantId)
        );
      }
    },
    [roomName]
  );

  // Simplified WebSocket connection using singleton
  useEffect(() => {
    if (!websocket || !roomName || !isConnected) {
      return;
    }

    console.log("Setting up WebSocket event listeners");

    websocket.addEventListener(
      "guestRequestsUpdate",
      handleGuestRequestsUpdate
    );
    websocket.addEventListener("inviteGuest", handleInviteGuest);

    return () => {
      console.log("Cleaning up WebSocket event listeners");
      websocket.removeEventListener(
        "guestRequestsUpdate",
        handleGuestRequestsUpdate
      );
      websocket.removeEventListener("inviteGuest", handleInviteGuest);
    };
  }, [
    websocket,
    roomName,
    isConnected,
    handleGuestRequestsUpdate,
    handleInviteGuest,
  ]);

  // Handler for removing requests
  const handleRemoveRequest = useCallback((participantId: string) => {
    if (!participantId) return;

    processedRequestIds.current.add(participantId);
    setLocalGuestRequests((prev) =>
      prev.filter((req) => req?.participantId !== participantId)
    );
  }, []);

  // Memoized callbacks
  const handleShowParticipantList = useCallback(() => {
    setShowParticipantList(true);
  }, []);

  const handleAgendaToggle = useCallback(() => {
    setShowAgenda(true);
  }, []);

  const handleCloseAgenda = useCallback(() => {
    setShowAgenda(false);
  }, []);

  // Memoized computed values
  const isMeeting = streamMetadata?.streamSessionType === "meeting";
  const shouldShowRaisedHands =
    isMeeting && raisedHands && raisedHands.length > 0;
  const shouldShowGuestRequests =
    userType === "host" && localGuestRequests.length > 0;

  const handleWalletToggle = useCallback(() => {
    setShowWalletModal(!showWalletModal);
  }, [showWalletModal]);

  return (
    <StreamProvider>
      <PersistentCallWidget />
      <MemoizedParticipantNotifications />
      {isMeeting ? (
        <MemoizedMeeting setShowParticipantList={handleShowParticipantList} />
      ) : (
        <MemoizedLivestream />
      )}

      <div className="w-[90%] lg:w-[80%] mx-auto">
        <MemoizedCallControls
          onAgendaToggle={handleAgendaToggle}
          showParticipantList={showParticipantList}
          setShowParticipantList={setShowParticipantList}
        />
      </div>

      {shouldShowGuestRequests && (
        <div className="absolute right-10 top-20 rounded">
          {localGuestRequests.map((request) => (
            <RequestCard
              request={request}
              key={request.participantId}
              onRemove={handleRemoveRequest}
            />
          ))}
        </div>
      )}

      {shouldShowRaisedHands && (
        <>
          <RaisedHandsToast
            raisedHands={raisedHands}
            onViewAll={() => setShowRaisedHandsSidebar(true)}
          />

          <RaisedHandsSidebar
            raisedHands={raisedHands}
            isOpen={showRaisedHandsSidebar}
            onClose={() => setShowRaisedHandsSidebar(false)}
          />
        </>
      )}

      {!showAgenda && (
        <MemoizedAddonIndicator onOpenModal={handleAgendaToggle} />
      )}

      {showAgenda && <MemoizedAgendaTabs closeFunc={handleCloseAgenda} />}
      <div className="absolute top-10 right-8">
        <Tooltip content="View wallet">
          <button
            className="flex z-50 items-center gap-2 h-10 px-3 bg-white backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200 "
            onClick={handleWalletToggle}
          >
            <Wallet className="text-[#8b5cf6] w-5 h-5" />
            <span className="font-medium text-sm text-gray-700">
              ${balance.toFixed(2)}
            </span>
          </button>
        </Tooltip>
      </div>

      <InStreamWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      {/* <MemoizedContestUI contest={contest} /> */}
      <ContestConfigProvider>
        {userType === "host" && (
          <div className="">
            <ContestConfigTrigger />
          </div>
        )}

        {/* The panel itself (hidden until triggered) */}
        <MemoizedContestConfigPanel />
        <MemoizedContestWrapper />
      </ContestConfigProvider>
    </StreamProvider>
  );
};

export default memo(UserView);
