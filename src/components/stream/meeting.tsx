import { type ReactElement, useMemo, useEffect, useState, useRef, useCallback } from "react";
import {
  VideoTrack,
  AudioTrack,
  type SDKTrackReference,
  SDKTrackSource,
  type SDKParticipant,
  useStreamRoom,
  ParticipantSortStrategy,
} from "@vidbloq/react";
import ParticipantTileContent from "./participant-tile";

type MeetingViewProps = {
  setShowParticipantList: () => void;
}

export default function MeetingView({ setShowParticipantList }: MeetingViewProps) {
  // Initialize the meeting room with pinning and active speaker promotion enabled
  const meeting = useStreamRoom({
    defaultSortStrategy: ParticipantSortStrategy.ROLE_BASED,
    enableSpeakerEvents: true,
    autoPromoteActiveSpeakers: true,
    enablePinning: true,
  });

  // State to track if we should force refresh the view
  const [, setRefreshTrigger] = useState(0);
  
  // Track the fixed visible participants list
  const [fixedVisibleIdentities, setFixedVisibleIdentities] = useState<string[]>([]);
  
  // Track camera states for all participants
  const [participantCameraStates, setParticipantCameraStates] = useState<Map<string, boolean>>(new Map());
  const prevCameraStatesRef = useRef<Map<string, boolean>>(new Map());

  // Listen for speaking and pinning events to force UI updates
  useEffect(() => {
    const handleSpeakingStarted = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    const handleSpeakingStopped = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    const handlePinChanged = () => {
      // Reset fixed identities when pinning changes to recalculate positions
      setFixedVisibleIdentities([]);
      setRefreshTrigger(prev => prev + 1);
    };

    meeting.on("speakingStarted", handleSpeakingStarted);
    meeting.on("speakingStopped", handleSpeakingStopped);
    meeting.on("participantPinned", handlePinChanged);
    meeting.on("participantUnpinned", handlePinChanged);

    return () => {
      meeting.off("speakingStarted", handleSpeakingStarted);
      meeting.off("speakingStopped", handleSpeakingStopped);
      meeting.off("participantPinned", handlePinChanged);
      meeting.off("participantUnpinned", handlePinChanged);
    };
  }, [meeting]);

  // Determine mobile view
  const isMobileView = meeting.screenSize === "xs" || meeting.screenSize === "sm";

  // Get max visible participants based on screen size
  const getMaxVisibleParticipants = () => {
    if (meeting.screenSize === "xs" || meeting.screenSize === "sm") return 12;
    if (meeting.screenSize === "md") return 4;
    if (meeting.screenSize === "lg") return 5;
    return 5; // xl
  };

  // Get sorted participants with pinning and role-based strategy
  const allParticipants = useMemo(() => {
    return meeting.getSortedParticipants({
      strategy: ParticipantSortStrategy.ROLE_BASED,
      prioritizePinnedParticipants: true, // Prioritize pinned participants
      prioritizeActiveSpeakers: false, // Don't auto-prioritize speakers in the initial sort
    });
  }, [meeting, meeting.participants.all, meeting.participants.pinned, meeting.participants.globallyPinned]);

  // Create stable references for meeting methods
  const getParticipantTracksStable = useCallback((identity: string) => {
    return meeting.getParticipantTracks(identity);
  }, [meeting]);

  // Track camera state changes for all participants
  useEffect(() => {
    const checkCameraStates = () => {
      const newCameraStates = new Map<string, boolean>();
      
      allParticipants.forEach(participant => {
        const tracks = getParticipantTracksStable(participant.identity);
        const cameraTrack = tracks.find(
          t => t.source === SDKTrackSource.Camera || t.source === "camera"
        );
        const isCameraOn = cameraTrack?.publication ? !cameraTrack.publication.isMuted : false;
        newCameraStates.set(participant.identity, isCameraOn);
      });
      
      setParticipantCameraStates(prev => {
        // Only update if the states actually changed
        const hasChanged = newCameraStates.size !== prev.size ||
          Array.from(newCameraStates.entries()).some(([id, state]) => 
            prev.get(id) !== state
          );
        
        return hasChanged ? newCameraStates : prev;
      });
    };

    checkCameraStates();
    
    // Re-check camera states when participants or tracks change
    const interval = setInterval(checkCameraStates, 1000); // Poll every second
    
    return () => clearInterval(interval);
  }, [allParticipants.length, getParticipantTracksStable]);

  // Get current active speaker for highlighting
  const activeSpeaker = meeting.participants.currentActiveSpeaker;

  // Separate host
  const hostParticipant = meeting.participants.host;

  // Get camera tracks for display
  const getCameraTrackForParticipant = (
    participant: SDKParticipant
  ): SDKTrackReference | null => {
    const tracks = meeting.getParticipantTracks(participant.identity);
    return (
      tracks.find(
        (t) => t.source === SDKTrackSource.Camera || t.source === "camera"
      ) || null
    );
  };

  // Calculate visible participants and overflow with stable positioning and pinning support
  const maxVisible = getMaxVisibleParticipants();
  
  const { visibleParticipants, overflowParticipants } = useMemo(() => {
    // Check if any participants are pinned
    const hasPinnedParticipants = meeting.participants.pinned.size > 0 || meeting.participants.globallyPinned.size > 0;
    
    // If we have pinned participants, prioritize them absolutely
    if (hasPinnedParticipants) {
      // Pinned participants always take priority and maintain their order
      const pinnedIdentities = [
        ...Array.from(meeting.participants.globallyPinned), // Global pins first
        ...Array.from(meeting.participants.pinned).filter(id => !meeting.participants.globallyPinned.has(id)) // Then local pins
      ];
      
      // Start with pinned participants
      const visibleIdentities = [...pinnedIdentities];
      
      // Fill remaining slots with non-pinned participants in their sorted order
      allParticipants.forEach(participant => {
        if (visibleIdentities.length >= maxVisible) return;
        if (!pinnedIdentities.includes(participant.identity)) {
          visibleIdentities.push(participant.identity);
        }
      });
      
      // Map identities back to participant objects
      const visible: SDKParticipant[] = [];
      const overflow: SDKParticipant[] = [];
      
      visibleIdentities.slice(0, maxVisible).forEach(identity => {
        const participant = allParticipants.find(p => p.identity === identity);
        if (participant) {
          visible.push(participant);
        }
      });
      
      allParticipants.forEach(participant => {
        if (!visibleIdentities.slice(0, maxVisible).includes(participant.identity)) {
          overflow.push(participant);
        }
      });
      
      return {
        visibleParticipants: visible,
        overflowParticipants: overflow
      };
    }
    
    // No pinned participants - use the stable positioning logic
    // Check if we need to reset the fixed list (participant count changed significantly)
    const shouldResetFixedList = 
      fixedVisibleIdentities.length === 0 || 
      fixedVisibleIdentities.length > maxVisible ||
      (allParticipants.length <= maxVisible && fixedVisibleIdentities.length < allParticipants.length);
    
    if (shouldResetFixedList) {
      const initialVisible = allParticipants.slice(0, maxVisible).map(p => p.identity);
      setFixedVisibleIdentities(initialVisible);
      return {
        visibleParticipants: allParticipants.slice(0, maxVisible),
        overflowParticipants: allParticipants.slice(maxVisible)
      };
    }
    
    // Check for participants who turned on their camera
    const participantsWhoTurnedOnCamera: string[] = [];
    participantCameraStates.forEach((isOn, identity) => {
      const wasOn = prevCameraStatesRef.current.get(identity);
      if (isOn && !wasOn && !fixedVisibleIdentities.includes(identity)) {
        // This participant just turned on their camera and is in overflow
        participantsWhoTurnedOnCamera.push(identity);
      }
    });
    prevCameraStatesRef.current = new Map(participantCameraStates);
    
    // Build the current visible list based on fixed identities
    let currentFixedIdentities = [...fixedVisibleIdentities];
    const currentParticipantIdentities = new Set(allParticipants.map(p => p.identity));
    
    // Remove participants who are no longer in the room
    currentFixedIdentities = currentFixedIdentities.filter(id => 
      currentParticipantIdentities.has(id)
    );
    
    // If we have room and new participants, add them directly to visible
    if (currentFixedIdentities.length < maxVisible) {
      allParticipants.forEach(participant => {
        if (!currentFixedIdentities.includes(participant.identity) && currentFixedIdentities.length < maxVisible) {
          currentFixedIdentities.push(participant.identity);
        }
      });
    }
    
    // Check if active speaker or camera-on participants are in overflow
    const overflowIdentities = allParticipants
      .map(p => p.identity)
      .filter(id => !currentFixedIdentities.includes(id));
    
    const promotionCandidates: string[] = [];
    
    // Priority 1: Active speaker in overflow
    if (activeSpeaker && overflowIdentities.includes(activeSpeaker)) {
      promotionCandidates.push(activeSpeaker);
    }
    
    // Priority 2: Participants who just turned on camera (in order they turned on)
    participantsWhoTurnedOnCamera.forEach(identity => {
      if (!promotionCandidates.includes(identity)) {
        promotionCandidates.push(identity);
      }
    });
    
    // Priority 3: Other speaking participants in overflow
    meeting.participants.speaking.forEach(identity => {
      if (overflowIdentities.includes(identity) && !promotionCandidates.includes(identity)) {
        promotionCandidates.push(identity);
      }
    });
    
    // Promote candidates by replacing non-speaking, camera-off participants
    for (const candidateId of promotionCandidates) {
      if (currentFixedIdentities.length >= maxVisible) {
        // Find a participant to swap out (non-speaking, camera-off, starting from the end)
        let swapIndex = -1;
        for (let i = currentFixedIdentities.length - 1; i >= 0; i--) {
          const id = currentFixedIdentities[i];
          const isSpeaking = meeting.isParticipantSpeaking(id);
          const isCameraOn = participantCameraStates.get(id) || false;
          const isHost = hostParticipant?.identity === id;
          
          // Don't swap out host, speakers, or camera-on participants
          if (!isHost && !isSpeaking && !isCameraOn) {
            swapIndex = i;
            break;
          }
        }
        
        if (swapIndex !== -1) {
          currentFixedIdentities[swapIndex] = candidateId;
        }
      } else {
        // Room in the grid, just add
        currentFixedIdentities.push(candidateId);
      }
    }
    
    // Ensure we don't exceed max visible
    currentFixedIdentities = currentFixedIdentities.slice(0, maxVisible);
    
    // Update the fixed list if it changed
    if (JSON.stringify(currentFixedIdentities) !== JSON.stringify(fixedVisibleIdentities)) {
      setFixedVisibleIdentities(currentFixedIdentities);
    }
    
    // Map identities back to participant objects, maintaining order
    const visible: SDKParticipant[] = [];
    const overflow: SDKParticipant[] = [];
    
    // First, add visible participants in their fixed order
    currentFixedIdentities.forEach(identity => {
      const participant = allParticipants.find(p => p.identity === identity);
      if (participant) {
        visible.push(participant);
      }
    });
    
    // Then add overflow participants
    allParticipants.forEach(participant => {
      if (!currentFixedIdentities.includes(participant.identity)) {
        overflow.push(participant);
      }
    });
    
    return {
      visibleParticipants: visible,
      overflowParticipants: overflow
    };
  }, [
    allParticipants, 
    maxVisible, 
    fixedVisibleIdentities, 
    activeSpeaker, 
    meeting,
    hostParticipant,
    participantCameraStates,
    meeting.participants.pinned,
    meeting.participants.globallyPinned
  ]);
  
  const overflowCount = overflowParticipants.length;

  // Get bottom row participants for screen share layout
  const getBottomRowParticipants = (): SDKParticipant[] => {
    if (!meeting.tracks.screenShare) return [];

    const screenSharerIdentity = meeting.tracks.screenShare.participant?.identity;
    const participants: SDKParticipant[] = [];

    // Use the stable visible participants list
    visibleParticipants.forEach((p) => {
      if (p.identity !== screenSharerIdentity) {
        participants.push(p);
      }
    });

    // Add screen sharer if not already included
    if (
      screenSharerIdentity &&
      !participants.find((p) => p.identity === screenSharerIdentity)
    ) {
      const screenSharer = allParticipants.find(
        (p) => p.identity === screenSharerIdentity
      );
      if (screenSharer) participants.push(screenSharer);
    }

    return participants;
  };

  // Render overflow indicator
  const renderOverflow = (count: number): ReactElement | null => {
    if (count <= 0) return null;

    const displayedAvatars = overflowParticipants.slice(0, 4);

    return (
      <div
        className="flex flex-col items-center justify-center bg-white bg-opacity-10 rounded-lg p-4 h-full w-full cursor-pointer"
        onClick={setShowParticipantList}
      >
        <div className="flex mb-2">
          {displayedAvatars.map((participant, index) => {
            const metadata = participant.metadata
              ? JSON.parse(participant.metadata)
              : {};
            const avatarUrl = metadata.avatarUrl || "";
            const userName = metadata.userName || participant.identity;
            const initials = userName
              .split(" ")
              .map((name: string) => name[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const colors = [
              "bg-blue-400",
              "bg-red-400",
              "bg-green-400",
              "bg-primary",
            ];

            return (
              <div
                key={participant.identity || `overflow-${index}`}
                className={`w-8 h-8 rounded-full ${
                  colors[index % colors.length]
                } ${
                  index > 0 ? "-ml-1" : ""
                } flex items-center justify-center text-xs text-white overflow-hidden`}
                style={{ zIndex: 10 - index }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={initials}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            );
          })}
        </div>
        <p className="text-gray-400 text-sm">People on the call</p>
        <div className="mt-2 px-4 py-1 bg-white bg-opacity-10 rounded-full">
          <span className="text-gray-200">+{count}</span>
        </div>
      </div>
    );
  };

  // Render participant with active speaker highlighting and pin support
  const renderParticipant = (
    participant: SDKParticipant,
    track: SDKTrackReference | null
  ): ReactElement | null => {
    if (!participant) return null;

    const isActive = participant.identity === activeSpeaker;
    const isSpeaking = meeting.isParticipantSpeaking(participant.identity);
    const isLocalParticipant = participant.identity === meeting.participants.local?.identity;
    const isPinned = meeting.isParticipantPinned(participant.identity);
    const isGloballyPinned = meeting.isParticipantGloballyPinned(participant.identity);
    const canPinGlobally = meeting.canPinGlobally();

    // Get track states
    let isCameraOn = false;
    let isMicrophoneOn = false;

    if (track) {
      isCameraOn = track.publication ? !track.publication.isMuted : false;

      const micTrack = meeting
        .getParticipantTracks(participant.identity)
        .find(
          (t) =>
            t.source === SDKTrackSource.Microphone || t.source === "microphone"
        );

      isMicrophoneOn = micTrack?.publication
        ? !micTrack.publication.isMuted
        : false;
    }

    const isScreenShare =
      track &&
      (track.source === SDKTrackSource.ScreenShare ||
        track.source === "screen_share");

    const uniqueKey = `${participant.sid}-${track?.source || "no-track"}`;

    const handlePinClick = (isGlobal: boolean) => {
      if (isGlobal && isGloballyPinned) {
        meeting.unpinParticipant(participant.identity, true);
      } else if (!isGlobal && isPinned && !isGloballyPinned) {
        meeting.unpinParticipant(participant.identity, false);
      } else {
        meeting.pinParticipant(participant.identity, isGlobal);
      }
    };

    return (
      <div key={uniqueKey} className="h-full w-full">
        <div
          className={`relative rounded-lg overflow-hidden bg-gray-900 h-full w-full transition-all duration-300 ${
            isGloballyPinned
              ? "ring-4 ring-yellow-500 shadow-lg"
              : isPinned
                ? "ring-4 ring-blue-500 shadow-lg"
                : isActive 
                  ? "ring-4 ring-primary shadow-lg scale-[1.02]" 
                  : isSpeaking 
                    ? "ring-2 ring-primary/50" 
                    : ""
          }`}
        >
          {isScreenShare ? (
            <div className="h-full w-full flex items-center justify-center bg-black">
              <VideoTrack
                trackRef={track}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 rounded px-3 py-1">
                <span className="text-white text-sm">Screen Share</span>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full">
              {isCameraOn && track && (
                <div className="absolute inset-0">
                  <VideoTrack
                    trackRef={track}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <ParticipantTileContent
                participant={participant}
                isLocal={isLocalParticipant}
                isCameraOn={isCameraOn}
                isMicrophoneOn={isMicrophoneOn}
                isSpeaking={isSpeaking}
                isActiveSpeaker={isActive}
                isPinned={isPinned}
                isGloballyPinned={isGloballyPinned}
                canPinGlobally={canPinGlobally}
                onPinClick={handlePinClick}
              />
            </div>
          )}

          {track && (track.publication?.track || track.track) && (
            <AudioTrack trackRef={track} />
          )}
        </div>
      </div>
    );
  };

  // Render participant element wrapper
  const renderParticipantElement = (
    participant: SDKParticipant | null,
    track?: SDKTrackReference | null
  ) => {
    if (!participant) {
      return (
        <div className="h-full w-full bg-gray-900 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">No video</span>
        </div>
      );
    }

    const cameraTrack = track || getCameraTrackForParticipant(participant);
    const key = participant.identity || participant.sid || Math.random().toString();

    return (
      <div key={key} className="h-full w-full">
        {renderParticipant(participant, cameraTrack)}
      </div>
    );
  };

  // Render participant grid
  const renderParticipantGrid = () => {
    const displayedParticipants = visibleParticipants;

    if (displayedParticipants.length === 0) {
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          No participants
        </div>
      );
    }

    const participantCount = displayedParticipants.length;
    // Only add overflow tile if there are actually overflow participants
    const totalWithOverflow = participantCount + (overflowCount > 0 ? 1 : 0);

    // MOBILE LAYOUT LOGIC
    if (isMobileView) {
      // Single participant - full screen
      if (participantCount === 1 && overflowCount === 0) {
        return (
          <div className="h-full w-full">
            {renderParticipantElement(displayedParticipants[0])}
          </div>
        );
      } 
      // Two participants - split screen
      else if (participantCount === 2 && overflowCount === 0) {
        return (
          <div className="grid grid-rows-2 gap-2 h-full">
            {displayedParticipants.map((participant) => (
              <div key={participant.identity} className="h-full w-full">
                {renderParticipantElement(participant)}
              </div>
            ))}
          </div>
        );
      } 
      // Three participants - 3 rows
      else if (participantCount === 3 && overflowCount === 0) {
        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            {displayedParticipants.map((participant) => (
              <div key={participant.identity} className="h-full w-full">
                {renderParticipantElement(participant)}
              </div>
            ))}
          </div>
        );
      } 
      // Four items total (including overflow if present)
      else if (totalWithOverflow === 4) {
        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            <div className="relative overflow-hidden">
              {renderParticipantElement(displayedParticipants[0])}
            </div>

            <div className="relative overflow-hidden">
              {renderParticipantElement(displayedParticipants[1])}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {displayedParticipants.slice(2).map((participant) => (
                <div
                  key={participant.identity}
                  className="relative overflow-hidden"
                >
                  {renderParticipantElement(participant)}
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="relative overflow-hidden">
                  {renderOverflow(overflowCount)}
                </div>
              )}
            </div>
          </div>
        );
      } 
      // Five items total
      else if (totalWithOverflow === 5) {
        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            <div className="relative overflow-hidden">
              {renderParticipantElement(displayedParticipants[0])}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {displayedParticipants.slice(1, 3).map((participant) => (
                <div
                  key={participant.identity}
                  className="relative overflow-hidden"
                >
                  {renderParticipantElement(participant)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {displayedParticipants.slice(3).map((participant) => (
                <div
                  key={participant.identity}
                  className="relative overflow-hidden"
                >
                  {renderParticipantElement(participant)}
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="relative overflow-hidden">
                  {renderOverflow(overflowCount)}
                </div>
              )}
            </div>
          </div>
        );
      } 
      // Six items total
      else if (totalWithOverflow === 6) {
        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            {[0, 1, 2].map((rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-2 gap-2">
                {displayedParticipants
                  .slice(rowIndex * 2, rowIndex * 2 + 2)
                  .map((participant) => (
                    <div
                      key={participant.identity}
                      className="relative overflow-hidden"
                    >
                      {renderParticipantElement(participant)}
                    </div>
                  ))}
                {rowIndex === 2 &&
                  overflowCount > 0 &&
                  displayedParticipants.length <= 5 && (
                    <div className="relative overflow-hidden">
                      {renderOverflow(overflowCount)}
                    </div>
                  )}
              </div>
            ))}
          </div>
        );
      } 
      // More than 6 - use 3x3 grid
      else {
        const maxVisibleItems = overflowCount > 0 ? 8 : 9;
        const visibleItems = displayedParticipants.slice(0, maxVisibleItems);

        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            {[0, 1, 2].map((rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2">
                {visibleItems
                  .slice(rowIndex * 3, rowIndex * 3 + 3)
                  .map((participant) => (
                    <div
                      key={participant.identity}
                      className="relative overflow-hidden"
                    >
                      {renderParticipantElement(participant)}
                    </div>
                  ))}
                {rowIndex === 2 &&
                  overflowCount > 0 &&
                  visibleItems.length <= rowIndex * 3 + 2 && (
                    <div className="relative overflow-hidden">
                      {renderOverflow(overflowCount)}
                    </div>
                  )}
              </div>
            ))}
          </div>
        );
      }
    }

    // DESKTOP LAYOUT LOGIC
    if (participantCount === 1 && overflowCount === 0) {
      return (
        <div className="h-full w-full relative overflow-hidden">
          {renderParticipantElement(displayedParticipants[0])}
        </div>
      );
    } else if (participantCount === 2 && overflowCount === 0) {
      return (
        <div className="flex gap-2 h-full">
          {displayedParticipants.map((participant) => (
            <div key={participant.identity} className="flex-1 h-full">
              {renderParticipantElement(participant)}
            </div>
          ))}
        </div>
      );
    } else if (participantCount === 3 && overflowCount === 0) {
      return (
        <div className="grid grid-cols-3 gap-2 h-full">
          {displayedParticipants.map((participant) => (
            <div key={participant.identity} className="col-span-1 h-full">
              {renderParticipantElement(participant)}
            </div>
          ))}
        </div>
      );
    } else if (participantCount === 4 && overflowCount === 0) {
      return (
        <div className="grid grid-cols-4 gap-2 h-full">
          {displayedParticipants.map((participant) => (
            <div key={participant.identity} className="col-span-1 h-full">
              {renderParticipantElement(participant)}
            </div>
          ))}
        </div>
      );
    } else if (participantCount === 5 && overflowCount === 0) {
      // 5 participants - show all 5 in one row
      return (
        <div className="grid grid-cols-5 gap-2 h-full">
          {displayedParticipants.map((participant) => (
            <div key={participant.identity} className="col-span-1 h-full">
              {renderParticipantElement(participant)}
            </div>
          ))}
        </div>
      );
    } else {
      // More than 5 or has overflow - use 2-row layout
      const totalItems = participantCount + (overflowCount > 0 ? 1 : 0);
      const itemsPerRow = Math.ceil(totalItems / 2);
      const firstRowCount = Math.min(itemsPerRow, displayedParticipants.length);
      const firstRowParticipants = displayedParticipants.slice(0, firstRowCount);
      const secondRowParticipants = displayedParticipants.slice(firstRowCount);

      return (
        <div className="flex flex-col h-full gap-2">
          <div className="flex gap-2 h-1/2">
            {firstRowParticipants.map((participant) => (
              <div key={participant.identity} className="flex-1 h-full">
                {renderParticipantElement(participant)}
              </div>
            ))}
          </div>
          <div className="flex gap-2 h-1/2">
            {secondRowParticipants.map((participant) => (
              <div key={participant.identity} className="flex-1 h-full">
                {renderParticipantElement(participant)}
              </div>
            ))}
            {overflowCount > 0 && (
              <div className="flex-1 h-full">
                {renderOverflow(overflowCount)}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full bg-[var(--sdk-bg-primary-color)] p-2">
      {meeting.tracks.screenShare ? (
        // Screen sharing layout
        isMobileView ? (
          // Mobile screen sharing layout
          <div className="flex flex-col gap-2 h-full">
            <div className="h-1/2">
              {renderParticipantElement(
                meeting.tracks.screenShare.participant,
                meeting.tracks.screenShare
              )}
            </div>

            <div className="h-1/2">
              <div className="flex gap-2 h-full">
                {getBottomRowParticipants()
                  .slice(0, 2)
                  .map((participant) => (
                    <div key={participant.identity} className="flex-1 h-full">
                      {renderParticipantElement(participant)}
                    </div>
                  ))}
                {(getBottomRowParticipants().length > 2 ||
                  overflowCount > 0) && (
                  <div className="flex-1 h-full">
                    {renderOverflow(
                      getBottomRowParticipants().length > 2
                        ? getBottomRowParticipants().length - 2 + overflowCount
                        : overflowCount
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Desktop screen sharing layout
          <div className="flex h-full gap-2">
            <div className="w-8/12 h-full overflow-hidden">
              {renderParticipantElement(
                meeting.tracks.screenShare.participant,
                meeting.tracks.screenShare
              )}
            </div>
            <div className="w-4/12 h-full">
              {getBottomRowParticipants().length > 4 ? (
                <div className="grid grid-cols-2 gap-2 h-full">
                  {getBottomRowParticipants().map((participant) => (
                    <div
                      key={participant.identity}
                      className="relative overflow-hidden"
                    >
                      {renderParticipantElement(participant)}
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <div className="relative overflow-hidden">
                      {renderOverflow(overflowCount)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 h-full">
                  {getBottomRowParticipants().map((participant) => (
                    <div
                      key={participant.identity}
                      className="flex-1 overflow-hidden"
                    >
                      {renderParticipantElement(participant)}
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <div className="flex-1 overflow-hidden">
                      {renderOverflow(overflowCount)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        // No screen share - use the grid layout
        renderParticipantGrid()
      )}
    </div>
  );
}

