/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ReactElement, useMemo, useEffect, useState } from "react";
import {
  VideoTrack,
  AudioTrack,
  type SDKTrackReference,
  SDKTrackSource,
  type SDKParticipant,
  useStreamRoom,
  useParticipantControls,
  useParticipantData,
  ParticipantSortStrategy,
  type Participant,
} from "@vidbloq/react";

import { SendModal } from "../modals";

export default function MeetingView() {
  const meeting = useStreamRoom({
    defaultSortStrategy: ParticipantSortStrategy.ROLE_BASED,
    enableSpeakerEvents: true,
  });

  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  // Listen for speaking events to highlight active speaker
  useEffect(() => {
    const handleSpeakingStarted = (event: { participant: SDKParticipant }) => {
      setActiveSpeaker(event.participant.identity);
    };

    const handleSpeakingStopped = () => {
      // Could implement logic to find next active speaker or clear
      setTimeout(() => {
        if (meeting.participants.speaking.size === 0) {
          setActiveSpeaker(null);
        }
      }, 1000);
    };

    meeting.on("speakingStarted", handleSpeakingStarted);
    meeting.on("speakingStopped", handleSpeakingStopped);

    return () => {
      meeting.off("speakingStarted", handleSpeakingStarted);
      meeting.off("speakingStopped", handleSpeakingStopped);
    };
  }, [meeting]);

  // Determine mobile view
  const isMobileView =
    meeting.screenSize === "xs" || meeting.screenSize === "sm";

  // Get max visible participants based on screen size
  const getMaxVisibleParticipants = () => {
    if (meeting.screenSize === "xs" || meeting.screenSize === "sm") return 12;
    if (meeting.screenSize === "md") return 3;
    if (meeting.screenSize === "lg") return 3;
    return 3; // xl
  };

  // Get sorted participants with host/co-host roles
  const allParticipants = useMemo(() => {
    return meeting.getSortedParticipants({
      strategy: ParticipantSortStrategy.ROLE_BASED,
      includeRoles: ["host", "co-host"],
    });
  }, [meeting]);

  // Separate host and co-hosts
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
  const visibleParticipants = allParticipants.slice(0, maxVisible);
  const overflowParticipants = allParticipants.slice(maxVisible);
  const overflowCount = overflowParticipants.length;

  // Get participant metadata helper
  const getParticipantMetadata = (participant: SDKParticipant) => {
    const metadata = participant.metadata
      ? JSON.parse(participant.metadata)
      : {};

    return {
      userName: metadata.userName || participant.identity,
      avatarUrl: metadata.avatarUrl || "",
      initials: (metadata.userName || participant.identity || "")
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
  };

  // Determine layout type
  const calculateLayoutType = () => {
    if (meeting.tracks.screenShare) {
      return "screenshare";
    }

    if (allParticipants.length === 1) {
      return "single-participant";
    }

    if (allParticipants.length === 2) {
      return "two-participants";
    }

    return "multi-participant";
  };

  const layoutType = calculateLayoutType();

  // Get bottom row participants for screen share layout
  const getBottomRowParticipants = (): SDKParticipant[] => {
    if (!meeting.tracks.screenShare) return [];

    const screenSharerIdentity =
      meeting.tracks.screenShare.participant?.identity;
    const participants: SDKParticipant[] = [];

    // Add host first if they're not screen sharing
    if (hostParticipant && hostParticipant.identity !== screenSharerIdentity) {
      participants.push(hostParticipant);
    }

    // Add visible co-hosts who aren't screen sharing
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
        onClick={() => alert("clicked")}
      >
        <div className="flex mb-2">
          {displayedAvatars.map((participant, index) => {
            const { avatarUrl, initials } = getParticipantMetadata(participant);
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

  // Render participant
  const renderParticipant = (
    participant: SDKParticipant,
    track: SDKTrackReference | null
  ): ReactElement | null => {
    if (!participant) return null;

    const isActive = participant.identity === activeSpeaker;
    const isLocalParticipant =
      participant.identity === meeting.participants.local?.identity;

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
          className={`relative rounded-lg overflow-hidden bg-red-900 h-full w-full ${
            isActive ? "ring-2 ring-primary" : ""
          }`}
        >
          {isScreenShare ? (
            // Screen share view
            <div className="h-full w-full flex items-center justify-center">
              <VideoTrack
                trackRef={track}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              {isCameraOn && track ? (
                // Camera on
                <div className="relative w-full h-full">
                  <div className="absolute inset-0">
                    <VideoTrack
                      trackRef={track}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute inset-0">
                    <ParticipantTileContent
                      participant={participant}
                      isLocal={isLocalParticipant}
                      isCameraOn={isCameraOn}
                      isMicrophoneOn={isMicrophoneOn}
                    />
                  </div>
                </div>
              ) : (
                // Camera off
                <ParticipantTileContent
                  participant={participant}
                  isLocal={isLocalParticipant}
                  isCameraOn={isCameraOn}
                  isMicrophoneOn={isMicrophoneOn}
                />
              )}
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
    const key =
      participant.identity || participant.sid || Math.random().toString();

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

const ParticipantTileContent: React.FC<{
  participant: SDKParticipant;
  isLocal: boolean;
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  onGiftSuccess?: (participant: SDKParticipant) => void;
}> = ({ participant, isLocal, isCameraOn, isMicrophoneOn, onGiftSuccess }) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden">
              {participantData.avatarUrl ? (
                <img
                  src={participantData.avatarUrl}
                  alt={participantData.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-semibold">
                  {participantData.initials}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User info - compact width based on content */}
      <div className="absolute bottom-1 left-1 z-10">
        <div className="bg-black bg-opacity-50 rounded px-2 py-1 inline-flex items-center space-x-2 max-w-max">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex-shrink-0">
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
            className="text-white text-xs sm:text-sm whitespace-nowrap max-w-[120px] sm:max-w-[160px] truncate"
            title={participantData.userName}
          >
            {participantData.userName}
          </span>
        </div>
      </div>

      {/* Side controls for desktop */}
      <div className="hidden sm:!block absolute top-1 right-1 z-10">
        <div className="flex flex-col items-end gap-y-1">
          {/* Gift and demote controls */}
          {(controls.canGift || controls.canDemote) && (
            <div className="flex flex-col gap-y-1">
              {controls.canGift && (
                <button
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-light transition-colors"
                  onClick={handleGiftClick}
                >
                  <svg
                    className="w-4 h-4 text-white"
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

              {controls.canDemote && (
                <button
                  className={`w-8 h-8 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors ${
                    controls.isDemoting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={controls.isDemoting ? undefined : handleDemoteClick}
                  disabled={controls.isDemoting}
                >
                  <svg
                    className="w-4 h-4 text-white"
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
            </div>
          )}

          {/* Audio/Video status indicators */}
          <div className="flex flex-col gap-y-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                controls.micEnabled ? "bg-primary" : "bg-gray-500 bg-opacity-60"
              }`}
            >
              <svg
                className="w-4 h-4 text-white"
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
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                controls.cameraEnabled
                  ? "bg-primary"
                  : "bg-gray-500 bg-opacity-60"
              }`}
            >
              <svg
                className="w-4 h-4 text-white"
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
      </div>

      {/* Mobile controls with hamburger menu */}
      <div className="sm:hidden absolute top-1 right-1 z-10">
        <div className="relative">
          {/* Hamburger menu button */}
          <button
            className="w-8 h-8 rounded-full bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showMobileMenu && (
            <div className="absolute top-full right-0 mt-1 bg-black bg-opacity-80 rounded-lg p-2 min-w-max">
              <div className="flex flex-col gap-2">
                {/* Gift and demote controls */}
                {controls.canGift && (
                  <button
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-light"
                    onClick={() => {
                      handleGiftClick();
                      setShowMobileMenu(false);
                    }}
                  >
                    <svg
                      className="w-4 h-4 text-white"
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

                {controls.canDemote && (
                  <button
                    className={`w-8 h-8 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 ${
                      controls.isDemoting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!controls.isDemoting) {
                        handleDemoteClick();
                        setShowMobileMenu(false);
                      }
                    }}
                    disabled={controls.isDemoting}
                  >
                    <svg
                      className="w-4 h-4 text-white"
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

                {/* Audio/Video status indicators */}
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex flex-col gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        controls.micEnabled
                          ? "bg-primary"
                          : "bg-gray-500 bg-opacity-60"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-white"
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
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        controls.cameraEnabled
                          ? "bg-primary"
                          : "bg-gray-500 bg-opacity-60"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-white"
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && selectedRecipient && (
        <SendModal
          selectedUser={selectedRecipient}
          closeFunc={() => {
            setShowSendModal(false);
            setSelectedRecipient(null);
          }}
        />
      )}
    </>
  );
};
