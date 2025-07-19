// import { useState } from "react";
// import { useStreamAddons, type AddonType, type Agenda } from "@vidbloq/react";
// import { CiMenuKebab, CiEdit } from "react-icons/ci";
// import { VscDebugStart, VscDebugStop } from "react-icons/vsc";
// import { MdDelete } from "react-icons/md";
// import { FaEye } from "react-icons/fa";
// import { useStream } from "../hooks/useStream";

// type AgendaItemProps = {
//   item: Agenda;
//   onEdit?: (item: Agenda) => void;
//   onDelete?: (itemId: string) => void;
//   onViewResponses?: (item: Agenda) => void;
// };

// const AgendaItem = ({ item, onEdit, onDelete, onViewResponses }: AgendaItemProps) => {
//   const [isOpen, setIsOpen] = useState<boolean>(false);
//   const { startAddon, stopAddon, activeAddons } = useStreamAddons();
//   const { 
//     setActiveAgendaId, 
//     activeAgendaId,
//     activeAddonType,
//     syncAddonState 
//   } = useStream();
  
//   // Check if this addon is currently active
//   const addonType = item.action as unknown as AddonType;
//   const isAddonActive = activeAddons[addonType]?.isActive;

//   // Check if this specific agenda item's addon is active
//   const data = activeAddons[addonType]?.data;
//   const isThisAgendaActive = 
//     isAddonActive &&
//     typeof data === "object" &&
//     data !== null &&
//     "agendaId" in data &&
//     (data as { agendaId: string }).agendaId === item.id;

//   // Alternative check using global state
//   const isActiveFromGlobalState = 
//     activeAddonType === addonType && 
//     activeAgendaId === item.id;

//   // Use either check - they should be consistent
//   const isCurrentlyActive = isThisAgendaActive || isActiveFromGlobalState;

//   console.log("AgendaItem state:", {
//     itemId: item.id,
//     addonType,
//     isAddonActive,
//     isThisAgendaActive,
//     isActiveFromGlobalState,
//     isCurrentlyActive,
//     activeAgendaId,
//     activeAddonType
//   });

//   const handleStart = async () => {
//     try {
//       console.log("Starting addon:", addonType, "for agenda:", item.id);
//       setActiveAgendaId(item.id);
//       await startAddon(addonType, { agendaId: item.id });
//       // Force sync after starting
//       setTimeout(() => {
//         syncAddonState();
//       }, 100);
//       setIsOpen(false);
//     } catch (error) {
//       console.error("Error starting addon:", error);
//     }
//   };

//   const handleStop = async () => {
//     try {
//       console.log("Stopping addon:", addonType);
//       await stopAddon(addonType);
//       setActiveAgendaId(null);
//       // Force sync after stopping
//       setTimeout(() => {
//         syncAddonState();
//       }, 100);
//       setIsOpen(false);
//     } catch (error) {
//       console.error("Error stopping addon:", error);
//     }
//   };

//   const handleViewResponses = () => {
//     if (onViewResponses) {
//       onViewResponses(item);
//     }
//     setIsOpen(false);
//   };

//   return (
//     <div key={item.id} className="flex group">
//       <div className={`w-3 h-3 rounded-full border flex-shrink-0 mt-1.5 ${
//         isCurrentlyActive 
//           ? 'bg-green-500 border-green-500 animate-pulse' 
//           : 'bg-white border-gray-300'
//       }`}></div>
//       <div className="ml-5 flex-1">
//         <div className="flex items-center justify-between">
//           <h3 className={`font-semibold text-sm uppercase ${
//             isCurrentlyActive ? 'text-green-800' : 'text-gray-800'
//           }`}>
//             {item.action}
//             {isCurrentlyActive && (
//               <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
//                 ACTIVE
//               </span>
//             )}
//           </h3>
//           <div className="flex items-center gap-2">
//             <div className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
//               {item.timeStamp}m
//             </div>
//             <AgendaItemMenu
//               item={item}
//               isCurrentlyActive={isCurrentlyActive}
//               onEdit={onEdit}
//               onDelete={onDelete}
//               onStart={handleStart}
//               onStop={handleStop}
//               onViewResponses={handleViewResponses}
//             />
//           </div>
//         </div>
//         <p className="text-xs text-gray-600 mt-1">{item.title}</p>
//         {item.description && (
//           <p className="text-xs text-gray-500 mt-1">{item.description}</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AgendaItem;

// type AgendaItemMenuProps = {
//   item: Agenda;
//   isCurrentlyActive: boolean;
//   onEdit?: (item: Agenda) => void;
//   onDelete?: (itemId: string) => void;
//   onStart: () => void;
//   onStop: () => void;
//   onViewResponses: () => void;
// };

// const AgendaItemMenu = ({ 
//   item, 
//   isCurrentlyActive, 
//   onEdit, 
//   onDelete, 
//   onStart, 
//   onStop,
//   onViewResponses 
// }: AgendaItemMenuProps) => {
//   const [isOpen, setIsOpen] = useState<boolean>(false);

//   return (
//     <div className="relative">
//       <CiMenuKebab
//         onClick={() => setIsOpen(!isOpen)}
//         className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
//       />
//       {isOpen && (
//         <>
//           <div
//             className="fixed inset-0 z-10"
//             onClick={() => setIsOpen(false)}
//           />
//           <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[140px]">
//             <div
//               onClick={() => {
//                 onEdit?.(item);
//                 setIsOpen(false);
//               }}
//               className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
//             >
//               <CiEdit />
//               Edit
//             </div>
            
//             {/* View Responses - only show if addon is active */}
//             {isCurrentlyActive && (
//               <div
//                 className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
//                 onClick={onViewResponses}
//               >
//                 <FaEye />
//                 View Responses
//               </div>
//             )}
            
//             {/* Start/Stop Toggle */}
//             {isCurrentlyActive ? (
//               <div
//                 className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
//                 onClick={onStop}
//               >
//                 <VscDebugStop />
//                 Stop
//               </div>
//             ) : (
//               <div
//                 className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 cursor-pointer"
//                 onClick={onStart}
//               >
//                 <VscDebugStart />
//                 Start
//               </div>
//             )}
            
//             <div
//               onClick={() => {
//                 onDelete?.(item.id);
//                 setIsOpen(false);
//               }}
//               className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
//             >
//               <MdDelete />
//               Delete
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

import { useState } from "react";
import { useStreamAddons, type AddonType, type Agenda } from "@vidbloq/react";
import { CiMenuKebab, CiEdit } from "react-icons/ci";
import { VscDebugStart, VscDebugStop } from "react-icons/vsc";
import { MdDelete } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { useStream } from "../hooks/useStream";

type AgendaItemProps = {
  item: Agenda;
  onEdit?: (item: Agenda) => void;
  onDelete?: (itemId: string) => void;
  onViewResponses?: (item: Agenda) => void;
};

const AgendaItem = ({ item, onEdit, onDelete, onViewResponses }: AgendaItemProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { startAddon, stopAddon, activeAddons } = useStreamAddons();
  const { 
    setActiveAgendaId, 
    activeAgendaId,
    activeAddonType,
    syncAddonState 
  } = useStream();
  
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

  console.log("AgendaItem state:", {
    itemId: item.id,
    addonType,
    isAddonActive,
    isThisAgendaActive,
    isActiveFromGlobalState,
    isCurrentlyActive,
    activeAgendaId,
    activeAddonType
  });

  const handleStart = async () => {
    try {
      console.log("Starting addon:", addonType, "for agenda:", item.id);
      
      // Check if any other addon is currently active
      const currentlyActiveAddons = Object.entries(activeAddons).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      await stopAddon(addonType);
      setActiveAgendaId(null);
      // Force sync after stopping
      setTimeout(() => {
        syncAddonState();
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

  return (
    <div key={item.id} className="flex group">
      <div className={`w-3 h-3 rounded-full border flex-shrink-0 mt-1.5 ${
        isCurrentlyActive 
          ? 'bg-green-500 border-green-500 animate-pulse' 
          : 'bg-white border-gray-300'
      }`}></div>
      <div className="ml-5 flex-1">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm uppercase ${
            isCurrentlyActive ? 'text-green-800' : 'text-gray-800'
          }`}>
            {item.action}
            {isCurrentlyActive && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                ACTIVE
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
              {item.timeStamp}m
            </div>
            <AgendaItemMenu
              item={item}
              isCurrentlyActive={isCurrentlyActive}
              onEdit={onEdit}
              onDelete={onDelete}
              onStart={handleStart}
              onStop={handleStop}
              onViewResponses={handleViewResponses}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
        )}
      </div>
    </div>
  );
};

export default AgendaItem;

type AgendaItemMenuProps = {
  item: Agenda;
  isCurrentlyActive: boolean;
  onEdit?: (item: Agenda) => void;
  onDelete?: (itemId: string) => void;
  onStart: () => void;
  onStop: () => void;
  onViewResponses: () => void;
};

const AgendaItemMenu = ({ 
  item, 
  isCurrentlyActive, 
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
            <div
              onClick={() => {
                onEdit?.(item);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <CiEdit />
              Edit
            </div>
            
            {/* View Responses - only show if addon is active */}
            {isCurrentlyActive && (
              <div
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                onClick={onViewResponses}
              >
                <FaEye />
                View Responses
              </div>
            )}
            
            {/* Start/Stop Toggle */}
            {isCurrentlyActive ? (
              <div
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                onClick={onStop}
              >
                <VscDebugStop />
                Stop
              </div>
            ) : (
              <div
                className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 cursor-pointer"
                onClick={onStart}
              >
                <VscDebugStart />
                Start
              </div>
            )}
            
            <div
              onClick={() => {
                onDelete?.(item.id);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
            >
              <MdDelete />
              Delete
            </div>
          </div>
        </>
      )}
    </div>
  );
};