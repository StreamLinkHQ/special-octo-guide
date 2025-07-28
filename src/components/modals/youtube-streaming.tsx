import { useState, useCallback } from "react";
import { useStreamRecordingYoutube } from "@vidbloq/react";
import {
  FaCircleInfo,
  FaEye,
  FaEyeSlash,
  FaPlay,
  FaStop,
} from "react-icons/fa6";
import { TbAlertCircleFilled } from "react-icons/tb";
import Modal from "../ui/v-modal";
import { Icon } from "../icons";

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
    <Modal
      onClose={handleClose}
      position="center"
      childClassName="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Icon name="video" className="text-red-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Stream to YouTube
            </h2>
          </div>
          {/* <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <Icon name="close" className="text-gray-500" size={20} />
          </button> */}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            {/* <Icon name="alert-circle" className="text-red-500 mt-0.5" size={16} /> */}
            <TbAlertCircleFilled className="text-red-500 mt-0.5" />
            <div>
              <p className="font-medium">Streaming Error</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}

        {/* YouTube URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube RTMP URL with Stream Key
          </label>
          <div className="relative">
            <input
              type={isUrlVisible ? "text" : "password"}
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx-xxxx-xxxx"
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={isRecording || isLoading}
            />
            <button
              type="button"
              onClick={toggleUrlVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={isRecording || isLoading}
            >
              {/* <Icon 
                name={isUrlVisible ? 'eye-off' : 'eye'} 
                className="text-gray-500" 
                size={16} 
              /> */}
              {isUrlVisible ? (
                <FaEye className="text-gray-500" />
              ) : (
                <FaEyeSlash className="text-gray-500" />
              )}
            </button>
          </div>
          <p className="text-xs mt-2 text-gray-500 flex items-start gap-1">
            {/* <Icon name="info" className="text-gray-400 mt-0.5" size={12} /> */}
            <FaCircleInfo className="text-gray-400 mt-0.5" />
            Get this from YouTube Studio → Go Live → Stream → Copy Stream URL
            and Stream key
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          {!isRecording ? (
            <button
              onClick={handleStartStreaming}
              disabled={isLoading || !youtubeUrl.trim()}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isLoading || !youtubeUrl.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  {/* <Icon name="play" className="text-white" size={16} /> */}
                  <FaPlay className="text-white" />
                  Start YouTube Stream
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStopStreaming}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  Stopping...
                </>
              ) : (
                <>
                  {/* <Icon name="square" className="text-white" size={16} /> */}
                  <FaStop className="text-white" />
                  Stop Stream
                </>
              )}
            </button>
          )}
        </div>

        {/* Live Indicator */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-800">
                Live on YouTube
              </span>
            </div>
            <div className="ml-auto">
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                STREAMING
              </span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex gap-2">
            {/* <Icon name="info" className="text-blue-500 mt-0.5" size={16} /> */}
            <FaCircleInfo className="text-blue-500  mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Before you start:</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • Ensure your YouTube account is enabled for live streaming
                </li>
                <li>• Verify your stream key is correct and active</li>
                <li>• Test your internet connection for stable streaming</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default YouTubeStreamingModal;
