/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { 
  useGetStreamAgenda, 
  useStreamContext as useOriginalStreamContext,
  useStreamAddons,
  useGetAgenda,
  useGetQuizQuestions,
  useUpdateStreamAgenda,
  useRequirePublicKey,
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
  
  // Preloaded data cache
  preloadedPollData: any | null;
  preloadedQuizData: any | null;
  isPreloadingPoll: boolean;
  isPreloadingQuiz: boolean;
  
  // Timer state for auto-stop
  remainingTime: number | null;
  isTimerRunning: boolean;
  
  // Method to mark agenda as completed
  markAgendaAsCompleted: (agendaId: string) => Promise<boolean>;
}

export const StreamContext = createContext<StreamContextValue | undefined>(undefined);

// Provider component props
interface StreamProviderProps {
  children: ReactNode;
}

// Provider component - now manages addon participation state globally and auto-stop timer
export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const [activeAgendaId, setActiveAgendaId] = useState<string | null>(null);
  
  // New addon participation state
  const [activeAddonType, setActiveAddonType] = useState<AddonType | null>(null);
  const [participationData, setParticipationData] = useState<any>(null);
  const [isParticipationAvailable, setIsParticipationAvailable] = useState(false);
  
  // Response viewing state
  const [viewingResponsesForAgenda, setViewingResponsesForAgenda] = useState<Agenda | null>(null);
  
  // Preloaded data cache
  const [preloadedPollData, setPreloadedPollData] = useState<any | null>(null);
  const [preloadedQuizData, setPreloadedQuizData] = useState<any | null>(null);
  const [isPreloadingPoll, setIsPreloadingPoll] = useState(false);
  const [isPreloadingQuiz, setIsPreloadingQuiz] = useState(false);
  
  // Timer state for auto-stop
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAgendaRef = useRef<Agenda | null>(null);
  
  // Track which agenda IDs we've already preloaded
  const preloadedAgendaIds = useRef<Set<string>>(new Set());
  
  const { roomName } = useOriginalStreamContext();
  const { agendas, getStreamAgenda, isLoading } = useGetStreamAgenda();
  const { activeAddons, stopAddon } = useStreamAddons();
  const { publicKey } = useRequirePublicKey();
  const { updateStreamAgenda } = useUpdateStreamAgenda();
  
  // Hooks for preloading
  const { getAgenda: getPollAgenda } = useGetAgenda();
  const { getQuizQuestions } = useGetQuizQuestions();

  console.log('StreamProvider:', { 
    activeAgendaId, 
    agendas: agendas?.length,
    activeAddonType,
    isParticipationAvailable,
    preloadedPollData: !!preloadedPollData,
    preloadedQuizData: !!preloadedQuizData,
    remainingTime,
    isTimerRunning
  });

  // Helper to get agenda by ID
  const getAgendaById = useCallback((id: string): Agenda | null => {
    return agendas?.find(agenda => agenda.id === id) || null;
  }, [agendas]);

  // Method to mark agenda as completed using the update endpoint
  const markAgendaAsCompleted = useCallback(async (agendaId: string): Promise<boolean> => {
    if (!publicKey) {
      console.error('No public key available to mark agenda as completed');
      return false;
    }

    try {
      console.log(`Marking agenda ${agendaId} as completed`);
      
      // Use the update endpoint to set isCompleted to true
      const result = await updateStreamAgenda(agendaId, {
        wallet: publicKey.toString(),
        isCompleted: true
      });

      if (result) {
        console.log('Agenda marked as completed successfully');
        // Refresh the agendas list to reflect the change
        if (roomName) {
          getStreamAgenda(roomName);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error marking agenda as completed:', error);
      return false;
    }
  }, [publicKey, updateStreamAgenda, roomName]);

  // Auto-stop function when timer expires
  const handleTimerExpired = useCallback(async () => {
    console.log('Timer expired, auto-stopping addon:', activeAddonType);
    
    if (activeAddonType && activeAgendaId) {
      try {
        // Mark as completed first
        await markAgendaAsCompleted(activeAgendaId);
        
        // Then stop the addon
        await stopAddon(activeAddonType);
        console.log('Addon auto-stopped successfully');
        
        // Force clear all addon state after auto-stop
        setTimeout(() => {
          clearAddonState();
          // Force a re-sync to ensure UI updates
          syncAddonState();
        }, 100);
      } catch (error) {
        console.error('Error auto-stopping addon:', error);
      }
    }
    
    // Clear timer state
    setIsTimerRunning(false);
    setRemainingTime(null);
    activeAgendaRef.current = null;
  }, [activeAddonType, activeAgendaId, stopAddon, markAgendaAsCompleted]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && remainingTime !== null && remainingTime > 0) {
      timerRef.current = setTimeout(() => {
        setRemainingTime(prev => {
          if (prev === null || prev <= 1) {
            // Timer expired
            handleTimerExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, remainingTime, handleTimerExpired]);

  // Start timer when agenda with duration becomes active
  const startAgendaTimer = useCallback((agenda: Agenda) => {
    if (agenda.duration && Number(agenda.duration) > 0) {
      const durationInSeconds = Number(agenda.duration) * 60; // Convert minutes to seconds
      console.log(`Starting auto-stop timer for agenda ${agenda.id}: ${agenda.duration} minutes`);
      
      setRemainingTime(durationInSeconds);
      setIsTimerRunning(true);
      activeAgendaRef.current = agenda;
    }
  }, []);

  // Stop timer
  const stopAgendaTimer = useCallback(() => {
    console.log('Stopping agenda timer');
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setIsTimerRunning(false);
    setRemainingTime(null);
    activeAgendaRef.current = null;
  }, []);

  // Preload addon data when an addon becomes active
  const preloadAddonData = useCallback(async (addonType: AddonType, agendaId: string) => {
    // Skip if already preloaded
    if (preloadedAgendaIds.current.has(agendaId)) {
      console.log(`Data for agenda ${agendaId} already preloaded, skipping`);
      return;
    }

    console.log(`Preloading ${addonType} data for agenda ${agendaId}`);
    
    try {
      if (addonType === 'Poll') {
        setIsPreloadingPoll(true);
        const pollData = await getPollAgenda(agendaId);
        setPreloadedPollData(pollData);
        preloadedAgendaIds.current.add(agendaId);
        console.log('Poll data preloaded:', pollData);
      } else if (addonType === 'Quiz') {
        setIsPreloadingQuiz(true);
        const quizData = await getQuizQuestions(agendaId);
        setPreloadedQuizData(quizData);
        preloadedAgendaIds.current.add(agendaId);
        console.log('Quiz data preloaded:', quizData);
      }
    } catch (error) {
      console.error(`Error preloading ${addonType} data:`, error);
    } finally {
      if (addonType === 'Poll') {
        setIsPreloadingPoll(false);
      } else if (addonType === 'Quiz') {
        setIsPreloadingQuiz(false);
      }
    }
  }, [getPollAgenda, getQuizQuestions]);

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
    
    // Check if addon state changed
    const addonChanged = currentAddonType !== activeAddonType;
    
    setActiveAddonType(currentAddonType);
    setParticipationData(currentParticipationData);
    setIsParticipationAvailable(!!currentAddonType);
    
    // Extract agenda ID from addon data if available
    if (currentParticipationData?.agendaId) {
      const newAgendaId = currentParticipationData.agendaId;
      
      if (newAgendaId !== activeAgendaId) {
        console.log('Setting agenda ID from addon data:', newAgendaId);
        setActiveAgendaId(newAgendaId);
        
        // Start timer if this is a new agenda with duration
        const agenda = getAgendaById(newAgendaId);
        if (agenda && addonChanged) {
          startAgendaTimer(agenda);
        }
      }
      
      // Preload data as soon as addon becomes active
      if (currentAddonType && (currentAddonType === 'Poll' || currentAddonType === 'Quiz')) {
        preloadAddonData(currentAddonType, newAgendaId);
      }
    }
    
    // Clear agenda ID and stop timer when no addon is active
    if (!currentAddonType && activeAgendaId) {
      console.log('No active addon, clearing agenda ID and stopping timer');
      setActiveAgendaId(null);
      stopAgendaTimer();
    }
  }, [activeAddons, activeAgendaId, activeAddonType, preloadAddonData, getAgendaById, startAgendaTimer, stopAgendaTimer]);

  // Auto-sync addon state whenever activeAddons changes
  useEffect(() => {
    syncAddonState();
  }, [syncAddonState]);

  // Clear addon state - now also marks agenda as completed
  const clearAddonState = useCallback(async () => {
    console.log("Clearing addon state - participants will be redirected");
    
    // Mark the current agenda as completed before clearing
    if (activeAgendaId) {
      await markAgendaAsCompleted(activeAgendaId);
    }
    
    setActiveAddonType(null);
    setParticipationData(null);
    setIsParticipationAvailable(false);
    setActiveAgendaId(null);
    stopAgendaTimer();
    // Note: We intentionally don't clear preloaded data here
    // so it remains cached for future use
  }, [stopAgendaTimer, activeAgendaId, markAgendaAsCompleted]);

  // Clear preloaded data when agenda changes
  useEffect(() => {
    if (!activeAgendaId) {
      // When no agenda is active, clear the cache after a delay
      // This gives time for transitions but prevents memory bloat
      const timer = setTimeout(() => {
        if (!activeAgendaId) { // Double-check it's still inactive
          console.log('Clearing preloaded data cache');
          setPreloadedPollData(null);
          setPreloadedQuizData(null);
          preloadedAgendaIds.current.clear();
        }
      }, 30000); // Clear after 30 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [activeAgendaId]);

  // Fetch agendas when roomName is available
  useEffect(() => {
    if (roomName) {
      console.log('Fetching agendas for room:', roomName);
      getStreamAgenda(roomName);
    }
  }, [roomName]);

  const isActive = (agendaId: string): boolean => {
    return activeAgendaId === agendaId;
  };

  const refetchAgendas = () => {
    if (roomName) {
      getStreamAgenda(roomName);
    }
  };

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
    
    // Preloaded data
    preloadedPollData,
    preloadedQuizData,
    isPreloadingPoll,
    isPreloadingQuiz,
    
    // Timer state
    remainingTime,
    isTimerRunning,
    
    // Completion method
    markAgendaAsCompleted,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};