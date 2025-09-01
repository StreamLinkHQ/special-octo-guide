/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  useStreamContext,
  useTenantContext,
  // useContest,
  // useParticipantList,
} from "@vidbloq/react";
import { StreamProvider } from "../../context";
import { AddonIndicator, AgendaTabs } from "../agenda";
import CallControls from "./call-controls";
import Livestream from "./livestream";
import Meeting from "./meeting";
import RaisedHandCard from "./raised-hand";
import RequestCard, { type GuestRequest } from "./request-card";
import { ParticipantNotifications } from "./participant-notifications";
import { PersistentCallWidget } from "../widget";
// import ContestUI from "./contest";

// Memoize child components to prevent unnecessary re-renders
const MemoizedMeeting = memo(Meeting);
const MemoizedLivestream = memo(Livestream);
const MemoizedCallControls = memo(CallControls);
const MemoizedAddonIndicator = memo(AddonIndicator);
const MemoizedAgendaTabs = memo(AgendaTabs);
const MemoizedParticipantNotifications = memo(ParticipantNotifications);
// const MemoizedContest = memo(Contest);
// const MemoizedContestUI = memo(ContestUI);

const UserView = () => {
  const { streamMetadata, guestRequests, userType, roomName, raisedHands } =
    useStreamContext();

  const { websocket, isConnected } = useTenantContext();

  const [localGuestRequests, setLocalGuestRequests] = useState<GuestRequest[]>(
    []
  );
  const [showAgenda, setShowAgenda] = useState<boolean>(false);
  const [showParticipantList, setShowParticipantList] =
    useState<boolean>(false);

  // const { participants } = useParticipantList();

  // const contest = useContest({
  //   config: {
  //     mode: "pitch",
  //     turnBased: {
  //       enabled: true,
  //       turnDuration: 60,
  //       votingAfterEachTurn: true,
  //     },
  //     features: {
  //       timer: true,
  //       voting: true,
  //       leaderboard: true,
  //     },
  //   },
  // });

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
          <div className="absolute right-10 top-20">
            <div className="mb-2 text-sm text-gray-600 font-medium">
              Raised Hands ({raisedHands.length})
            </div>
            {raisedHands.map((raisedHand) => (
              <RaisedHandCard
                raisedHand={raisedHand}
                key={raisedHand.participantId}
              />
            ))}
          </div>
        )}

        {!showAgenda && (
          <MemoizedAddonIndicator onOpenModal={handleAgendaToggle} />
        )}

        {showAgenda && <MemoizedAgendaTabs closeFunc={handleCloseAgenda} />}

        {/* <MemoizedContestUI contest={contest} /> */}
    </StreamProvider>
  );
};

export default memo(UserView);

// import { useState, useEffect, useRef } from "react";
// import { useStreamContext } from "@vidbloq/react";
// import { StreamProvider } from "../../context";
// import { AddonIndicator, AgendaTabs } from "../agenda";
// import CallControls from "./call-controls";
// import Livestream from "./livestream";
// import Meeting from "./meeting";
// import RaisedHandCard from "./raised-hand";
// import RequestCard, { type GuestRequest } from "./request-card";
// import Contest from "./contest";

// const UserView = () => {
//   const {
//     streamMetadata,
//     guestRequests,
//     userType,
//     websocket,
//     roomName,
//     raisedHands,
//   } = useStreamContext();

//   const [localGuestRequests, setLocalGuestRequests] = useState<GuestRequest[]>(
//     []
//   );
//   const [showAgenda, setShowAgenda] = useState<boolean>(false);
//   const [showParticipantList, setShowParticipantList] =
//     useState<boolean>(false);
//   const processedRequestIds = useRef(new Set<string>());

//   // Track if component is mounted
//   const isMounted = useRef(true);

//   // Set up mount/unmount tracking
//   useEffect(() => {
//     isMounted.current = true;
//     return () => {
//       isMounted.current = false;
//     };
//   }, []);
//   useEffect(() => {
//     // console.log("UserView received guest requests:", guestRequests);

//     if (Array.isArray(guestRequests)) {
//       // Filter out any requests that have been processed locally
//       const filteredRequests = guestRequests.filter(
//         (req) => !processedRequestIds.current.has(req.participantId)
//       );

//       if (isMounted.current) {
//         setLocalGuestRequests(filteredRequests);
//       }
//     }
//   }, [guestRequests]);

//   useEffect(() => {
//     if (!websocket || !roomName) return;

//     // When a guest request update is received, ensure processed requests
//     // are still filtered out
//     const handleGuestRequestsUpdate = (requests: GuestRequest[]) => {
//       // console.log("WebSocket guest requests update received:", requests);

//       if (!Array.isArray(requests) || !isMounted.current) return;

//       // Filter out any requests that have been processed locally
//       const filteredRequests = requests.filter(
//         (req) => !processedRequestIds.current.has(req.participantId)
//       );

//       setLocalGuestRequests(filteredRequests);
//     };

//     // Handle invitation events to ensure we properly track processed requests
//     const handleInviteGuest = (data: {
//       participantId: string;
//       roomName: string;
//     }) => {
//       // console.log("WebSocket invite guest event received:", data);

//       if (data.participantId && data.roomName === roomName) {
//         // Add to processed requests
//         processedRequestIds.current.add(data.participantId);

//         // Update local state
//         setLocalGuestRequests((prev) =>
//           prev.filter((req) => req.participantId !== data.participantId)
//         );
//       }
//     };

//     // Add event listeners
//     websocket.addEventListener(
//       "guestRequestsUpdate",
//       handleGuestRequestsUpdate
//     );
//     websocket.addEventListener("inviteGuest", handleInviteGuest);

//     // Clean up
//     return () => {
//       websocket.removeEventListener(
//         "guestRequestsUpdate",
//         handleGuestRequestsUpdate
//       );
//       websocket.removeEventListener("inviteGuest", handleInviteGuest);
//     };
//   }, [websocket, roomName]);

//   const handleRemoveRequest = (participantId: string) => {
//     // console.log(`Locally removing request for ${participantId}`);

//     // Add to processed requests to prevent it from reappearing
//     processedRequestIds.current.add(participantId);

//     // Update local state
//     setLocalGuestRequests((prev) =>
//       prev.filter((req) => req.participantId !== participantId)
//     );
//   };

//   return (
//     <StreamProvider>
//       {streamMetadata?.streamSessionType === "meeting" ? (
//         <Meeting setShowParticipantList={() => setShowParticipantList(true)} />
//       ) : (
//         <Livestream />
//       )}
//       <div className="w-[90%] lg:w-[80%] mx-auto">
//         <CallControls
//           onAgendaToggle={() => setShowAgenda(true)}
//           showParticipantList={showParticipantList}
//           setShowParticipantList={setShowParticipantList}
//         />
//       </div>
//       {userType === "host" && (
//         <div className="absolute right-10 top-20 rounded">
//           {localGuestRequests.length > 0 &&
//             localGuestRequests.map((request, i) => (
//               <RequestCard
//                 request={request}
//                 key={request.participantId || i}
//                 onRemove={handleRemoveRequest}
//               />
//             ))}
//         </div>
//       )}
//       {streamMetadata.streamSessionType === "meeting" &&
//         raisedHands.length > 0 && (
//           <div className="absolute right-10 top-20">
//             <div className="mb-2 text-sm text-gray-600 font-medium">
//               Raised Hands ({raisedHands.length})
//             </div>
//             {raisedHands.map((raisedHand, i) => (
//               <RaisedHandCard
//                 raisedHand={raisedHand}
//                 key={raisedHand.participantId || i}
//               />
//             ))}
//           </div>
//         )}
//       {!showAgenda && (
//         <AddonIndicator onOpenModal={() => setShowAgenda(true)} />
//       )}
//       {showAgenda && <AgendaTabs closeFunc={() => setShowAgenda(false)} />}
//           <Contest />
//     </StreamProvider>
//   );
// };

// export default UserView;
