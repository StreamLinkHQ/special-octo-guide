import { useState, useRef, useEffect, useCallback } from "react";
import {
  useStreamRecording,
  useStreamRecordingYoutube,
  useStreamRoom,
} from "@vidbloq/react";
import {
  BsRecordCircle,
  BsPauseFill,
  BsPlayFill,
  BsStopCircle,
} from "react-icons/bs";
import { YouTubeStreamingModal } from "../modals";
import Tooltip from "../ui/tooltip";

interface RecordingControlsProps {
  isMobileMenu?: boolean;
  onMobileMenuClick?: () => void;
}

const RecordingControls = ({
  isMobileMenu = false,
  onMobileMenuClick,
}: RecordingControlsProps) => {
  const meeting = useStreamRoom();
  const recording = useStreamRecording();
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isRecording: isYouTubeStreaming,
    startRecording: startYouTubeRecording,
    stopRecording: stopYouTubeRecording,
  } = useStreamRecordingYoutube({ youtubeRtmpUrl: youtubeUrl });

  // // Debug log
  // console.log("DEBUG", recording.isRecording, isYouTubeStreaming, youtubeUrl);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = useCallback(async () => {
    await recording.startRecording({
      quality: "high",
      audioTracks: meeting.tracks.microphone,
      room: meeting.room,
      watermarks: [
        {
          type: "image",
          content: "/logo.png",
          position: "top-right",
          opacity: 0.8,
          width: 50,
          height: 50,
        },
      ],
    });
  }, [recording, meeting]);

  const handleYouTubeModalOpen = useCallback(() => {
    setShowYouTubeModal(true);
    setShowDropdown(false);
    setShowMobileControls(false);
    onMobileMenuClick?.();
  }, [onMobileMenuClick]);

  const handleStartBoth = useCallback(async () => {
    await handleStartRecording();
    setShowYouTubeModal(true);
    setShowDropdown(false);
    setShowMobileControls(false);
    onMobileMenuClick?.();
  }, [handleStartRecording, onMobileMenuClick]);

  const handleStopAll = useCallback(async () => {
    const promises = [];
    if (recording.isRecording) {
      promises.push(recording.stopRecording());
    }
    if (isYouTubeStreaming) {
      promises.push(stopYouTubeRecording());
    }
    await Promise.all(promises);
    setShowMobileControls(false);
  }, [recording, isYouTubeStreaming, stopYouTubeRecording]);

  const activeRecording = recording.isRecording || isYouTubeStreaming;

  // Mobile Menu Layout
  if (isMobileMenu) {
    return (
      <>
        <button
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
          onClick={() => {
            if (activeRecording) {
              setShowMobileControls(true);
              onMobileMenuClick?.();
            } else {
              setShowDropdown(true);
            }
          }}
        >
          <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center relative">
            <BsRecordCircle className="text-red-600 w-6 h-6" />
            {activeRecording && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-xs text-gray-600">Record</span>
        </button>

        {showDropdown && !activeRecording && (
          <div className="flex flex-col items-center gap-3 mt-4 w-full">
            <button
              onClick={() => {
                handleStartRecording();
                setShowDropdown(false);
                onMobileMenuClick?.();
              }}
              className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 flex items-center gap-4 transition-colors"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <BsRecordCircle className="text-red-600 w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900">Local Record</div>
                <div className="text-sm text-gray-600">Save to device</div>
              </div>
            </button>

            <button
              onClick={handleYouTubeModalOpen}
              className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 flex items-center gap-4 transition-colors"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900">YouTube Live</div>
                <div className="text-sm text-gray-600">Stream to platform</div>
              </div>
            </button>

            <button
              onClick={handleStartBoth}
              className="w-full p-4 rounded-xl bg-purple-50 hover:bg-purple-100 flex items-center gap-4 transition-colors border-2 border-purple-200"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <div className="relative w-5 h-5">
                  <BsRecordCircle className="text-red-600 w-3 h-3 absolute top-0 left-0" />
                  <svg
                    className="w-3 h-3 text-red-600 absolute bottom-0 right-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900">Both</div>
                <div className="text-sm text-gray-600">Record + Stream</div>
              </div>
            </button>
          </div>
        )}

        {showMobileControls && activeRecording && (
          <div className="flex flex-col gap-4 mt-4 w-full">
            {recording.isRecording && (
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-lg font-semibold text-red-600 font-mono">
                      {formatRecordingTime(recording.recordingTime)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Local Recording
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={
                      recording.isPaused
                        ? recording.resumeRecording
                        : recording.pauseRecording
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 rounded-xl shadow-sm transition-colors"
                  >
                    {recording.isPaused ? (
                      <>
                        <BsPlayFill className="text-gray-700 w-5 h-5" />
                        <span className="text-sm font-medium">Resume</span>
                      </>
                    ) : (
                      <>
                        <BsPauseFill className="text-gray-700 w-5 h-5" />
                        <span className="text-sm font-medium">Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      recording.stopRecording();
                      if (!isYouTubeStreaming) {
                        setShowMobileControls(false);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors"
                  >
                    <BsStopCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Stop</span>
                  </button>
                </div>

                {!isYouTubeStreaming && (
                  <button
                    onClick={() => {
                      setShowYouTubeModal(true);
                      setShowMobileControls(false);
                    }}
                    className="w-full mt-3 py-3 bg-white hover:bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      + Add YouTube Stream
                    </span>
                  </button>
                )}
              </div>
            )}

            {isYouTubeStreaming && (
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-lg font-semibold text-red-600">
                      LIVE
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    YouTube Stream
                  </span>
                </div>

                <button
                  onClick={() => {
                    stopYouTubeRecording();
                    if (!recording.isRecording) {
                      setShowMobileControls(false);
                    }
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <BsStopCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Stop Stream</span>
                </button>

                {!recording.isRecording && (
                  <button
                    onClick={() => {
                      handleStartRecording();
                      setShowMobileControls(false);
                    }}
                    className="w-full mt-3 py-3 bg-white hover:bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <BsRecordCircle className="text-red-600 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">
                      + Add Local Recording
                    </span>
                  </button>
                )}
              </div>
            )}

            {recording.isRecording && isYouTubeStreaming && (
              <button
                onClick={handleStopAll}
                className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <BsStopCircle className="w-5 h-5" />
                <span className="text-sm">Stop All Recordings</span>
              </button>
            )}
          </div>
        )}

        <YouTubeStreamingModal
          isOpen={showYouTubeModal}
          onClose={() => setShowYouTubeModal(false)}
          isRecording={isYouTubeStreaming}
          isLoading={false}
          error={null}
          onStartStream={async (url) => {
            setYoutubeUrl(url);
            await startYouTubeRecording(url);
          }}
          onStopStream={stopYouTubeRecording}
        />
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      <div className="flex items-center gap-2">
        {!activeRecording ? (
          <div className="relative" ref={dropdownRef}>
            <Tooltip content="Recording options">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 h-10 px-3 bg-red-50 hover:bg-red-100 rounded-xl shadow-sm transition-all duration-200"
              >
                <BsRecordCircle className="text-red-600 w-4 h-4" />
                <span className="text-sm font-medium text-red-600">Record</span>
              </button>
            </Tooltip>

            {showDropdown && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[200px] z-10">
                <button
                  onClick={() => {
                    handleStartRecording();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <BsRecordCircle className="text-red-600 w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Local Record
                    </div>
                    <div className="text-xs text-gray-500">Save to device</div>
                  </div>
                </button>

                <div className="h-px bg-gray-200"></div>

                <button
                  onClick={handleYouTubeModalOpen}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      YouTube Live
                    </div>
                    <div className="text-xs text-gray-500">
                      Stream to platform
                    </div>
                  </div>
                </button>

                <div className="h-px bg-gray-200"></div>

                <button
                  onClick={handleStartBoth}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <div className="relative w-4 h-4">
                      <BsRecordCircle className="text-red-600 w-3 h-3 absolute top-0 left-0" />
                      <svg
                        className="w-3 h-3 text-red-600 absolute bottom-0 right-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Both
                    </div>
                    <div className="text-xs text-gray-500">Record + Stream</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {recording.isRecording && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 h-10 px-3 bg-red-50 rounded-xl">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-red-600 font-mono">
                    {formatRecordingTime(recording.recordingTime)}
                  </span>
                </div>

                <Tooltip
                  content={
                    recording.isPaused ? "Resume recording" : "Pause recording"
                  }
                >
                  <button
                    onClick={
                      recording.isPaused
                        ? recording.resumeRecording
                        : recording.pauseRecording
                    }
                    className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl shadow-sm transition-all duration-200"
                  >
                    {recording.isPaused ? (
                      <BsPlayFill className="text-gray-700 w-5 h-5" />
                    ) : (
                      <BsPauseFill className="text-gray-700 w-5 h-5" />
                    )}
                  </button>
                </Tooltip>

                <Tooltip content="Stop recording">
                  <button
                    onClick={recording.stopRecording}
                    className="flex items-center justify-center w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl shadow-sm transition-all duration-200"
                  >
                    <BsStopCircle className="text-red-600 w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            )}

            {recording.isRecording && isYouTubeStreaming && (
              <div className="h-10 w-px bg-gray-300"></div>
            )}

            {isYouTubeStreaming && (
              <Tooltip content="Manage YouTube stream">
                <button
                  onClick={() => setShowYouTubeModal(true)}
                  className="flex items-center gap-2 px-3 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="text-sm font-medium">Live</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </button>
              </Tooltip>
            )}

            {/* STOP ALL BUTTON - Shows when both are active */}
            {recording.isRecording && isYouTubeStreaming && (
              <>
                <div className="h-10 w-px bg-gray-300"></div>
                <Tooltip content="Stop all recordings">
                  <button
                    onClick={handleStopAll}
                    className="flex items-center gap-2 px-3 h-10 bg-gray-800 hover:bg-gray-900 text-white rounded-xl shadow-sm transition-all duration-200"
                  >
                    <BsStopCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Stop All</span>
                  </button>
                </Tooltip>
              </>
            )}

            {recording.isRecording && !isYouTubeStreaming && (
              <>
                <div className="h-10 w-px bg-gray-300"></div>
                <Tooltip content="Add YouTube stream">
                  <button
                    onClick={() => setShowYouTubeModal(true)}
                    className="flex items-center gap-2 px-3 h-10 bg-white hover:bg-red-50 text-gray-700 border border-gray-200 rounded-xl shadow-sm transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="text-sm font-medium">+ YouTube</span>
                  </button>
                </Tooltip>
              </>
            )}

            {!recording.isRecording && isYouTubeStreaming && (
              <>
                <div className="h-10 w-px bg-gray-300"></div>
                <Tooltip content="Add local recording">
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 px-3 h-10 bg-white hover:bg-red-50 text-gray-700 border border-gray-200 rounded-xl shadow-sm transition-all duration-200"
                  >
                    <BsRecordCircle className="text-red-600 w-4 h-4" />
                    <span className="text-sm font-medium">+ Record</span>
                  </button>
                </Tooltip>
              </>
            )}
          </>
        )}
      </div>

      <YouTubeStreamingModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        isRecording={isYouTubeStreaming}
        isLoading={false}
        error={null}
        onStartStream={async (url) => {
          setYoutubeUrl(url);
          await startYouTubeRecording(url);
        }}
        onStopStream={stopYouTubeRecording}
      />
    </>
  );
};

export default RecordingControls;


// import { useState, useRef, useEffect, useCallback } from "react";
// import { useStreamRecording, useStreamRecordingYoutube, useStreamRoom } from "@vidbloq/react";
// import { BsRecordCircle, BsPauseFill, BsPlayFill, BsStopCircle } from "react-icons/bs";
// import { YouTubeStreamingModal } from "../modals";
// import Tooltip from "../ui/tooltip";

// interface RecordingControlsProps {
//   /** Whether to show in mobile menu layout */
//   isMobileMenu?: boolean;
//   /** Callback when mobile menu item is clicked */
//   onMobileMenuClick?: () => void;
// }

// /**
//  * RecordingControls - Handles both local recording and YouTube streaming
//  * Responsive component that adapts to desktop and mobile layouts
//  */
// const RecordingControls = ({
//   isMobileMenu = false,
//   onMobileMenuClick
// }: RecordingControlsProps) => {
//   const meeting = useStreamRoom();
//   const recording = useStreamRecording();
//   const [showYouTubeModal, setShowYouTubeModal] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showMobileControls, setShowMobileControls] = useState(false);
//   // const [youtubeUrl, setYoutubeUrl] = useState("");
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const {
//     isRecording: isYouTubeStreaming,
//     // startRecording: startYouTubeRecording,
//     // stopRecording: stopYouTubeRecording
//   } = useStreamRecordingYoutube({ youtubeRtmpUrl: "" });

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowDropdown(false);
//       }
//     };

//     if (showDropdown) {
//       document.addEventListener("mousedown", handleClickOutside);
//       return () => document.removeEventListener("mousedown", handleClickOutside);
//     }
//   }, [showDropdown]);

//   // Format recording time as MM:SS
//   const formatRecordingTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   // Handle local recording start
//   const handleStartRecording = useCallback(async () => {
//     await recording.startRecording({
//       quality: 'high',
//       audioTracks: meeting.tracks.microphone,
//       room: meeting.room,
//       watermarks: [
//         {
//           type: "image",
//           content: "/logo.png",
//           position: "top-right",
//           opacity: 0.8,
//           width: 50,
//           height: 50,
//         },
//       ],
//     });
//   }, [recording, meeting]);

//   // Handle YouTube modal
//   const handleYouTubeModalOpen = useCallback(() => {
//     setShowYouTubeModal(true);
//     setShowDropdown(false);
//     onMobileMenuClick?.();
//   }, [onMobileMenuClick]);

//   // Handle starting both recordings
//   const handleStartBoth = useCallback(async () => {
//     await handleStartRecording();
//     setShowYouTubeModal(true);
//     setShowDropdown(false);
//     onMobileMenuClick?.();
//   }, [handleStartRecording, onMobileMenuClick]);

//   const activeRecording = recording.isRecording || isYouTubeStreaming;

//   // Mobile Menu Layout
//   if (isMobileMenu) {
//     return (
//       <>
//         {/* Mobile Menu Item */}
//         <button
//           className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-primary-light hover:bg-primary-light/10 transition-colors"
//           onClick={() => {
//             if (activeRecording) {
//               setShowMobileControls(true);
//             } else {
//               setShowDropdown(!showDropdown);
//             }
//           }}
//         >
//           <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center relative">
//             <BsRecordCircle className="text-red-600 w-6 h-6" />
//             {activeRecording && (
//               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse" />
//             )}
//           </div>
//           <span className="text-xs text-gray-600">Record</span>
//         </button>

//         {/* Mobile Dropdown Menu for Starting Recording */}
//         {showDropdown && !activeRecording && (
//           <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowDropdown(false)}>
//             <div
//               className="bg-white rounded-t-3xl w-full p-6 animate-slideUp"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
//               <h3 className="text-lg font-semibold mb-4">Recording Options</h3>

//               <div className="space-y-3">
//                 <button
//                   onClick={() => {
//                     handleStartRecording();
//                     setShowDropdown(false);
//                     onMobileMenuClick?.();
//                   }}
//                   className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 flex items-center gap-4 transition-colors"
//                 >
//                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
//                     <BsRecordCircle className="text-red-600 w-5 h-5" />
//                   </div>
//                   <div className="text-left flex-1">
//                     <div className="font-medium text-gray-900">Local Record</div>
//                     <div className="text-sm text-gray-600">Save to device</div>
//                   </div>
//                 </button>

//                 <button
//                   onClick={handleYouTubeModalOpen}
//                   className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 flex items-center gap-4 transition-colors"
//                 >
//                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
//                     <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
//                       <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                     </svg>
//                   </div>
//                   <div className="text-left flex-1">
//                     <div className="font-medium text-gray-900">YouTube Live</div>
//                     <div className="text-sm text-gray-600">Stream to platform</div>
//                   </div>
//                 </button>

//                 <button
//                   onClick={handleStartBoth}
//                   className="w-full p-4 rounded-xl bg-purple-50 hover:bg-purple-100 flex items-center gap-4 transition-colors border-2 border-purple-200"
//                 >
//                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
//                     <div className="relative w-5 h-5">
//                       <BsRecordCircle className="text-red-600 w-3 h-3 absolute top-0 left-0" />
//                       <svg className="w-3 h-3 text-red-600 absolute bottom-0 right-0" fill="currentColor" viewBox="0 0 24 24">
//                         <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                       </svg>
//                     </div>
//                   </div>
//                   <div className="text-left flex-1">
//                     <div className="font-medium text-gray-900">Both</div>
//                     <div className="text-sm text-gray-600">Record + Stream</div>
//                   </div>
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Mobile Active Recording Controls */}
//         {showMobileControls && activeRecording && (
//           <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowMobileControls(false)}>
//             <div
//               className="bg-white rounded-t-3xl w-full p-6 animate-slideUp"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
//               <h3 className="text-lg font-semibold mb-4">Recording Controls</h3>

//               <div className="space-y-4">
//                 {/* Local Recording Controls */}
//                 {recording.isRecording && (
//                   <div className="p-4 bg-red-50 rounded-xl">
//                     <div className="flex items-center justify-between mb-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
//                         <span className="text-lg font-semibold text-red-600 font-mono">
//                           {formatRecordingTime(recording.recordingTime)}
//                         </span>
//                       </div>
//                       <span className="text-sm font-medium text-gray-600">Local Recording</span>
//                     </div>

//                     <div className="flex gap-3">
//                       <button
//                         onClick={recording.isPaused ? recording.resumeRecording : recording.pauseRecording}
//                         className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 rounded-xl shadow-sm transition-colors"
//                       >
//                         {recording.isPaused ? (
//                           <>
//                             <BsPlayFill className="text-gray-700 w-5 h-5" />
//                             <span className="text-sm font-medium">Resume</span>
//                           </>
//                         ) : (
//                           <>
//                             <BsPauseFill className="text-gray-700 w-5 h-5" />
//                             <span className="text-sm font-medium">Pause</span>
//                           </>
//                         )}
//                       </button>

//                       <button
//                         onClick={() => {
//                           recording.stopRecording();
//                           setShowMobileControls(false);
//                         }}
//                         className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors"
//                       >
//                         <BsStopCircle className="w-5 h-5" />
//                         <span className="text-sm font-medium">Stop</span>
//                       </button>
//                     </div>

//                     {/* Add YouTube option if not streaming */}
//                     {!isYouTubeStreaming && (
//                       <button
//                         onClick={() => {
//                           setShowYouTubeModal(true);
//                           setShowMobileControls(false);
//                         }}
//                         className="w-full mt-3 py-3 bg-white hover:bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-center gap-2 transition-colors"
//                       >
//                         <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
//                           <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                         </svg>
//                         <span className="text-sm font-medium text-gray-700">+ Add YouTube Stream</span>
//                       </button>
//                     )}
//                   </div>
//                 )}

//                 {/* YouTube Streaming Controls */}
//                 {isYouTubeStreaming && (
//                   <div className="p-4 bg-red-50 rounded-xl">
//                     <div className="flex items-center justify-between mb-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
//                         <span className="text-lg font-semibold text-red-600">LIVE</span>
//                       </div>
//                       <span className="text-sm font-medium text-gray-600">YouTube Stream</span>
//                     </div>

//                     <button
//                       onClick={() => {
//                         setShowYouTubeModal(true);
//                         setShowMobileControls(false);
//                       }}
//                       className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
//                     >
//                       <BsStopCircle className="w-5 h-5" />
//                       <span className="text-sm font-medium">Stop Stream</span>
//                     </button>

//                     {/* Add Recording option if not recording */}
//                     {!recording.isRecording && (
//                       <button
//                         onClick={() => {
//                           handleStartRecording();
//                           setShowMobileControls(false);
//                         }}
//                         className="w-full mt-3 py-3 bg-white hover:bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-center gap-2 transition-colors"
//                       >
//                         <BsRecordCircle className="text-red-600 w-4 h-4" />
//                         <span className="text-sm font-medium text-gray-700">+ Add Local Recording</span>
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         <YouTubeStreamingModal
//           isOpen={showYouTubeModal}
//           onClose={() => setShowYouTubeModal(false)}
//         />
//       </>
//     );
//   }

//   // Desktop Layout
//   return (
//     <>
//       <div className="flex items-center gap-2">
//         {!activeRecording ? (
//           // Compact dropdown when inactive
//           <div className="relative" ref={dropdownRef}>
//             <Tooltip content="Recording options">
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 h-10 px-3 bg-red-50 hover:bg-red-100 rounded-xl shadow-sm transition-all duration-200"
//               >
//                 <BsRecordCircle className="text-red-600 w-4 h-4" />
//                 <span className="text-sm font-medium text-red-600">Record</span>
//               </button>
//             </Tooltip>

//             {/* Dropdown opens UPWARD */}
//             {showDropdown && (
//               <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[200px] z-10">
//                 <button
//                   onClick={() => {
//                     handleStartRecording();
//                     setShowDropdown(false);
//                   }}
//                   className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
//                 >
//                   <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
//                     <BsRecordCircle className="text-red-600 w-4 h-4" />
//                   </div>
//                   <div className="text-left">
//                     <div className="text-sm font-medium text-gray-900">Local Record</div>
//                     <div className="text-xs text-gray-500">Save to device</div>
//                   </div>
//                 </button>

//                 <div className="h-px bg-gray-200"></div>

//                 <button
//                   onClick={handleYouTubeModalOpen}
//                   className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
//                 >
//                   <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
//                     <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
//                       <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                     </svg>
//                   </div>
//                   <div className="text-left">
//                     <div className="text-sm font-medium text-gray-900">YouTube Live</div>
//                     <div className="text-xs text-gray-500">Stream to platform</div>
//                   </div>
//                 </button>

//                 <div className="h-px bg-gray-200"></div>

//                 <button
//                   onClick={handleStartBoth}
//                   className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
//                 >
//                   <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
//                     <div className="relative w-4 h-4">
//                       <BsRecordCircle className="text-red-600 w-3 h-3 absolute top-0 left-0" />
//                       <svg className="w-3 h-3 text-red-600 absolute bottom-0 right-0" fill="currentColor" viewBox="0 0 24 24">
//                         <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                       </svg>
//                     </div>
//                   </div>
//                   <div className="text-left">
//                     <div className="text-sm font-medium text-gray-900">Both</div>
//                     <div className="text-xs text-gray-500">Record + Stream</div>
//                   </div>
//                 </button>
//               </div>
//             )}
//           </div>
//         ) : (
//           // Active state - show controls side by side
//           <>
//             {/* Local Recording Controls */}
//             {recording.isRecording && (
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center gap-2 h-10 px-3 bg-red-50 rounded-xl">
//                   <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
//                   <span className="text-sm font-medium text-red-600 font-mono">
//                     {formatRecordingTime(recording.recordingTime)}
//                   </span>
//                 </div>

//                 <Tooltip content={recording.isPaused ? "Resume recording" : "Pause recording"}>
//                   <button
//                     onClick={recording.isPaused ? recording.resumeRecording : recording.pauseRecording}
//                     className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl shadow-sm transition-all duration-200"
//                   >
//                     {recording.isPaused ? (
//                       <BsPlayFill className="text-gray-700 w-5 h-5" />
//                     ) : (
//                       <BsPauseFill className="text-gray-700 w-5 h-5" />
//                     )}
//                   </button>
//                 </Tooltip>

//                 <Tooltip content="Stop recording">
//                   <button
//                     onClick={recording.stopRecording}
//                     className="flex items-center justify-center w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl shadow-sm transition-all duration-200"
//                   >
//                     <BsStopCircle className="text-red-600 w-5 h-5" />
//                   </button>
//                 </Tooltip>
//               </div>
//             )}

//             {/* Divider when both active */}
//             {recording.isRecording && isYouTubeStreaming && (
//               <div className="h-10 w-px bg-gray-300"></div>
//             )}

//             {/* YouTube Streaming Controls */}
//             {isYouTubeStreaming && (
//               <Tooltip content="Manage YouTube stream">
//                 <button
//                   onClick={() => setShowYouTubeModal(true)}
//                   className="flex items-center gap-2 px-3 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-all duration-200"
//                 >
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                   </svg>
//                   <span className="text-sm font-medium">Live</span>
//                   <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
//                 </button>
//               </Tooltip>
//             )}

//             {/* Add button for the other recording type */}
//             {recording.isRecording && !isYouTubeStreaming && (
//               <>
//                 <div className="h-10 w-px bg-gray-300"></div>
//                 <Tooltip content="Add YouTube stream">
//                   <button
//                     onClick={() => setShowYouTubeModal(true)}
//                     className="flex items-center gap-2 px-3 h-10 bg-white hover:bg-red-50 text-gray-700 border border-gray-200 rounded-xl shadow-sm transition-all duration-200"
//                   >
//                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                       <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//                     </svg>
//                     <span className="text-sm font-medium">+ YouTube</span>
//                   </button>
//                 </Tooltip>
//               </>
//             )}

//             {!recording.isRecording && isYouTubeStreaming && (
//               <>
//                 <div className="h-10 w-px bg-gray-300"></div>
//                 <Tooltip content="Add local recording">
//                   <button
//                     onClick={handleStartRecording}
//                     className="flex items-center gap-2 px-3 h-10 bg-white hover:bg-red-50 text-gray-700 border border-gray-200 rounded-xl shadow-sm transition-all duration-200"
//                   >
//                     <BsRecordCircle className="text-red-600 w-4 h-4" />
//                     <span className="text-sm font-medium">+ Record</span>
//                   </button>
//                 </Tooltip>
//               </>
//             )}
//           </>
//         )}
//       </div>

//       <YouTubeStreamingModal
//         isOpen={showYouTubeModal}
//         onClose={() => setShowYouTubeModal(false)}
//       />
//     </>
//   );
// };

// export default RecordingControls;