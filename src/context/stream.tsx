/* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
// import { 
//   useGetStreamAgenda, 
//   useStreamContext as useOriginalStreamContext,
//   useStreamAddons,
//   type Agenda,
//   type AddonType 
// } from '@vidbloq/react';

// // Enhanced context value type
// interface StreamContextValue {
//   // Existing agenda state
//   activeAgendaId: string | null;
//   setActiveAgendaId: (id: string | null) => void;
//   isActive: (agendaId: string) => boolean;
//   agendas: Agenda[] | null;
//   isLoadingAgendas: boolean;
//   refetchAgendas: () => void;
  
//   // New addon participation state
//   activeAddonType: AddonType | null;
//   isParticipationAvailable: boolean;
//   participationData: any;
//   hasActiveAddon: boolean;
  
//   // Participation indicators
//   shouldShowParticipationTab: boolean;
//   participationTabLabel: string;
//   participationTabIcon: string;
  
//   // Response viewing state
//   viewingResponsesForAgenda: Agenda | null;
//   setViewingResponsesForAgenda: (agenda: Agenda | null) => void;
  
//   // Methods to sync addon state
//   syncAddonState: () => void;
//   clearAddonState: () => void;
  
//   // Helper to get agenda by ID
//   getAgendaById: (id: string) => Agenda | null;
// }

// export const StreamContext = createContext<StreamContextValue | undefined>(undefined);

// // Provider component props
// interface StreamProviderProps {
//   children: ReactNode;
// }

// // Provider component - now manages addon participation state globally
// export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
//   const [activeAgendaId, setActiveAgendaId] = useState<string | null>(null);
  
//   // New addon participation state
//   const [activeAddonType, setActiveAddonType] = useState<AddonType | null>(null);
//   const [participationData, setParticipationData] = useState<any>(null);
//   const [isParticipationAvailable, setIsParticipationAvailable] = useState(false);
  
//   // Response viewing state
//   const [viewingResponsesForAgenda, setViewingResponsesForAgenda] = useState<Agenda | null>(null);
  
//   const { roomName } = useOriginalStreamContext();
//   const { agendas, getStreamAgenda, isLoading } = useGetStreamAgenda();
//   const { activeAddons } = useStreamAddons();

//   console.log('StreamProvider:', { 
//     activeAgendaId, 
//     agendas: agendas?.length,
//     activeAddonType,
//     isParticipationAvailable 
//   });

//   // Sync addon state whenever activeAddons changes
//   const syncAddonState = useCallback(() => {
//     console.log('Syncing addon state:', activeAddons);
    
//     // Check which addon is currently active
//     const activePoll = activeAddons?.Poll?.isActive;
//     const activeQuiz = activeAddons?.Quiz?.isActive;
//     const activeQA = activeAddons?.["Q&A"]?.isActive;
    
//     let currentAddonType: AddonType | null = null;
//     let currentParticipationData: any = null;
    
//     if (activePoll) {
//       currentAddonType = 'Poll' as AddonType;
//       currentParticipationData = activeAddons.Poll?.data;
//     } else if (activeQuiz) {
//       currentAddonType = 'Quiz' as AddonType;
//       currentParticipationData = activeAddons.Quiz?.data;
//     } else if (activeQA) {
//       currentAddonType = 'Q&A' as AddonType;
//       currentParticipationData = activeAddons["Q&A"]?.data;
//     }
    
//     setActiveAddonType(currentAddonType);
//     setParticipationData(currentParticipationData);
//     setIsParticipationAvailable(!!currentAddonType);
    
//     // Extract agenda ID from addon data if available
//     if (currentParticipationData?.agendaId && currentParticipationData.agendaId !== activeAgendaId) {
//       console.log('Setting agenda ID from addon data:', currentParticipationData.agendaId);
//       setActiveAgendaId(currentParticipationData.agendaId);
//     }
    
//     // Clear agenda ID when no addon is active
//     if (!currentAddonType && activeAgendaId) {
//       console.log('No active addon, clearing agenda ID');
//       setActiveAgendaId(null);
//     }
//   }, [activeAddons, activeAgendaId]);

//   // Auto-sync addon state whenever activeAddons changes
//   useEffect(() => {
//     syncAddonState();
//   }, [syncAddonState]);

//   const clearAddonState = useCallback(() => {
//     setActiveAddonType(null);
//     setParticipationData(null);
//     setIsParticipationAvailable(false);
//     setActiveAgendaId(null);
//   }, []);

//   // Fetch agendas when roomName is available
//   useEffect(() => {
//     if (roomName) {
//       console.log('Fetching agendas for room:', roomName);
//       getStreamAgenda(roomName);
//     }
//   }, [roomName, getStreamAgenda]);

//   const isActive = (agendaId: string): boolean => {
//     return activeAgendaId === agendaId;
//   };

//   const refetchAgendas = () => {
//     if (roomName) {
//       getStreamAgenda(roomName);
//     }
//   };

//   // Helper to get agenda by ID
//   const getAgendaById = useCallback((id: string): Agenda | null => {
//     return agendas?.find(agenda => agenda.id === id) || null;
//   }, [agendas]);

//   // Compute participation tab properties
//   const hasActiveAddon = isParticipationAvailable;
//   const shouldShowParticipationTab = hasActiveAddon;
  
//   let participationTabLabel = "Participate";
//   let participationTabIcon = "❓";
  
//   if (activeAddonType === 'Poll') {
//     participationTabLabel = "Vote in Poll";
//     participationTabIcon = "🗳️";
//   } else if (activeAddonType === 'Quiz') {
//     participationTabLabel = "Take Quiz";
//     participationTabIcon = "🧠";
//   } else if (activeAddonType === 'Q&A') {
//     participationTabLabel = "Join Q&A";
//     participationTabIcon = "❓";
//   }

//   const value: StreamContextValue = {
//     // Existing agenda state
//     activeAgendaId,
//     setActiveAgendaId,
//     isActive,
//     agendas,
//     isLoadingAgendas: isLoading,
//     refetchAgendas,
    
//     // New addon participation state
//     activeAddonType,
//     isParticipationAvailable,
//     participationData,
//     hasActiveAddon,
    
//     // Participation indicators
//     shouldShowParticipationTab,
//     participationTabLabel,
//     participationTabIcon,
    
//     // Methods
//     syncAddonState,
//     clearAddonState,
    
//     // Response viewing state
//     viewingResponsesForAgenda,
//     setViewingResponsesForAgenda,
    
//     // Helper methods
//     getAgendaById,
//   };

//   return (
//     <StreamContext.Provider value={value}>
//       {children}
//     </StreamContext.Provider>
//   );
// };

import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  useGetStreamAgenda, 
  useStreamContext as useOriginalStreamContext,
  useStreamAddons,
  type Agenda,
  type AddonType 
} from '@vidbloq/react';

// Enhanced context value type
interface StreamContextValue {
  // Existing agenda state
  activeAgendaId: string | null;
  setActiveAgendaId: (id: string | null) => void;
  isActive: (agendaId: string) => boolean;
  agendas: Agenda[] | null;
  isLoadingAgendas: boolean;
  refetchAgendas: () => void;
  
  // New addon participation state
  activeAddonType: AddonType | null;
  isParticipationAvailable: boolean;
  participationData: any;
  hasActiveAddon: boolean;
  
  // Participation indicators
  shouldShowParticipationTab: boolean;
  participationTabLabel: string;
  participationTabIcon: string;
  
  // Response viewing state
  viewingResponsesForAgenda: Agenda | null;
  setViewingResponsesForAgenda: (agenda: Agenda | null) => void;
  
  // Methods to sync addon state
  syncAddonState: () => void;
  clearAddonState: () => void;
  
  // Helper to get agenda by ID
  getAgendaById: (id: string) => Agenda | null;
}

export const StreamContext = createContext<StreamContextValue | undefined>(undefined);

// Provider component props
interface StreamProviderProps {
  children: ReactNode;
}

// Provider component - now manages addon participation state globally
export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const [activeAgendaId, setActiveAgendaId] = useState<string | null>(null);
  
  // New addon participation state
  const [activeAddonType, setActiveAddonType] = useState<AddonType | null>(null);
  const [participationData, setParticipationData] = useState<any>(null);
  const [isParticipationAvailable, setIsParticipationAvailable] = useState(false);
  
  // Response viewing state
  const [viewingResponsesForAgenda, setViewingResponsesForAgenda] = useState<Agenda | null>(null);
  
  const { roomName } = useOriginalStreamContext();
  const { agendas, getStreamAgenda, isLoading } = useGetStreamAgenda();
  const { activeAddons } = useStreamAddons();

  console.log('StreamProvider:', { 
    activeAgendaId, 
    agendas: agendas?.length,
    activeAddonType,
    isParticipationAvailable 
  });

  // Sync addon state whenever activeAddons changes
  const syncAddonState = useCallback(() => {
    console.log('Syncing addon state:', activeAddons);
    
    // Check which addon is currently active
    const activePoll = activeAddons?.Poll?.isActive;
    const activeQuiz = activeAddons?.Quiz?.isActive;
    const activeQA = activeAddons?.["Q&A"]?.isActive;
    
    let currentAddonType: AddonType | null = null;
    let currentParticipationData: any = null;
    
    if (activePoll) {
      currentAddonType = 'Poll' as AddonType;
      currentParticipationData = activeAddons.Poll?.data;
    } else if (activeQuiz) {
      currentAddonType = 'Quiz' as AddonType;
      currentParticipationData = activeAddons.Quiz?.data;
    } else if (activeQA) {
      currentAddonType = 'Q&A' as AddonType;
      currentParticipationData = activeAddons["Q&A"]?.data;
    }
    
    setActiveAddonType(currentAddonType);
    setParticipationData(currentParticipationData);
    setIsParticipationAvailable(!!currentAddonType);
    
    // Extract agenda ID from addon data if available
    if (currentParticipationData?.agendaId && currentParticipationData.agendaId !== activeAgendaId) {
      console.log('Setting agenda ID from addon data:', currentParticipationData.agendaId);
      setActiveAgendaId(currentParticipationData.agendaId);
    }
    
    // Clear agenda ID when no addon is active
    if (!currentAddonType && activeAgendaId) {
      console.log('No active addon, clearing agenda ID');
      setActiveAgendaId(null);
    }
  }, [activeAddons, activeAgendaId]);

  // Auto-sync addon state whenever activeAddons changes
  useEffect(() => {
    syncAddonState();
  }, [syncAddonState]);

  const clearAddonState = useCallback(() => {
    console.log("Clearing addon state - participants will be redirected");
    setActiveAddonType(null);
    setParticipationData(null);
    setIsParticipationAvailable(false);
    setActiveAgendaId(null);
  }, []);

  // Fetch agendas when roomName is available
  useEffect(() => {
    if (roomName) {
      console.log('Fetching agendas for room:', roomName);
      getStreamAgenda(roomName);
    }
  }, [roomName, getStreamAgenda]);

  const isActive = (agendaId: string): boolean => {
    return activeAgendaId === agendaId;
  };

  const refetchAgendas = () => {
    if (roomName) {
      getStreamAgenda(roomName);
    }
  };

  // Helper to get agenda by ID
  const getAgendaById = useCallback((id: string): Agenda | null => {
    return agendas?.find(agenda => agenda.id === id) || null;
  }, [agendas]);

  // Compute participation tab properties
  const hasActiveAddon = isParticipationAvailable;
  const shouldShowParticipationTab = hasActiveAddon;
  
  let participationTabLabel = "Participate";
  let participationTabIcon = "❓";
  
  if (activeAddonType === 'Poll') {
    participationTabLabel = "Vote in Poll";
    participationTabIcon = "🗳️";
  } else if (activeAddonType === 'Quiz') {
    participationTabLabel = "Take Quiz";
    participationTabIcon = "🧠";
  } else if (activeAddonType === 'Q&A') {
    participationTabLabel = "Join Q&A";
    participationTabIcon = "❓";
  }

  const value: StreamContextValue = {
    // Existing agenda state
    activeAgendaId,
    setActiveAgendaId,
    isActive,
    agendas,
    isLoadingAgendas: isLoading,
    refetchAgendas,
    
    // New addon participation state
    activeAddonType,
    isParticipationAvailable,
    participationData,
    hasActiveAddon,
    
    // Participation indicators
    shouldShowParticipationTab,
    participationTabLabel,
    participationTabIcon,
    
    // Methods
    syncAddonState,
    clearAddonState,
    
    // Response viewing state
    viewingResponsesForAgenda,
    setViewingResponsesForAgenda,
    
    // Helper methods
    getAgendaById,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};