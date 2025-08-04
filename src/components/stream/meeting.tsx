import { type ReactElement, useMemo, useEffect, useState } from "react";
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
  // Initialize the meeting room with active speaker promotion enabled
  const meeting = useStreamRoom({
    defaultSortStrategy: ParticipantSortStrategy.ROLE_BASED,
    enableSpeakerEvents: true,
    autoPromoteActiveSpeakers: true, // Enable automatic speaker promotion
  });

  // State to track if we should force refresh the view
  const [, setRefreshTrigger] = useState(0);

  // Listen for speaking events to force UI updates
  useEffect(() => {
    const handleSpeakingStarted = () => {
      // Force a re-render when someone starts speaking
      // This ensures the sorted participants list is recalculated
      setRefreshTrigger(prev => prev + 1);
    };

    const handleSpeakingStopped = () => {
      // Force a re-render when someone stops speaking
      setRefreshTrigger(prev => prev + 1);
    };

    meeting.on("speakingStarted", handleSpeakingStarted);
    meeting.on("speakingStopped", handleSpeakingStopped);

    return () => {
      meeting.off("speakingStarted", handleSpeakingStarted);
      meeting.off("speakingStopped", handleSpeakingStopped);
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

  // Get sorted participants with active speaker priority
  const allParticipants = useMemo(() => {
    // When getting sorted participants, active speakers will be automatically prioritized
    return meeting.getSortedParticipants({
      strategy: ParticipantSortStrategy.ROLE_BASED,
      prioritizeActiveSpeakers: true, // Ensure active speakers are prioritized
    });
  }, [meeting, meeting.participants.speaking, meeting.participants.currentActiveSpeaker]);

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

  // Calculate visible participants and overflow
  const maxVisible = getMaxVisibleParticipants();
  
  // Important: Make sure active speakers are included in visible participants
  const visibleParticipants = useMemo(() => {
    const sorted = allParticipants;
    
    // If there's an active speaker in overflow, swap them with a non-speaking participant
    if (activeSpeaker) {
      const activeSpeakerIndex = sorted.findIndex(p => p.identity === activeSpeaker);
      
      // If active speaker is beyond visible range, move them up
      if (activeSpeakerIndex >= maxVisible) {
        // Find the last non-speaking participant in visible range
        for (let i = maxVisible - 1; i >= 0; i--) {
          if (!meeting.isParticipantSpeaking(sorted[i].identity)) {
            // Swap positions
            const temp = sorted[i];
            sorted[i] = sorted[activeSpeakerIndex];
            sorted[activeSpeakerIndex] = temp;
            break;
          }
        }
      }
    }
    
    return sorted.slice(0, maxVisible);
  }, [allParticipants, maxVisible, activeSpeaker, meeting]);
  
  const overflowParticipants = allParticipants.slice(maxVisible);
  const overflowCount = overflowParticipants.length;

  // Get bottom row participants for screen share layout
  const getBottomRowParticipants = (): SDKParticipant[] => {
    if (!meeting.tracks.screenShare) return [];

    const screenSharerIdentity = meeting.tracks.screenShare.participant?.identity;
    const participants: SDKParticipant[] = [];

    // Prioritize active speakers first
    if (activeSpeaker && activeSpeaker !== screenSharerIdentity) {
      const activeSpeakerParticipant = allParticipants.find(p => p.identity === activeSpeaker);
      if (activeSpeakerParticipant) {
        participants.push(activeSpeakerParticipant);
      }
    }

    // Add host if they're not screen sharing and not already added
    if (hostParticipant && 
        hostParticipant.identity !== screenSharerIdentity &&
        hostParticipant.identity !== activeSpeaker) {
      participants.push(hostParticipant);
    }

    // Add other participants
    visibleParticipants.forEach((p) => {
      if (
        p.identity !== screenSharerIdentity &&
        !participants.find((existing) => existing.identity === p.identity)
      ) {
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
            // Parse metadata for avatar info
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

  // Render participant with active speaker highlighting
  const renderParticipant = (
    participant: SDKParticipant,
    track: SDKTrackReference | null
  ): ReactElement | null => {
    if (!participant) return null;

    const isActive = participant.identity === activeSpeaker;
    const isSpeaking = meeting.isParticipantSpeaking(participant.identity);
    const isLocalParticipant = participant.identity === meeting.participants.local?.identity;

    // Get track states
    let isCameraOn = false;
    let isMicrophoneOn = false;

    if (track) {
      isCameraOn = track.publication ? !track.publication.isMuted : false;

      // Check for microphone track
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

    // Check if this is screen share
    const isScreenShare =
      track &&
      (track.source === SDKTrackSource.ScreenShare ||
        track.source === "screen_share");

    const uniqueKey = `${participant.sid}-${track?.source || "no-track"}`;

    return (
      <div key={uniqueKey} className="h-full w-full">
        <div
          className={`relative rounded-lg overflow-hidden bg-gray-900 h-full w-full transition-all duration-300 ${
            isActive 
              ? "ring-4 ring-primary shadow-lg scale-[1.02]" 
              : isSpeaking 
                ? "ring-2 ring-primary/50" 
                : ""
          }`}
        >
          {isScreenShare ? (
            // Screen share view
            <div className="h-full w-full flex items-center justify-center bg-black">
              <VideoTrack
                trackRef={track}
                className="w-full h-full object-contain"
              />
              {/* Screen share label */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 rounded px-3 py-1">
                <span className="text-white text-sm">Screen Share</span>
              </div>
            </div>
          ) : (
            // Regular participant view
            <div className="relative h-full w-full">
              {/* Video track if camera is on */}
              {isCameraOn && track && (
                <div className="absolute inset-0">
                  <VideoTrack
                    trackRef={track}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Participant tile content overlay */}
              <ParticipantTileContent
                participant={participant}
                isLocal={isLocalParticipant}
                isCameraOn={isCameraOn}
                isMicrophoneOn={isMicrophoneOn}
                isSpeaking={isSpeaking}
                isActiveSpeaker={isActive}
              />
            </div>
          )}

          {/* Audio track */}
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
    const totalWithOverflow = participantCount + (overflowCount > 0 ? 1 : 0);

    // MOBILE LAYOUT LOGIC
    if (isMobileView) {
      if (participantCount === 1 && overflowCount === 0) {
        return (
          <div className="h-full w-full">
            {renderParticipantElement(displayedParticipants[0])}
          </div>
        );
      } else if (participantCount === 2 && overflowCount === 0) {
        return (
          <div className="grid grid-rows-2 gap-2 h-full">
            {displayedParticipants.map((participant) => (
              <div key={participant.identity} className="h-full w-full">
                {renderParticipantElement(participant)}
              </div>
            ))}
          </div>
        );
      } else if (participantCount === 3 && overflowCount === 0) {
        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            {displayedParticipants.map((participant) => (
              <div key={participant.identity} className="h-full w-full">
                {renderParticipantElement(participant)}
              </div>
            ))}
          </div>
        );
      } else if (totalWithOverflow === 4) {
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
      } else if (totalWithOverflow === 5) {
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
      } else if (totalWithOverflow === 6) {
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
      } else {
        const maxVisibleItems = 8;
        const visibleParticipants = displayedParticipants.slice(
          0,
          maxVisibleItems
        );

        return (
          <div className="grid grid-rows-3 gap-2 h-full">
            {[0, 1, 2].map((rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2">
                {visibleParticipants
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
                  visibleParticipants.length <= rowIndex * 3 + 2 && (
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
    } else {
      const totalItems = participantCount + (overflowCount > 0 ? 1 : 0);
      const itemsPerRow = Math.ceil(totalItems / 2);
      const firstRowCount = Math.min(itemsPerRow, displayedParticipants.length);
      const firstRowParticipants = displayedParticipants.slice(
        0,
        firstRowCount
      );
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