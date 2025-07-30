import { useStreamRecordingYoutube } from "@vidbloq/react";
import { useState, useCallback } from "react";

interface YouTubeStreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYoutubeUrl?: string;
}

const YouTubeStreamingModal = ({
  isOpen,
  onClose,
  defaultYoutubeUrl = "",
}: YouTubeStreamingModalProps) => {

  const [youtubeUrl, setYoutubeUrl] = useState<string>(defaultYoutubeUrl);
  const [isUrlVisible, setIsUrlVisible] = useState<boolean>(false);

  const { isRecording, isLoading, startRecording, stopRecording, error } =
    useStreamRecordingYoutube({ youtubeRtmpUrl: defaultYoutubeUrl });

  const handleStartStreaming = async () => {
    if (!youtubeUrl.trim()) {
      return;
    }
    await startRecording(youtubeUrl);
  };

  const handleStopStreaming = async () => {
    await stopRecording();
  };

  const toggleUrlVisibility = () => {
    setIsUrlVisible(!isUrlVisible);
  };

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-[85%] md:max-w-[500px] mx-auto max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-5 md:p-6">
            {/* Header - Responsive padding and text */}
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-red-100 p-1.5 sm:p-2 rounded-full">
                  <span className="text-base sm:text-lg">📹</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Stream to YouTube
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-1"
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Error Alert - Responsive text and padding */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg mb-3 sm:mb-4 flex items-start gap-2">
                <span className="text-red-500 mt-0.5 text-sm sm:text-base">
                  ⚠️
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-base">
                    Streaming Error
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5">{error.message}</p>
                </div>
              </div>
            )}

            {/* YouTube URL Input - Responsive input and label */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                YouTube RTMP URL with Stream Key
              </label>
              <div className="relative">
                <input
                  type={isUrlVisible ? "text" : "password"}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx-xxxx-xxxx"
                  className="w-full p-2.5 sm:p-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                  disabled={isRecording || isLoading}
                />
                <button
                  type="button"
                  onClick={toggleUrlVisibility}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  disabled={isRecording || isLoading}
                >
                  <span className="text-gray-500 text-sm sm:text-base">
                    {isUrlVisible ? "👁️" : "👁️‍🗨️"}
                  </span>
                </button>
              </div>
              <p className="text-xs mt-1.5 sm:mt-2 text-gray-500 flex items-start gap-1">
                <span className="text-gray-400 mt-0.5 text-xs">ℹ️</span>
                <span className="flex-1">
                  <span className="hidden sm:!inline">
                    Get this from YouTube Studio → Go Live → Stream → Copy
                    Stream URL and Stream key
                  </span>
                  <span className="sm:!hidden">
                    Get from YouTube Studio → Go Live
                  </span>
                </span>
              </p>
            </div>

            {/* Action Buttons - Responsive button sizes and text */}
            <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
              {!isRecording ? (
                <button
                  onClick={handleStartStreaming}
                  disabled={isLoading || !youtubeUrl.trim()}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                    isLoading || !youtubeUrl.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Starting...</span>
                      <span className="sm:hidden">Starting...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">▶️</span>
                      <span className="hidden sm:!inline">
                        Start YouTube Stream
                      </span>
                      <span className="sm:!hidden">Start Stream</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStopStreaming}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 sm:!py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                    isLoading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span className="hidden sm:!inline">Stopping...</span>
                      <span className="sm:hidden">Stopping...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">⏹️</span>
                      <span className="hidden sm:!inline">Stop Stream</span>
                      <span className="sm:hidden">Stop</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Live Indicator - Responsive layout and text */}
            {isRecording && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-red-800">
                    Live on YouTube
                  </span>
                </div>
                <div className="sm:!ml-auto">
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 sm:py-1 rounded-full">
                    STREAMING
                  </span>
                </div>
              </div>
            )}

            {/* Help Text - Responsive padding and text */}
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 rounded-lg">
              <div className="flex gap-1.5 sm:gap-2">
                <span className="text-blue-500 mt-0.5 text-xs sm:text-sm">
                  ℹ️
                </span>
                <div className="text-xs sm:text-sm text-blue-800 flex-1">
                  <p className="font-medium mb-0.5 sm:mb-1">
                    Before you start:
                  </p>
                  <ul className="space-y-0.5 sm:space-y-1 text-xs">
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span className="flex-1">
                        <span className="hidden sm:!inline">
                          Ensure your YouTube account is enabled for live
                          streaming
                        </span>
                        <span className="sm:hidden">
                          YouTube account must be enabled for live
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span className="flex-1">
                        Verify your stream key is correct and active
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span className="flex-1">
                        <span className="hidden sm:!inline">
                          Test your internet connection for stable streaming
                        </span>
                        <span className="sm:hidden">
                          Check your internet connection
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeStreamingModal;