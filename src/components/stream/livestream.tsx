/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ReactElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  VideoTrack,
  AudioTrack,
  type SDKTrackReference,
  SDKTrackSource,
  useStreamRoom,
  ParticipantSortStrategy,
  type SDKParticipant,
} from "@vidbloq/react";
import ParticipantTileContent from "./participant-tile";

export default function LivestreamView() {
  const meeting = useStreamRoom({
    defaultSortStrategy: ParticipantSortStrategy.ROLE_BASED,
    enableSpeakerEvents: true,
  });

  // State for active speaker
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  // Listen for speaking events
  useEffect(() => {
    const handleSpeakingStarted = (event: any) => {
      setActiveSpeaker(event.participant.identity);
    };

    const handleSpeakingStopped = (event: any) => {
      setTimeout(() => {
        setActiveSpeaker((prev) => {
          if (prev === event.participant.identity) {
            const nextSpeaker = Array.from(meeting.participants.speaking)[0];
            return nextSpeaker || null;
          }
          return prev;
        });
      }, 1000);
    };

    meeting.on("speakingStarted", handleSpeakingStarted);
    meeting.on("speakingStopped", handleSpeakingStopped);

    return () => {
      meeting.off("speakingStarted", handleSpeakingStarted);
      meeting.off("speakingStopped", handleSpeakingStopped);
    };
  }, [meeting]);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Get participants for livestream layout
  const hostParticipants = useMemo(
    () => meeting.getSortedParticipants({ includeRoles: ["host"] }),
    [meeting]
  );

  const coHostParticipants = useMemo(
    () => meeting.getSortedParticipants({ includeRoles: ["co-host"] }),
    [meeting]
  );

  const tempHostParticipants = useMemo(
    () => meeting.getSortedParticipants({ includeRoles: ["temp-host"] }),
    [meeting]
  );

  // Determine main content and sidebar content
  const screenShareTrack = meeting.tracks.screenShare;
  const screenSharerIdentity = screenShareTrack?.participant?.identity || null;

  const mainContent = useMemo(() => {
    if (screenShareTrack) {
      return screenShareTrack.participant;
    }
    return hostParticipants[0] || null;
  }, [screenShareTrack, hostParticipants]);

  const sidebarContent = useMemo(() => {
    const allEligible = [
      ...hostParticipants,
      ...coHostParticipants,
      ...tempHostParticipants,
    ];

    if (screenShareTrack) {
      // When screen sharing, show all hosts/co-hosts except the screen sharer
      return allEligible.filter((p) => p.identity !== screenSharerIdentity);
    } else {
      // Regular mode - show co-hosts and temp-hosts (up to 3)
      return [...coHostParticipants, ...tempHostParticipants].slice(0, 3);
    }
  }, [
    hostParticipants,
    coHostParticipants,
    tempHostParticipants,
    screenShareTrack,
    screenSharerIdentity,
  ]);

  // Get tracks for a participant
  const getParticipantTrack = useCallback(
    (
      participant: SDKParticipant | null,
      type: "camera" | "screen" = "camera"
    ): SDKTrackReference | null => {
      if (!participant) return null;

      const tracks = meeting.getParticipantTracks(participant.identity);

      if (type === "screen") {
        return (
          tracks.find(
            (t) =>
              t.source === SDKTrackSource.ScreenShare ||
              t.source === "screen_share"
          ) || null
        );
      }

      return (
        tracks.find(
          (t) => t.source === SDKTrackSource.Camera || t.source === "camera"
        ) || null
      );
    },
    [meeting]
  );

  // Get participant metadata helper
  const getParticipantMetadata = useCallback(
    (participant: SDKParticipant) => {
      const metadata = participant.metadata
        ? JSON.parse(participant.metadata)
        : {};

      return {
        userName: metadata.userName || participant.identity,
        avatarUrl: metadata.avatarUrl || "",
        userType:
          metadata.userType || meeting.getParticipantRole(participant.identity),
        initials: (metadata.userName || participant.identity || "")
          .split(" ")
          .map((name: string) => name[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      };
    },
    [meeting]
  );

  const renderParticipant = useCallback(
    (
      participant: SDKParticipant | null,
      track: SDKTrackReference | null,
      size: "large" | "small" | "mobile" = "large"
    ): ReactElement | null => {
      if (!participant || !track) return null;

      const metadata = getParticipantMetadata(participant);
      const isCameraOn = track.publication && !track.publication.isMuted;
      const isMicrophoneOn = meeting
        .getParticipantTracks(participant.identity)
        .some(
          (t) =>
            (t.source === SDKTrackSource.Microphone ||
              t.source === "microphone") &&
            t.publication &&
            !t.publication.isMuted
        );

      const isScreenShare =
        track.source === SDKTrackSource.ScreenShare ||
        track.source === "screen_share";
      const isActive = participant.identity === activeSpeaker;
      const isLocalParticipant =
        participant.identity === meeting.participants.local?.identity;

      const uniqueKey = `${participant.sid}-${track.source}-${size}`;

      // Responsive container classes
      const containerClasses = `relative rounded-lg overflow-hidden bg-purple-900 h-full w-full ${
        isActive ? "ring-2 ring-blue-500" : ""
      }`;

      // Responsive max-height styles
      const getMaxHeightStyle = () => {
        if (size === "mobile") {
          return { maxHeight: "150px" };
        } else if (size === "small") {
          return { maxHeight: isMobile ? "120px" : "200px" };
        } else {
          return {
            maxHeight: isMobile
              ? "50vh"
              : isTablet
              ? "60vh"
              : "calc(100vh - 160px)",
          };
        }
      };

      return (
        <div key={uniqueKey} className={containerClasses}>
          {isScreenShare ? (
            track.publication && !track.publication.isMuted ? (
              <div
                className="relative h-full w-full"
                style={getMaxHeightStyle()}
              >
                <VideoTrack
                  trackRef={track}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              {isCameraOn ? (
                <div
                  className="relative w-full h-full"
                  style={getMaxHeightStyle()}
                >
                  <VideoTrack
                    trackRef={track}
                    className="w-full h-full object-cover"
                  />

                  <ParticipantTileContent
                    participant={participant}
                    isLocal={isLocalParticipant}
                    isCameraOn={isCameraOn}
                    isMicrophoneOn={isMicrophoneOn}
                  />
                </div>
              ) : (
                <ParticipantTileContent
                  participant={participant}
                  isLocal={isLocalParticipant}
                  isCameraOn={isCameraOn ?? false}
                  isMicrophoneOn={isMicrophoneOn}
                />
              )}
            </div>
          )}

          {track.publication?.track && <AudioTrack trackRef={track} />}

          {/* User type badge */}
          <div
            className={`absolute ${
              isMobile
                ? "top-1 left-1 px-1 py-0.5 text-xs"
                : "top-2 left-2 px-2 py-1 text-xs"
            } rounded-md text-white ${
              metadata.userType === "host"
                ? "bg-purple-700"
                : metadata.userType === "co-host"
                ? "bg-purple-700"
                : metadata.userType === "temp-host"
                ? "bg-purple-700"
                : "bg-purple-700"
            } z-10`}
          >
            {metadata.userType === "host"
              ? "Host"
              : metadata.userType === "co-host"
              ? "Co-Host"
              : metadata.userType === "temp-host"
              ? "Temp-Host"
              : "Guest"}
          </div>
        </div>
      );
    },
    [meeting, activeSpeaker, isMobile, isTablet, getParticipantMetadata]
  );

  // Check if this is window share (special handling)
  const isWindowShare =
    screenShareTrack && !screenShareTrack.publication?.dimensions?.width;

  return (
    <div className={`w-full h-full`}>
      {screenShareTrack ? (
        // SCREEN SHARING LAYOUT
        <div className="h-full flex flex-col lg:flex-row">
          {/* Main content - screen share */}
          <div
            className={`h-full relative ${
              isDesktop && sidebarContent.length > 0 && !isWindowShare
                ? "flex-1"
                : "w-full"
            }`}
          >
            <div className="w-full h-full">
              {mainContent &&
                renderParticipant(
                  mainContent,
                  getParticipantTrack(mainContent, "screen"),
                  "large"
                )}

              {/* Camera view of screen sharer */}
              {screenSharerIdentity && (
                <div
                  className={`absolute z-10 ${
                    isMobile
                      ? "right-2 bottom-2 w-24 h-16"
                      : isTablet
                      ? "left-3 bottom-3 w-48 h-28"
                      : "left-4 bottom-4 w-64 h-36"
                  }`}
                >
                  {(() => {
                    const screenSharer = meeting.participants.all.find(
                      (p) => p.identity === screenSharerIdentity
                    );
                    const cameraTrack = screenSharer
                      ? getParticipantTrack(screenSharer, "camera")
                      : null;
                    return (
                      screenSharer &&
                      cameraTrack &&
                      renderParticipant(
                        screenSharer,
                        cameraTrack,
                        isMobile ? "mobile" : "small"
                      )
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Responsive handling */}
          {sidebarContent.length > 0 && !isWindowShare && (
            <>
              {/* Desktop sidebar */}
              {isDesktop && (
                <div className="w-80 ml-3 h-full">
                  <div className="flex flex-col gap-3 h-full">
                    {sidebarContent.map((participant, index) => {
                      const track = getParticipantTrack(participant, "camera");
                      return (
                        track && (
                          <div key={`sidebar-${index}`} className="h-32">
                            {renderParticipant(participant, track, "small")}
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tablet/Mobile - Horizontal scroll for participants */}
              {!isDesktop && (
                <div className="w-full px-2 py-2 bg-purple-950/50">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {sidebarContent.map((participant, index) => {
                      const track = getParticipantTrack(participant, "camera");
                      return (
                        track && (
                          <div
                            key={`sidebar-${index}`}
                            className={`flex-shrink-0 ${
                              isMobile ? "w-20 h-20" : "w-32 h-24"
                            }`}
                          >
                            {renderParticipant(
                              participant,
                              track,
                              isMobile ? "mobile" : "small"
                            )}
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // REGULAR LAYOUT - NO SCREEN SHARING
        <div className="h-full">
          {/* Main content area */}
          <div className="h-full relative">
            {mainContent ? (
              <div className="h-full w-full">
                {renderParticipant(
                  mainContent,
                  getParticipantTrack(mainContent, "camera"),
                  "large"
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-purple-900 rounded-lg">
                <p className="text-white text-lg">No host present</p>
              </div>
            )}

            {/* Co-hosts overlay */}
            {sidebarContent.length > 0 && (
              <>
                {/* Desktop - overlay in corner */}
                {isDesktop && (
                  <div className="absolute left-4 top-4 w-80 space-y-3 z-10">
                    {sidebarContent.map((participant, index) => {
                      const track = getParticipantTrack(participant, "camera");
                      return (
                        track && (
                          <div key={`sidebar-${index}`} className="h-36">
                            {renderParticipant(participant, track, "small")}
                          </div>
                        )
                      );
                    })}
                  </div>
                )}

                {/* Tablet/Mobile - bottom bar */}
                {!isDesktop && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <div className="flex gap-2 overflow-x-auto">
                      {sidebarContent.map((participant, index) => {
                        const track = getParticipantTrack(
                          participant,
                          "camera"
                        );
                        return (
                          track && (
                            <div
                              key={`sidebar-${index}`}
                              className={`flex-shrink-0 ${
                                isMobile ? "w-20 h-20" : "w-32 h-24"
                              }`}
                            >
                              {renderParticipant(
                                participant,
                                track,
                                isMobile ? "mobile" : "small"
                              )}
                            </div>
                          )
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
