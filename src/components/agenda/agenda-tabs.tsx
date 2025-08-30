import { useState, useEffect, useCallback, useMemo } from "react";
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
  FaBars,
  FaTimes,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    agendas,
    isLoadingAgendas,
    refetchAgendas,
    shouldShowParticipationTab,
    participationTabLabel,
    activeAddonType,
    syncAddonState,
    viewingResponsesForAgenda,
    setViewingResponsesForAgenda,
  } = useStream();
  console.log({ agendas });
  const { streamMetadata } = useStreamContext();
  const { publicKey } = useRequirePublicKey();

  // Check if user is host
  const isHost = streamMetadata.creatorWallet === publicKey?.toString();

  // Check if there are existing agendas
  const hasExistingAgendas = agendas && agendas.length > 0;

  // // Force sync addon state when modal opens - only once on mount
  // useEffect(() => {
  //   console.log("AgendaTabs mounted, syncing addon state");
  //   syncAddonState();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Empty dependency array - only run on mount

  // // Memoized handlers to prevent recreation
  // const handleAgendaCreated = useCallback(() => {
  //   refetchAgendas();
  // }, [refetchAgendas]);

  // const handleSwitchToExisting = useCallback(() => {
  //   setActiveTab("existing");
  // }, []);

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const handleViewResponses = useCallback((agenda: any) => {
  //   setViewingResponsesForAgenda(agenda);
  // }, [setViewingResponsesForAgenda]);

  // const handleCloseResponseViewer = useCallback(() => {
  //   setViewingResponsesForAgenda(null);
  // }, [setViewingResponsesForAgenda]);

  // const handleEdit = useCallback((agenda: Agenda) => {
  //   setEditingAgenda(agenda);
  // }, []);

  // const handleDelete = useCallback(async () => {
  //   refetchAgendas();
  // }, [refetchAgendas]);

  // const handleEditSuccess = useCallback(() => {
  //   refetchAgendas();
  //   setEditingAgenda(null);
  // }, [refetchAgendas]);

  // Force sync addon state when modal opens
  useEffect(() => {
    console.log("AgendaTabs mounted, syncing addon state");
    syncAddonState();
  }, [syncAddonState]);

  // Memoized handlers
  const handleAgendaCreated = useCallback(() => {
    refetchAgendas();
  }, [refetchAgendas]);

  const handleSwitchToExisting = useCallback(() => {
    setActiveTab("existing");
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewResponses = useCallback((agenda: any) => {
    setViewingResponsesForAgenda(agenda);
  }, [setViewingResponsesForAgenda]);

  const handleCloseResponseViewer = useCallback(() => {
    setViewingResponsesForAgenda(null);
  }, [setViewingResponsesForAgenda]);

  const handleEdit = useCallback((agenda: Agenda) => {
    setEditingAgenda(agenda);
  }, []);

  const handleDelete = useCallback(async () => {
    refetchAgendas();
  }, [refetchAgendas]);

  const handleEditSuccess = useCallback(() => {
    refetchAgendas();
    setEditingAgenda(null);
  }, [refetchAgendas]);

  // const handleTabChange = useCallback((tabId: string) => {
  //   setActiveTab(tabId);
  //   setIsMobileMenuOpen(false);
  // }, []);

    const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  }, []);

  // Auto-redirect users when addon stops while they're on participate tab
  // useEffect(() => {
  //   if (activeTab === "participate" && !shouldShowParticipationTab) {
  //     console.log(
  //       "Addon stopped while user was on participate tab, redirecting..."
  //     );
  //     setActiveTab("existing");
  //   }
  // }, [activeTab, shouldShowParticipationTab]);

  // // Refresh agendas when tab changes to ensure sync
  // useEffect(() => {
  //   if (activeTab === "existing") {
  //     refetchAgendas();
  //   }
  // }, [activeTab, refetchAgendas]);

  // // Set default active tab based on user role and available content
  // useEffect(() => {
  //   if (!activeTab) {
  //     if (isHost) {
  //       if (hasExistingAgendas) {
  //         setActiveTab("existing");
  //       } else {
  //         setActiveTab("create");
  //       }
  //     } else {
  //       if (shouldShowParticipationTab) {
  //         setActiveTab("participate");
  //       } else if (hasExistingAgendas) {
  //         setActiveTab("existing");
  //       } else {
  //         setActiveTab("existing");
  //       }
  //     }
  //   }
  // }, [activeTab, shouldShowParticipationTab, isHost, hasExistingAgendas]);

  // // Memoize available tabs to prevent recreation on every render
  // const availableTabs = useMemo(() => {
  //   const tabs = [];

  //   if (isHost) {
  //     tabs.push({
  //       id: "create",
  //       label: "Create Agenda",
  //       icon: <FaPlus className="w-3 h-3 sm:!w-4 sm:!h-4" />,
  //     });
  //   }

  //   if (hasExistingAgendas) {
  //     tabs.push({
  //       id: "existing",
  //       label: "Existing Agendas",
  //       icon: <FaList className="w-3 h-3 sm:!w-4 sm:!h-4" />,
  //     });
  //   }

  //   if (shouldShowParticipationTab && !isHost) {
  //     let iconComponent = <FaQuestionCircle className="w-3 h-3 sm:!w-4 sm:!h-4" />;

  //     if (activeAddonType === "Poll") {
  //       iconComponent = <FaVoteYea className="w-3 h-3 sm:!w-4 sm:!h-4" />;
  //     } else if (activeAddonType === "Quiz") {
  //       iconComponent = <FaBrain className="w-3 h-3 sm:!w-4 sm:!h-4" />;
  //     }

  //     tabs.push({
  //       id: "participate",
  //       label: participationTabLabel,
  //       icon: iconComponent,
  //     });
  //   }

  //   return tabs;
  // }, [isHost, hasExistingAgendas, shouldShowParticipationTab, activeAddonType, participationTabLabel]);

  // const currentTab = useMemo(() => 
  //   availableTabs.find(tab => tab.id === activeTab),
  //   [availableTabs, activeTab]
  // );

// Auto-redirect users when addon stops while they're on participate tab
  useEffect(() => {
    if (activeTab === "participate" && !shouldShowParticipationTab) {
      console.log("Addon stopped while user was on participate tab, redirecting...");
      setActiveTab("existing");
    }
  }, [activeTab, shouldShowParticipationTab]);

  // Set default active tab based on user role and available content
  useEffect(() => {
    if (!activeTab) {
      if (isHost) {
        if (hasExistingAgendas) {
          setActiveTab("existing");
        } else {
          setActiveTab("create");
        }
      } else {
        if (shouldShowParticipationTab) {
          setActiveTab("participate");
        } else if (hasExistingAgendas) {
          setActiveTab("existing");
        } else {
          setActiveTab("existing");
        }
      }
    }
  }, [activeTab, shouldShowParticipationTab, isHost, hasExistingAgendas]);

  // Memoize available tabs
  const availableTabs = useMemo(() => {
    const tabs = [];

    if (isHost) {
      tabs.push({
        id: "create",
        label: "Create Agenda",
        icon: <FaPlus className="w-3 h-3 sm:!w-4 sm:!h-4" />,
      });
    }

    if (hasExistingAgendas) {
      tabs.push({
        id: "existing",
        label: "Existing Agendas",
        icon: <FaList className="w-3 h-3 sm:!w-4 sm:!h-4" />,
      });
    }

    if (shouldShowParticipationTab && !isHost) {
      let iconComponent = <FaQuestionCircle className="w-3 h-3 sm:!w-4 sm:!h-4" />;

      if (activeAddonType === "Poll") {
        iconComponent = <FaVoteYea className="w-3 h-3 sm:!w-4 sm:!h-4" />;
      } else if (activeAddonType === "Quiz") {
        iconComponent = <FaBrain className="w-3 h-3 sm:!w-4 sm:!h-4" />;
      }

      tabs.push({
        id: "participate",
        label: participationTabLabel,
        icon: iconComponent,
      });
    }

    return tabs;
  }, [isHost, hasExistingAgendas, shouldShowParticipationTab, activeAddonType, participationTabLabel]);

  const currentTab = useMemo(() => 
    availableTabs.find(tab => tab.id === activeTab),
    [availableTabs, activeTab]
  );

  // Memoize the tab content rendering
  // const tabContent = useMemo(() => {
  //   switch (activeTab) {
  //     case "create":
  //       return (
  //         <CreateAgenda 
  //           onAgendaCreated={handleAgendaCreated}
  //           onSwitchToExisting={handleSwitchToExisting}
  //         />
  //       );

  //     case "existing":
  //       return (
  //         <div className="bg-white rounded-lg h-full p-4 sm:!p-6">
  //           <div className="flex justify-between items-center mb-4 sm:!mb-6">
  //             <h2 className="text-lg sm:!text-xl font-semibold text-gray-800">
  //               Stream Agendas
  //             </h2>
  //             <span className="text-gray-400 text-xs sm:!text-sm">
  //               {agendas?.length || 0} agenda
  //               {(agendas?.length || 0) !== 1 ? "s" : ""}
  //             </span>
  //           </div>

  //           {hasExistingAgendas ? (
  //             <div className="space-y-3 sm:!space-y-4 max-h-[60vh] sm:!max-h-96 overflow-y-auto">
  //               <div className="relative">
  //                 <div className="absolute top-0 bottom-0 left-1.5 border-l border-dashed border-gray-200 z-0"></div>
  //                 {agendas?.map((item) => (
  //                   <div key={item.id} className="relative mb-3 sm:!mb-4">
  //                     <AgendaItem
  //                       item={item}
  //                       onViewResponses={handleViewResponses}
  //                       onEdit={handleEdit}
  //                       onDelete={handleDelete}
  //                       onRefresh={refetchAgendas}
  //                     />
  //                   </div>
  //                 ))}
  //               </div>
  //             </div>
  //           ) : (
  //             <div className="text-center py-8">
  //               <FaList className="w-10 h-10 sm:!w-12 sm:!h-12 text-gray-300 mx-auto mb-4" />
  //               <p className="text-sm sm:!text-base text-gray-500">No agendas created yet</p>
  //               {isHost && (
  //                 <button
  //                   onClick={() => setActiveTab("create")}
  //                   className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:!text-base"
  //                 >
  //                   Create First Agenda
  //                 </button>
  //               )}
  //             </div>
  //           )}

  //           <div className="mt-4 sm:!mt-6 text-xs text-gray-500 text-center">
  //             {isHost
  //               ? "Click the menu on each agenda to start, edit, or delete it. Starting a new addon will automatically stop any currently active addon."
  //               : "The host can start agendas for everyone to participate."}
  //           </div>
  //         </div>
  //       );

  //     case "participate":
  //       if (activeAddonType === "Poll") {
  //         return <PollTaker />;
  //       } else if (activeAddonType === "Quiz") {
  //         return <QuizTaker />;
  //       } else if (activeAddonType === "Q&A") {
  //         return (
  //           <div className="bg-white rounded-lg h-full p-4 sm:!p-6">
  //             <div className="text-center">
  //               <FaQuestionCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-4" />
  //               <h2 className="text-lg sm:!text-xl font-semibold text-gray-800 mb-4">
  //                 Q&A Session Active
  //               </h2>
  //               <p className="text-sm sm:!text-base text-gray-600 mb-6">
  //                 The Q&A participation component is coming soon!
  //               </p>
  //               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:!p-4">
  //                 <p className="text-blue-800 text-xs sm:!text-sm">
  //                   This feature is currently under development. You'll be able
  //                   to ask questions and participate in discussions here.
  //                 </p>
  //               </div>
  //             </div>
  //           </div>
  //         );
  //       }
  //       return null;

  //     default:
  //       return null;
  //   }
  // }, [
  //   activeTab,
  //   activeAddonType,
  //   agendas,
  //   hasExistingAgendas,
  //   isHost,
  //   handleAgendaCreated,
  //   handleSwitchToExisting,
  //   handleViewResponses,
  //   handleEdit,
  //   handleDelete,
  //   refetchAgendas,
  // ]);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "create":
        return (
          <CreateAgenda 
            onAgendaCreated={handleAgendaCreated}
            onSwitchToExisting={handleSwitchToExisting}
          />
        );

      case "existing":
        return (
          <div className="bg-white rounded-lg h-full p-4 sm:!p-6">
            <div className="flex justify-between items-center mb-4 sm:!mb-6">
              <h2 className="text-lg sm:!text-xl font-semibold text-gray-800">
                Stream Agendas
              </h2>
              <span className="text-gray-400 text-xs sm:!text-sm">
                {agendas?.length || 0} agenda{(agendas?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>

            {hasExistingAgendas ? (
              <div className="space-y-3 sm:!space-y-4 max-h-[60vh] sm:!max-h-96 overflow-y-auto">
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-1.5 border-l border-dashed border-gray-200 z-0"></div>
                  {agendas?.map((item) => (
                    <div key={item.id} className="relative mb-3 sm:!mb-4">
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
                <FaList className="w-10 h-10 sm:!w-12 sm:!h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm sm:!text-base text-gray-500">No agendas created yet</p>
                {isHost && (
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:!text-base"
                  >
                    Create First Agenda
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 sm:!mt-6 text-xs text-gray-500 text-center">
              {isHost
                ? "Click the menu on each agenda to start, edit, or delete it."
                : "The host can start agendas for everyone to participate."}
            </div>
          </div>
        );

      case "participate":
        if (activeAddonType === "Poll") {
          return <PollTaker />;
        } else if (activeAddonType === "Quiz") {
          return <QuizTaker />;
        } else if (activeAddonType === "Q&A") {
          return (
            <div className="bg-white rounded-lg h-full p-4 sm:!p-6">
              <div className="text-center">
                <FaQuestionCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-lg sm:!text-xl font-semibold text-gray-800 mb-4">
                  Q&A Session Active
                </h2>
                <p className="text-sm sm:!text-base text-gray-600 mb-6">
                  The Q&A participation component is coming soon!
                </p>
              </div>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  }, [
    activeTab,
    activeAddonType,
    agendas,
    hasExistingAgendas,
    isHost,
    handleAgendaCreated,
    handleSwitchToExisting,
    handleViewResponses,
    handleEdit,
    handleDelete,
    refetchAgendas,
  ]);

  // If no tabs available, show a message
  if (availableTabs.length === 0) {
    if (isLoadingAgendas) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="text-center">
              <h2 className="text-lg sm:!text-xl font-semibold text-gray-800 mb-4">
                Loading...
              </h2>
              <p className="text-sm sm:!text-base text-gray-600">Fetching agenda data...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-lg sm:!text-xl font-semibold text-gray-800 mb-4">
              No Agenda Available
            </h2>
            <p className="text-sm sm:!text-base text-gray-600 mb-4">
              {isHost
                ? "Create your first agenda to get started."
                : "No agendas are currently available for this stream."}
            </p>
            <button
              onClick={closeFunc}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:!text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:!p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] sm:!h-[90%] flex flex-col overflow-hidden">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 px-4 sm:!px-6 py-3 sm:!py-4">
          <div className="flex items-center justify-between mb-3 sm:!mb-4">
            <h1 className="text-xl sm:!text-2xl font-semibold text-gray-800">Agenda</h1>
            <button
              onClick={closeFunc}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl sm:!text-xl p-1"
            >
              <FaTimes className="w-5 h-5 sm:!w-6 sm:!h-6" />
            </button>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:!flex space-x-1">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 sm:!px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:!text-base ${
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

          {/* Mobile Tab Dropdown */}
          <div className="sm:!hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
            >
              <div className="flex items-center gap-2">
                {currentTab?.icon}
                <span>{currentTab?.label}</span>
              </div>
              <FaBars className="w-4 h-4" />
            </button>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 w-full px-4 py-3 text-left transition-colors text-sm ${
                      activeTab === tab.id
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-600 hover:bg-gray-50"
                    } ${tab.id !== availableTabs[availableTabs.length - 1].id ? 'border-b border-gray-100' : ''}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "create" ? (
            <div className="h-full">{tabContent}</div>
          ) : (
            <div className="h-full p-4 sm:!p-6 overflow-auto">{tabContent}</div>
          )}
        </div>
      </div>

      {/* Response Viewer Modal */}
      <AddonResponseViewer
        agenda={viewingResponsesForAgenda}
        onClose={handleCloseResponseViewer}
      />
      
      {/* Edit Modal */}
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