import React, { useState, useEffect } from "react";
import { FaTimes, FaPoll, FaBrain, FaQuestionCircle } from "react-icons/fa";
import { type Agenda } from "@vidbloq/react";
import QuizLeaderboard from "./quiz-leaderboard";
import PollResults from "./poll-results"; // You'll create this
// import QAResults from './qa-results'; // You'll create this

interface AddonResponseViewerProps {
  agenda: Agenda | null;
  onClose: () => void;
}

const AddonResponseViewer: React.FC<AddonResponseViewerProps> = ({
  agenda,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!!agenda);
  }, [agenda]);

  if (!agenda) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Allow animation to complete
  };

  const getAddonIcon = () => {
    switch (agenda.action) {
      case "Poll":
        return <FaPoll className="w-6 h-6 text-green-600" />;
      case "Quiz":
        return <FaBrain className="w-6 h-6 text-purple-600" />;
      case "Q_A":
        return <FaQuestionCircle className="w-6 h-6 text-blue-600" />;
      default:
        return <FaQuestionCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getAddonColor = () => {
    switch (agenda.action) {
      case "Poll":
        return "from-green-50 to-green-100 border-green-200";
      case "Quiz":
        return "from-purple-50 to-purple-100 border-purple-200";
      case "Q_A":
        return "from-blue-50 to-blue-100 border-blue-200";
      default:
        return "from-gray-50 to-gray-100 border-gray-200";
    }
  };

  const renderContent = () => {
    switch (agenda.action) {
      case "Quiz":
        return <QuizLeaderboard agendaId={agenda.id} />;

      case "Poll":
        return <PollResults agendaId={agenda.id} />;
      case "Q_A":
        // Placeholder for Q&A results
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <FaQuestionCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Q&A Session Dashboard Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  Real-time Q&A management interface is under development.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Topic:</strong> {agenda.title}
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Participants can ask questions and engage in discussions.
                    All activity will be shown here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <p className="text-gray-600">
                  Response viewer for {agenda.action} is not yet implemented.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-lg w-[95%] max-w-7xl h-[95%] max-h-[95%] flex flex-col overflow-hidden transition-all duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${getAddonColor()} border-b px-6 py-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAddonIcon()}
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {agenda.action} Responses
                </h1>
                <p className="text-gray-600 text-sm">{agenda.title}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-white hover:bg-opacity-50"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50">{renderContent()}</div>
      </div>
    </div>
  );
};

export default AddonResponseViewer;