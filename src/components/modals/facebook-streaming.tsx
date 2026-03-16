import { useState, useCallback, useEffect } from "react";

interface FacebookStreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFacebookStreamKey?: string;
  isRecording?: boolean;
  isLoading?: boolean;
  error?: { message: string } | null;
  onStartStream?: (streamKey: string) => Promise<void>;
  onStopStream?: () => Promise<void>;
}

const FacebookStreamingModal = ({
 isOpen,
  onClose,
  defaultFacebookStreamKey = "",
  isRecording = false,
  isLoading = false,
  error = null,
  onStartStream,
  onStopStream,
}: FacebookStreamingModalProps) => {
  const [facebookStreamKey, setFacebookStreamKey] = useState(defaultFacebookStreamKey);
  const [isUrlVisible, setIsUrlVisible] = useState(false);

 useEffect(() => {
  setFacebookStreamKey(defaultFacebookStreamKey);
}, [defaultFacebookStreamKey]);

const handleStartStreaming = async () => {
  if (!facebookStreamKey.trim() || !onStartStream) return;
  await onStartStream(facebookStreamKey.trim());
};

  const handleStopStreaming = async () => {
    if (!onStopStream) return;
    await onStopStream();
  };

  const handleClose = useCallback(() => {
    if (!isLoading) onClose();
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-[85%] md:max-w-[500px] mx-auto max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full">
                  <span className="text-base sm:text-lg">📘</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Stream to Facebook
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

            <div className="mb-4 sm:mb-5 md:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Facebook Stream Key
              </label>

              <div className="relative">
                <input
  type={isUrlVisible ? "text" : "password"}
  value={facebookStreamKey}
  onChange={(e) => setFacebookStreamKey(e.target.value)}
  placeholder="Paste your Facebook stream key"
  className="w-full p-2.5 sm:p-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
  disabled={isRecording || isLoading}
/>
                <button
                  type="button"
                  onClick={() => setIsUrlVisible((prev) => !prev)}
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
                  Paste the stream key from Facebook Live Producer
                </span>
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
              {!isRecording ? (
                <button
                  onClick={handleStartStreaming}
                  disabled={isLoading || !facebookStreamKey.trim()}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                    isLoading || !facebookStreamKey.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">▶️</span>
                      <span>Start Facebook Stream</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStopStreaming}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                    isLoading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Stopping...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">⏹️</span>
                      <span>Stop Stream</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isRecording && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-blue-800">
                    Live on Facebook
                  </span>
                </div>
                <div className="sm:ml-auto">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 sm:py-1 rounded-full">
                    STREAMING
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookStreamingModal;