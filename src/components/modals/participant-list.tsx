// import { useState, useEffect } from "react";
// import {
//   useStreamContext,
//   useParticipantList,
//   useDownloadParticipants,
//   type Participant,
// } from "@vidbloq/react";
// import { useWallet } from "@civic/auth-web3/react";
// import Modal from "../ui/v-modal";
// import { Icon } from "../icons";
// import ParticipantSmall from "../stream/participant";
// import SendModal from "./send";

// type ParticipantListModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
// };

// const ParticipantListModal = ({
//   isOpen,
//   onClose,
// }: ParticipantListModalProps) => {
//   const { userType } = useStreamContext();
//   const { participants, count } = useParticipantList();
//   const { downloadParticipants } = useDownloadParticipants();
//   const wallet = useWallet({ type: "solana" });

//   // Add state for search
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [filteredParticipants, setFilteredParticipants] =
//     useState<Participant[]>(participants);

//   // Add state for view mode (grid or list)
//   const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

//   // Add state for Send Modal
//   const [showSendModal, setShowSendModal] = useState<boolean>(false);
//   const [selectedParticipant, setSelectedParticipant] =
//     useState<Participant | null>(null);

//   // Update filtered participants whenever search term or participants change
//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredParticipants(participants);
//     } else {
//       const filtered = participants.filter((participant) =>
//         participant.userName?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredParticipants(filtered);
//     }
//   }, [searchTerm, participants]);

//   // Handle search input change
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//   };

//   // Handle send click from participant dropdown
//   const handleSendClick = (participant: Participant) => {
//     setSelectedParticipant(participant);
//     setShowSendModal(true);
//   };

//   // Handle closing the send modal
//   const handleCloseSendModal = () => {
//     setShowSendModal(false);
//   };

//   // Toggle view mode between grid and list
//   const toggleViewMode = () => {
//     setViewMode(viewMode === "grid" ? "list" : "grid");
//   };

//   // Determine what to display in the counter
//   const counterDisplay = searchTerm.trim()
//     ? `${filteredParticipants.length} / ${count}`
//     : count;

//   if (!isOpen) return null;

//   return (
//     <div className="relative">
//       <Modal
//         onClose={onClose}
//         position="right"
//         childClassName="bg-[var(--sdk-bg-primary-color)] h-full rounded-l-xl lg:w-1/3 p-3 lg:p-5"
//       >
//         <div className="flex flex-col gap-y-3">
//           <div className="flex flex-row items-center justify-between">
//             <div className="flex flex-row items-center rounded-lg bg-[#DCCCF61F] gap-x-1 p-0.5">
//               <button className="bg-primary text-text-primary p-2 rounded-lg">
//                 {counterDisplay}
//               </button>
//               <p className="text-text-secondary opacity-80 lg:text-lg font-semibold">
//                 Viewers
//               </p>
//             </div>
//             <div className="flex items-center gap-x-2">
//               {userType === "host" && (
//                 <div
//                   className="rounded-2xl bg-[#F9F9F9] p-2 cursor-pointer"
//                   onClick={downloadParticipants}
//                 >
//                   <Icon
//                     name="download-cloud"
//                     size={28}
//                     className="text-primary"
//                   />
//                 </div>
//               )}
//               <div
//                 className="rounded-2xl bg-[#F9F9F9] p-2 cursor-pointer mr-2"
//                 onClick={toggleViewMode}
//               >
//                 <Icon
//                   name={viewMode === "grid" ? "grid" : "list"}
//                   size={24}
//                   className="text-primary"
//                 />
//               </div>
//             </div>
//           </div>
//           <div className="rounded-lg bg-[#F9F9F9] border flex flex-row items-center justify-between p-1 cursor-pointer">
//             <input
//               className="bg-transparent focus:outline-none w-full px-2"
//               placeholder="Search username..."
//               value={searchTerm}
//               onChange={handleSearchChange}
//             />
//             <div className="bg-primary p-2 rounded-lg">
//               <Icon name="search" size={18} className="text-text-primary" />
//             </div>
//           </div>

//           {/* Grid View */}
//           {viewMode === "grid" && (
//             <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-3 max-h-[500px] lg:max-h-[520px] overflow-y-auto">
//               {filteredParticipants.length > 0 ? (
//                 filteredParticipants.map((participant, i) => (
//                   <ParticipantSmall
//                     participant={participant}
//                     key={i}
//                     onSendClick={handleSendClick}
//                   />
//                 ))
//               ) : (
//                 <div className="col-span-3 lg:col-span-4 text-center py-6 text-text-secondary">
//                   No matching participants found
//                 </div>
//               )}
//             </div>
//           )}

//           {/* List View */}
//           {viewMode === "list" && (
//             <div className="flex flex-col gap-y-2 max-h-[500px] lg:max-h-[520px] overflow-y-auto">
//               {filteredParticipants.length > 0 ? (
//                 filteredParticipants.map((participant, i) => {
//                   // Check if this participant is the current user
//                   const isCurrentUser = wallet?.address === participant.walletAddress;

//                   return (
//                     <div
//                       key={i}
//                       className="flex flex-row items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
//                     >
//                       <div className="flex flex-row items-center">
//                         <img
//                           src={participant?.avatarUrl}
//                           className="h-[42px] w-[42px] mr-3 rounded"
//                           alt={`${participant.userName}'s avatar`}
//                         />
//                         <p className="text-text-secondary">
//                           @{participant.userName}
//                         </p>
//                       </div>
//                       {/* Only show money transfer icon if NOT current user */}
//                       {!isCurrentUser && (
//                         <div
//                           className="p-2 rounded-full bg-primary cursor-pointer"
//                           onClick={() => handleSendClick(participant)}
//                         >
//                           <Icon
//                             name="moneyTransfer"
//                             size={16}
//                             className="text-white"
//                           />
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })
//               ) : (
//                 <div className="text-center py-6 text-text-secondary">
//                   No matching participants found
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* Render SendModal when needed */}
//       {showSendModal && selectedParticipant && (
//         <SendModal
//           selectedUser={selectedParticipant}
//           closeFunc={handleCloseSendModal}
//         />
//       )}
//     </div>
//   );
// };

// export default ParticipantListModal;

import { useState, useEffect } from "react";
import {
  useStreamContext,
  useParticipantList,
  useDownloadParticipants,
  type Participant,
} from "@vidbloq/react";
import Modal from "../ui/v-modal";
import { Icon } from "../icons";
import ParticipantSmall from "../stream/participant";
import SendModal from "./send";

type ParticipantListModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ParticipantListModal = ({
  isOpen,
  onClose,
}: ParticipantListModalProps) => {
  const { userType } = useStreamContext();
  const { participants, count } = useParticipantList();
  const { downloadParticipants } = useDownloadParticipants();

  // Add state for search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredParticipants, setFilteredParticipants] =
    useState<Participant[]>(participants);

  // Add state for view mode (grid or list)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Add state for filter
  const [filter, setFilter] = useState<"all" | "pinned">("all");

  // Add state for Send Modal
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);

  // Update filtered participants whenever search term or participants change
  useEffect(() => {
    let filtered = participants;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((participant) =>
        participant.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Note: Pinned filter is disabled for now but keeping the logic for future
    if (filter === "pinned") {
      // This will be implemented later
      // filtered = filtered.filter(p => p.isPinned);
    }

    setFilteredParticipants(filtered);
  }, [searchTerm, filter, participants]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle send click from participant dropdown
  const handleSendClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowSendModal(true);
  };

  // Handle closing the send modal
  const handleCloseSendModal = () => {
    setShowSendModal(false);
  };

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Determine what to display in the counter
  const counterDisplay = searchTerm.trim()
    ? `${filteredParticipants.length} / ${count}`
    : count;

  if (!isOpen) return null;

  return (
    <div className="relative">
      <Modal
        onClose={onClose}
        position="right"
        childClassName="bg-[var(--sdk-bg-primary-color)] h-full rounded-tl-xl w-3/4 md:!max-w-[40%] md:!min-w-[35%] lg:!max-w-[35%] lg:!min-w-[30%] p-3 lg:!p-5"
      >
        <div className="flex flex-col gap-y-3 h-full">
          {/* Header */}
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-x-2">
              <div className="bg-primary text-white px-3 py-1.5 rounded-lg font-semibold text-sm">
                {counterDisplay}
              </div>
              <p className="text-text-secondary text-lg font-semibold">
                Viewers
              </p>
            </div>
            <button onClick={() => setFilter("all")} className="hidden">filter</button>
            <div className="flex items-center gap-x-2">
              {userType === "host" && (
                <div
                  className="rounded-2xl bg-[#F9F9F9] p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={downloadParticipants}
                  title="Download participants list"
                >
                  <Icon
                    name="download-cloud"
                    size={24}
                    className="text-primary"
                  />
                </div>
              )}
              <div
                className="rounded-2xl bg-[#F9F9F9] p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={toggleViewMode}
                title={`Switch to ${
                  viewMode === "grid" ? "list" : "grid"
                } view`}
              >
                <Icon
                  name={viewMode === "grid" ? "list" : "grid"}
                  size={24}
                  className="text-primary"
                />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          {/* <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                // Disabled for now - will be implemented later
                console.log("Pinned filter will be implemented soon");
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
              disabled
              title="Coming soon"
            >
              Pinned
            </button>
          </div> */}

          {/* Search Bar */}
          <div className="rounded-lg bg-[#F9F9F9] border flex flex-row items-center justify-between p-1 cursor-pointer">
            <input
              className="bg-transparent focus:outline-none w-full px-2 text-text-secondary"
              placeholder="Search username..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="bg-primary p-2 rounded-lg">
              <Icon name="search" size={18} className="text-white" />
            </div>
          </div>

          {/* Grid View - Updated with overflow visible */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-3 max-h-[500px] lg:max-h-[520px] overflow-y-auto overflow-x-visible flex-1">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant, i) => (
                  <ParticipantSmall
                    participant={participant}
                    key={i}
                    onSendClick={handleSendClick}
                    viewMode="grid"
                  />
                ))
              ) : (
                <div className="col-span-3 lg:col-span-4 text-center py-6 text-text-secondary">
                  No matching participants found
                </div>
              )}
            </div>
          )}

          {/* List View - Updated with overflow visible */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-y-2 overflow-y-auto max-h-[500px] lg:max-h-[520px] overflow-x-visible flex-1">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant, i) => (
                  <ParticipantSmall
                    participant={participant}
                    key={i}
                    onSendClick={handleSendClick}
                    viewMode="list"
                  />
                ))
              ) : (
                <div className="text-center py-6 text-text-secondary">
                  No matching participants found
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Render SendModal when needed */}
      {showSendModal && selectedParticipant && (
        <SendModal
          selectedUser={selectedParticipant}
          closeFunc={handleCloseSendModal}
        />
      )}
    </div>
  );
};

export default ParticipantListModal;