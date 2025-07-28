/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useStreamAddons, useRequirePublicKey, useStreamContext, type AddonType, type Agenda } from "@vidbloq/react";
import { CiMenuKebab, CiEdit } from "react-icons/ci";
import { VscDebugStart, VscDebugStop } from "react-icons/vsc";
import { MdDelete } from "react-icons/md";
import { FaEye, FaClock, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";
import { useStream } from "../../hooks";
import { useDeleteAgenda } from "@vidbloq/react";

type AgendaItemProps = {
  item: Agenda;
  onEdit?: (item: Agenda) => void;
  onDelete?: (itemId: string) => void;
  onViewResponses?: (item: Agenda) => void;
  onRefresh?: () => void;
};

const AgendaItem = ({ item, onEdit, onDelete, onViewResponses, onRefresh }: AgendaItemProps) => {
  const [_isOpen, setIsOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { startAddon, stopAddon, activeAddons } = useStreamAddons();
  const { publicKey } = useRequirePublicKey();
  const { streamMetadata } = useStreamContext();
  const { deleteAgenda } = useDeleteAgenda();
  const { 
    setActiveAgendaId, 
    activeAgendaId,
    activeAddonType,
    syncAddonState,
    remainingTime,
    isTimerRunning,
    markAgendaAsCompleted,
  } = useStream();
  
  // Check if user is host
  const isHost = streamMetadata.creatorWallet === publicKey?.toString();
  
  // Check if this addon is currently active
  const addonType = item.action as unknown as AddonType;
  const isAddonActive = activeAddons[addonType]?.isActive;

  // Check if this specific agenda item's addon is active
  const data = activeAddons[addonType]?.data;
  const isThisAgendaActive = 
    isAddonActive &&
    typeof data === "object" &&
    data !== null &&
    "agendaId" in data &&
    (data as { agendaId: string }).agendaId === item.id;

  // Alternative check using global state
  const isActiveFromGlobalState = 
    activeAddonType === addonType && 
    activeAgendaId === item.id;

  // Use either check - they should be consistent
  const isCurrentlyActive = isThisAgendaActive || isActiveFromGlobalState;

  // Format remaining time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress for the timer
  const calculateProgress = () => {
    if (!item.duration || !remainingTime) return 0;
    const totalSeconds = Number(item.duration) * 60;
    const elapsedSeconds = totalSeconds - remainingTime;
    return (elapsedSeconds / totalSeconds) * 100;
  };

  // Force re-sync when timer expires
  useEffect(() => {
    if (isCurrentlyActive && isTimerRunning && remainingTime === 0) {
      // Timer just expired, force a sync
      setTimeout(() => {
        syncAddonState();
      }, 200);
    }
  }, [isCurrentlyActive, isTimerRunning, remainingTime, syncAddonState]);

  const handleStart = async () => {
    try {
      console.log("Starting addon:", addonType, "for agenda:", item.id);
      
      // Check if any other addon is currently active
      const currentlyActiveAddons = Object.entries(activeAddons).filter(
        ([_, addon]) => addon?.isActive
      );
      
      // Stop any currently active addons before starting the new one
      if (currentlyActiveAddons.length > 0) {
        console.log("Stopping currently active addons before starting new one:", currentlyActiveAddons);
        for (const [activeAddonType] of currentlyActiveAddons) {
          await stopAddon(activeAddonType as AddonType);
        }
        // Clear the global state
        setActiveAgendaId(null);
        // Wait a moment for the stop to process
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Now start the new addon
      setActiveAgendaId(item.id);
      await startAddon(addonType, { agendaId: item.id });
      
      // Force sync after starting
      setTimeout(() => {
        syncAddonState();
      }, 100);
      setIsOpen(false);
    } catch (error) {
      console.error("Error starting addon:", error);
    }
  };

  const handleStop = async () => {
    try {
      console.log("Stopping addon:", addonType);
      
      // Mark agenda as completed when manually stopped
      await markAgendaAsCompleted(item.id);
      
      await stopAddon(addonType);
      setActiveAgendaId(null);
      
      // Force sync after stopping
      setTimeout(() => {
        syncAddonState();
        if (onRefresh) onRefresh(); // Refresh the agenda list
      }, 100);
      
      setIsOpen(false);
    } catch (error) {
      console.error("Error stopping addon:", error);
    }
  };

  const handleViewResponses = () => {
    if (onViewResponses) {
      onViewResponses(item);
    }
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!publicKey || !onDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteAgenda(item.id, publicKey.toString());
      if (result) {
        onDelete(item.id);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error deleting agenda:", error);
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
    setIsOpen(false);
  };

  // Determine timer status color
  let timerColorClass = 'text-blue-600 bg-blue-50';
  let progressColorClass = 'bg-blue-500';
  
  if (remainingTime !== null && remainingTime <= 60) {
    timerColorClass = 'text-red-600 bg-red-50';
    progressColorClass = 'bg-red-500';
  } else if (remainingTime !== null && remainingTime <= 300) {
    timerColorClass = 'text-orange-600 bg-orange-50';
    progressColorClass = 'bg-orange-500';
  }

  return (
    <div key={item.id} className="flex group">
      <div className={`w-3 h-3 rounded-full border flex-shrink-0 mt-1.5 ${
        item.isCompleted
          ? 'bg-gray-400 border-gray-400'
          : isCurrentlyActive 
          ? 'bg-green-500 border-green-500 animate-pulse' 
          : 'bg-white border-gray-300'
      }`}></div>
      <div className="ml-5 flex-1">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm uppercase ${
            item.isCompleted
              ? 'text-gray-500 line-through'
              : isCurrentlyActive 
              ? 'text-green-800' 
              : 'text-gray-800'
          }`}>
            {item.action}
            {isCurrentlyActive && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                ACTIVE
              </span>
            )}
            {item.isCompleted && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                <FaCheckCircle className="w-3 h-3" />
                COMPLETED
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
              {item.timeStamp}m
            </div>
            {isHost && (
              <AgendaItemMenu
                item={item}
                isCurrentlyActive={isCurrentlyActive}
                isDeleting={isDeleting}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStart={handleStart}
                onStop={handleStop}
                onViewResponses={handleViewResponses}
              />
            )}
          </div>
        </div>
        
        <p className={`text-xs mt-1 ${item.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
          {item.title}
        </p>
        {item.description && (
          <p className={`text-xs mt-1 ${item.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.description}
          </p>
        )}
        
        {/* Duration info - always show if agenda has duration */}
        {item.duration && !isCurrentlyActive && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <FaClock className="w-3 h-3" />
            Duration: {item.duration} minute{Number(item.duration) !== 1 ? 's' : ''}
          </p>
        )}

        {/* Embedded timer display - only visible to hosts when active and has duration */}
        {isHost && isCurrentlyActive && item.duration && isTimerRunning && remainingTime !== null && (
          <div className={`mt-3 p-3 rounded-lg border ${timerColorClass}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Time Remaining: {formatTime(remainingTime)}
                </span>
              </div>
              {remainingTime <= 60 && (
                <FaExclamationCircle className="w-4 h-4 animate-pulse" />
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 ${progressColorClass} transition-all duration-1000 ease-linear`}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            
            <p className="text-xs mt-2 opacity-80">
              This agenda will auto-stop when the timer expires. You can stop it early using the menu.
            </p>
          </div>
        )}

        {/* Show expired message briefly after timer ends */}
        {isHost && isCurrentlyActive && item.duration && !isTimerRunning && remainingTime === 0 && (
          <div className="mt-3 p-3 rounded-lg border bg-gray-50 text-gray-600">
            <div className="flex items-center gap-2">
              <FaClock className="w-4 h-4" />
              <span className="text-sm">Timer expired - stopping agenda...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaItem;

type AgendaItemMenuProps = {
  item: Agenda;
  isCurrentlyActive: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  onStop: () => void;
  onViewResponses: () => void;
};

const AgendaItemMenu = ({ 
  item, 
  isCurrentlyActive,
  isDeleting,
  onEdit, 
  onDelete, 
  onStart, 
  onStop,
  onViewResponses 
}: AgendaItemMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="relative">
      <CiMenuKebab
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[140px]">
            {/* Edit - disabled for completed items */}
            <div
              onClick={!item.isCompleted ? onEdit : undefined}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                item.isCompleted 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              <CiEdit />
              Edit
            </div>
            
            {/* View Responses - only show if addon is active or completed */}
            {(isCurrentlyActive || item.isCompleted) && (
              <div
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                onClick={onViewResponses}
              >
                <FaEye />
                View Responses
              </div>
            )}
            
            {/* Start/Stop Toggle - disabled for completed items */}
            {!item.isCompleted && (
              isCurrentlyActive ? (
                <div
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  onClick={onStop}
                >
                  <VscDebugStop />
                  Stop{item.duration ? ' Early' : ''}
                </div>
              ) : (
                <div
                  className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 cursor-pointer"
                  onClick={onStart}
                >
                  <VscDebugStart />
                  Start
                </div>
              )
            )}
            
            {/* Delete - show loading state */}
            <div
              onClick={!isDeleting ? onDelete : undefined}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                isDeleting 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-red-600 hover:bg-red-50 cursor-pointer'
              }`}
            >
              <MdDelete />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};