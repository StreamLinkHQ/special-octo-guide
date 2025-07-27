import { useState, useEffect } from "react";
import {
  useStreamContext,
  useRequirePublicKey,
  type Agenda,
} from "@vidbloq/react";
import {
  FaPlus,
  FaList,
  FaVoteYea,
  FaQuestionCircle,
  FaBrain,
} from "react-icons/fa";
import CreateAgenda from "./create-agenda";
import PollTaker from "./poll-taker";
import QuizTaker from "./quiz-taker";
import AgendaItem from "./agenda-item";
import AddonResponseViewer from "./addon-response-viewer";
import { useStream } from "../../hooks";
import EditAgendaModal from "./edit-agenda";

interface AgendaTabsProps {
  closeFunc: () => void;
}

const AgendaTabs = ({ closeFunc }: AgendaTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>("");
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);

  const {
    agendas,
    isLoadingAgendas,
    refetchAgendas,
    shouldShowParticipationTab,
    participationTabLabel,
    activeAddonType,
    syncAddonState, // Force sync when modal opens
    viewingResponsesForAgenda,
    setViewingResponsesForAgenda,
  } = useStream();
  const { streamMetadata } = useStreamContext();
  const { publicKey } = useRequirePublicKey();

  // Check if user is host
  const isHost = streamMetadata.creatorWallet === publicKey?.toString();

  // Check if there are existing agendas
  const hasExistingAgendas = agendas && agendas.length > 0;

  console.log("AgendaTabs state:", {
    shouldShowParticipationTab,
    participationTabLabel,
    activeAddonType,
    activeTab,
    isHost,
    hasExistingAgendas,
  });

  // Force sync addon state when modal opens
  useEffect(() => {
    console.log("AgendaTabs mounted, syncing addon state");
    syncAddonState();
  }, [syncAddonState]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewResponses = (agenda: any) => {
    setViewingResponsesForAgenda(agenda);
  };

  const handleCloseResponseViewer = () => {
    setViewingResponsesForAgenda(null);
  };

  // Auto-redirect users when addon stops while they're on participate tab
  useEffect(() => {
    // If user is on participate tab but addon is no longer active
    if (activeTab === "participate" && !shouldShowParticipationTab) {
      console.log(
        "Addon stopped while user was on participate tab, redirecting..."
      );
      // Redirect to existing agendas if available, otherwise stay on existing (will show empty state)
      setActiveTab("existing");
    }
  }, [activeTab, shouldShowParticipationTab]);

  const handleEdit = (agenda: Agenda) => {
    setEditingAgenda(agenda);
  };

  const handleDelete = async () => {
    // The delete is handled in AgendaItem, just refresh after
    refetchAgendas();
  };

  const handleEditSuccess = () => {
    refetchAgendas();
    setEditingAgenda(null);
  };

  // Refresh agendas when tab changes to ensure sync
  useEffect(() => {
    if (activeTab === "existing") {
      refetchAgendas();
    }
  }, [activeTab, refetchAgendas]);

  // Set default active tab based on user role and available content
  useEffect(() => {
    if (!activeTab) {
      if (isHost) {
        // Host priority: Existing Agendas first, then Create
        if (hasExistingAgendas) {
          setActiveTab("existing");
        } else {
          setActiveTab("create");
        }
      } else {
        // Non-host priority: Participate if available, then Existing
        if (shouldShowParticipationTab) {
          setActiveTab("participate");
        } else if (hasExistingAgendas) {
          setActiveTab("existing");
        } else {
          setActiveTab("existing"); // Default fallback
        }
      }
    }
  }, [activeTab, shouldShowParticipationTab, isHost, hasExistingAgendas]);

  // Define available tabs based on conditions
  const getAvailableTabs = () => {
    const tabs = [];

    // Host can see Create Agenda tab
    if (isHost) {
      tabs.push({
        id: "create",
        label: "Create Agenda",
        icon: <FaPlus className="w-4 h-4" />,
      });
    }

    // Everyone can see Existing Agendas if there are any
    if (hasExistingAgendas) {
      tabs.push({
        id: "existing",
        label: "Existing Agendas",
        icon: <FaList className="w-4 h-4" />,
      });
    }

    // Show Participate tab when there's an active addon (only for non-hosts)
    if (shouldShowParticipationTab && !isHost) {
      // Use the dynamic icon mapping
      let iconComponent = <FaQuestionCircle className="w-4 h-4" />;

      if (activeAddonType === "Poll") {
        iconComponent = <FaVoteYea className="w-4 h-4" />;
      } else if (activeAddonType === "Quiz") {
        iconComponent = <FaBrain className="w-4 h-4" />;
      }

      tabs.push({
        id: "participate",
        label: participationTabLabel,
        icon: iconComponent,
      });
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  // If no tabs available, show a message
  if (availableTabs.length === 0) {
    // Show loading state if agendas are still loading
    if (isLoadingAgendas) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[70%] max-h-[80%] max-w-4xl p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Loading...
              </h2>
              <p className="text-gray-600">Fetching agenda data...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[70%] max-h-[80%] max-w-4xl p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No Agenda Available
            </h2>
            <p className="text-gray-600 mb-4">
              {isHost
                ? "Create your first agenda to get started."
                : "No agendas are currently available for this stream."}
            </p>
            <button
              onClick={closeFunc}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "create":
        return <CreateAgenda />;

      case "existing":
        return (
          <div className="bg-white rounded-lg h-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Stream Agendas
              </h2>
              <span className="text-gray-400 text-sm">
                {agendas?.length || 0} agenda
                {(agendas?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>

            {hasExistingAgendas ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-1.5 border-l border-dashed border-gray-200 z-0"></div>
                  {agendas?.map((item) => (
                    <div key={item.id} className="relative mb-4">
                      <AgendaItem
                        item={item}
                        onViewResponses={handleViewResponses}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRefresh={refetchAgendas}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No agendas created yet</p>
                {isHost && (
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create First Agenda
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-500 text-center">
              {isHost
                ? "Click the menu on each agenda to start, edit, or delete it. Starting a new addon will automatically stop any currently active addon."
                : "The host can start agendas for everyone to participate."}
            </div>
          </div>
        );

      case "participate":
        // Render the appropriate participation component based on addon type
        if (activeAddonType === "Poll") {
          console.log("Rendering PollTaker in participate tab");
          return <PollTaker />;
        } else if (activeAddonType === "Quiz") {
          console.log("Rendering QuizTaker in participate tab");
          return <QuizTaker />;
        } else if (activeAddonType === "Q&A") {
          // Placeholder for Q&A component
          return (
            <div className="bg-white rounded-lg h-full p-6">
              <div className="text-center">
                <FaQuestionCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Q&A Session Active
                </h2>
                <p className="text-gray-600 mb-6">
                  The Q&A participation component is coming soon!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    This feature is currently under development. You'll be able
                    to ask questions and participate in discussions here.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90%] max-w-6xl h-[90%] max-h-[90%] flex flex-col overflow-hidden">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Agenda</h1>
            <button
              onClick={closeFunc}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "create" ? (
            // Create Agenda tab renders its own modal-like content
            <div className="h-full">{renderTabContent()}</div>
          ) : (
            // Other tabs render within the modal container
            <div className="h-full p-6 overflow-auto">{renderTabContent()}</div>
          )}
        </div>
      </div>

      {/* Response Viewer Modal */}
      <AddonResponseViewer
        agenda={viewingResponsesForAgenda}
        onClose={handleCloseResponseViewer}
      />
      {editingAgenda && (
        <EditAgendaModal
          agenda={editingAgenda}
          onClose={() => setEditingAgenda(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default AgendaTabs;
