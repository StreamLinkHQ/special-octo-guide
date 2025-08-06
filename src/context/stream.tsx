/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { 
  useGetStreamAgenda, 
  useStreamContext as useOriginalStreamContext,
  useStreamAddons,
  useGetAgenda,
  useGetQuizQuestions,
  useGetPollResults,
  useGetQuizResults,
  useUpdateStreamAgenda,
  useRequirePublicKey,
  type Agenda,
  type AddonType 
} from '@vidbloq/react';

// Enhanced context value type with response data caching
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
  
  // Enhanced preloaded data cache for participation
  preloadedPollData: any | null;
  preloadedQuizData: any | null;
  isPreloadingPoll: boolean;
  isPreloadingQuiz: boolean;
  
  // NEW: Response data cache for viewing results
  responseCache: Map<string, {
    type: 'poll' | 'quiz';
    data: any;
    timestamp: number;
    isLoading: boolean;
  }>;
  
  // NEW: Methods for response data management
  getResponseData: (agendaId: string, type: 'poll' | 'quiz') => any | null;
  preloadResponseData: (agendaId: string, type: 'poll' | 'quiz') => Promise<void>;
  isResponseDataLoading: (agendaId: string) => boolean;
  clearResponseCache: (agendaId?: string) => void;
  
  // Timer state for auto-stop
  remainingTime: number | null;
  isTimerRunning: boolean;
  
  // Method to mark agenda as completed
  markAgendaAsCompleted: (agendaId: string) => Promise<boolean>;
}

export const StreamContext = createContext<StreamContextValue | undefined>(undefined);

interface StreamProviderProps {
  children: ReactNode;
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const [activeAgendaId, setActiveAgendaId] = useState<string | null>(null);
  
  // Addon participation state
  const [activeAddonType, setActiveAddonType] = useState<AddonType | null>(null);
  const [participationData, setParticipationData] = useState<any>(null);
  const [isParticipationAvailable, setIsParticipationAvailable] = useState(false);
  
  // Response viewing state
  const [viewingResponsesForAgenda, setViewingResponsesForAgenda] = useState<Agenda | null>(null);
  
  // Preloaded data cache for participation
  const [preloadedPollData, setPreloadedPollData] = useState<any | null>(null);
  const [preloadedQuizData, setPreloadedQuizData] = useState<any | null>(null);
  const [isPreloadingPoll, setIsPreloadingPoll] = useState(false);
  const [isPreloadingQuiz, setIsPreloadingQuiz] = useState(false);
  
  // NEW: Response data cache with Map for better performance
  const [responseCache, setResponseCache] = useState<Map<string, {
    type: 'poll' | 'quiz';
    data: any;
    timestamp: number;
    isLoading: boolean;
  }>>(new Map());
  
  // Timer state
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAgendaRef = useRef<Agenda | null>(null);
  
  // Track preloaded agenda IDs
  const preloadedAgendaIds = useRef<Set<string>>(new Set());
  const responsePreloadQueue = useRef<Set<string>>(new Set());
  
  const { roomName } = useOriginalStreamContext();
  const { agendas, getStreamAgenda, isLoading } = useGetStreamAgenda();
  const { activeAddons, stopAddon } = useStreamAddons();
  const { publicKey } = useRequirePublicKey();
  const { updateStreamAgenda } = useUpdateStreamAgenda();
  
  // Hooks for preloading
  const { getAgenda: getPollAgenda } = useGetAgenda();
  const { getQuizQuestions } = useGetQuizQuestions();
  
  // NEW: Hooks for getting response data
  const { getPollResults } = useGetPollResults();
  const { getQuizResults } = useGetQuizResults();

  // Helper to get agenda by ID
  const getAgendaById = useCallback((id: string): Agenda | null => {
    return agendas?.find(agenda => agenda.id === id) || null;
  }, [agendas]);

  // NEW: Get cached response data
  const getResponseData = useCallback((agendaId: string, type: 'poll' | 'quiz'): any | null => {
    const cacheKey = `${agendaId}-${type}`;
    const cached = responseCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      // Cache expired, remove it
      const newCache = new Map(responseCache);
      newCache.delete(cacheKey);
      setResponseCache(newCache);
      return null;
    }
    
    return cached.data;
  }, [responseCache]);

  // NEW: Check if response data is currently loading
  const isResponseDataLoading = useCallback((agendaId: string): boolean => {
    const pollKey = `${agendaId}-poll`;
    const quizKey = `${agendaId}-quiz`;
    
    const pollCache = responseCache.get(pollKey);
    const quizCache = responseCache.get(quizKey);
    
    return (pollCache?.isLoading || false) || (quizCache?.isLoading || false);
  }, [responseCache]);

  // NEW: Preload response data in background
  const preloadResponseData = useCallback(async (agendaId: string, type: 'poll' | 'quiz') => {
    const cacheKey = `${agendaId}-${type}`;
    
    // Check if already loading or cached
    const existing = responseCache.get(cacheKey);
    if (existing?.isLoading) {
      console.log(`Already loading ${type} results for ${agendaId}`);
      return;
    }
    
    // Check if cache is still valid
    if (existing && (Date.now() - existing.timestamp < CACHE_TTL)) {
      console.log(`Using cached ${type} results for ${agendaId}`);
      return;
    }
    
    console.log(`Preloading ${type} results for agenda ${agendaId}`);
    
    // Mark as loading
    const newCache = new Map(responseCache);
    newCache.set(cacheKey, {
      type,
      data: existing?.data || null,
      timestamp: existing?.timestamp || Date.now(),
      isLoading: true
    });
    setResponseCache(newCache);
    
    try {
      let data = null;
      
      if (type === 'poll') {
        data = await getPollResults(agendaId);
      } else if (type === 'quiz') {
        data = await getQuizResults(agendaId);
      }
      
      // Update cache with loaded data
      const updatedCache = new Map(responseCache);
      updatedCache.set(cacheKey, {
        type,
        data,
        timestamp: Date.now(),
        isLoading: false
      });
      setResponseCache(updatedCache);
      
      console.log(`Successfully preloaded ${type} results for ${agendaId}`);
    } catch (error) {
      console.error(`Error preloading ${type} results:`, error);
      
      // Mark as not loading on error
      const updatedCache = new Map(responseCache);
      const current = updatedCache.get(cacheKey);
      if (current) {
        updatedCache.set(cacheKey, {
          ...current,
          isLoading: false
        });
        setResponseCache(updatedCache);
      }
    }
  }, [responseCache, getPollResults, getQuizResults]);

  // NEW: Clear response cache
  const clearResponseCache = useCallback((agendaId?: string) => {
    if (agendaId) {
      const newCache = new Map(responseCache);
      newCache.delete(`${agendaId}-poll`);
      newCache.delete(`${agendaId}-quiz`);
      setResponseCache(newCache);
      console.log(`Cleared response cache for agenda ${agendaId}`);
    } else {
      setResponseCache(new Map());
      console.log('Cleared all response cache');
    }
  }, [responseCache]);

  // Mark agenda as completed
  const markAgendaAsCompleted = useCallback(async (agendaId: string): Promise<boolean> => {
    if (!publicKey) {
      console.error('No public key available to mark agenda as completed');
      return false;
    }

    try {
      console.log(`Marking agenda ${agendaId} as completed`);
      
      const result = await updateStreamAgenda(agendaId, {
        wallet: publicKey.toString(),
        isCompleted: true
      });

      if (result) {
        console.log('Agenda marked as completed successfully');
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
  }, [publicKey, updateStreamAgenda, roomName, getStreamAgenda]);

  // Timer management
  const handleTimerExpired = useCallback(async () => {
    console.log('Timer expired, auto-stopping addon:', activeAddonType);
    
    if (activeAddonType && activeAgendaId) {
      try {
        await markAgendaAsCompleted(activeAgendaId);
        await stopAddon(activeAddonType);
        console.log('Addon auto-stopped successfully');
        
        setTimeout(() => {
          clearAddonState();
          syncAddonState();
        }, 100);
      } catch (error) {
        console.error('Error auto-stopping addon:', error);
      }
    }
    
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

  const startAgendaTimer = useCallback((agenda: Agenda) => {
    if (agenda.duration && Number(agenda.duration) > 0) {
      const durationInSeconds = Number(agenda.duration) * 60;
      console.log(`Starting auto-stop timer for agenda ${agenda.id}: ${agenda.duration} minutes`);
      
      setRemainingTime(durationInSeconds);
      setIsTimerRunning(true);
      activeAgendaRef.current = agenda;
    }
  }, []);

  const stopAgendaTimer = useCallback(() => {
    console.log('Stopping agenda timer');
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setIsTimerRunning(false);
    setRemainingTime(null);
    activeAgendaRef.current = null;
  }, []);

  // Preload addon participation data
  const preloadAddonData = useCallback(async (addonType: AddonType, agendaId: string) => {
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

  // NEW: Background preloading of response data when agenda becomes active or completed
  useEffect(() => {
    if (!agendas) return;
    
    // Find agendas that are active or completed
    const agendasToPreload = agendas.filter(agenda => {
      // Preload if:
      // 1. Agenda is completed
      // 2. Agenda is currently active
      // 3. Agenda has Poll or Quiz action
      const shouldPreload = (
        agenda.isCompleted || 
        (activeAgendaId === agenda.id)
      ) && (
        agenda.action === 'Poll' || 
        agenda.action === 'Quiz'
      );
      
      return shouldPreload;
    });
    
    // Queue preloading for each eligible agenda
    agendasToPreload.forEach(agenda => {
      const queueKey = agenda.id;
      
      // Skip if already in queue
      if (responsePreloadQueue.current.has(queueKey)) return;
      
      responsePreloadQueue.current.add(queueKey);
      
      // Determine type and preload
      const type = agenda.action === 'Poll' ? 'poll' : 'quiz';
      
      // Delay slightly to avoid overwhelming the API
      setTimeout(() => {
        preloadResponseData(agenda.id, type);
        responsePreloadQueue.current.delete(queueKey);
      }, Math.random() * 2000); // Random delay up to 2 seconds
    });
  }, [agendas, activeAgendaId, preloadResponseData]);

  // Sync addon state
  const syncAddonState = useCallback(() => {
    console.log('Syncing addon state:', activeAddons);
    
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
    
    const addonChanged = currentAddonType !== activeAddonType;
    
    setActiveAddonType(currentAddonType);
    setParticipationData(currentParticipationData);
    setIsParticipationAvailable(!!currentAddonType);
    
    if (currentParticipationData?.agendaId) {
      const newAgendaId = currentParticipationData.agendaId;
      
      if (newAgendaId !== activeAgendaId) {
        console.log('Setting agenda ID from addon data:', newAgendaId);
        setActiveAgendaId(newAgendaId);
        
        const agenda = getAgendaById(newAgendaId);
        if (agenda && addonChanged) {
          startAgendaTimer(agenda);
          
          // Preload response data as soon as addon starts
          if (currentAddonType === 'Poll' || currentAddonType === 'Quiz') {
            const type = currentAddonType === 'Poll' ? 'poll' : 'quiz';
            preloadResponseData(newAgendaId, type);
          }
        }
      }
      
      if (currentAddonType && (currentAddonType === 'Poll' || currentAddonType === 'Quiz')) {
        preloadAddonData(currentAddonType, newAgendaId);
      }
    }
    
    if (!currentAddonType && activeAgendaId) {
      console.log('No active addon, clearing agenda ID and stopping timer');
      setActiveAgendaId(null);
      stopAgendaTimer();
    }
  }, [activeAddons, activeAgendaId, activeAddonType, preloadAddonData, getAgendaById, startAgendaTimer, stopAgendaTimer, preloadResponseData]);

  useEffect(() => {
    syncAddonState();
  }, [syncAddonState]);

  const clearAddonState = useCallback(async () => {
    console.log("Clearing addon state - participants will be redirected");
    
    if (activeAgendaId) {
      await markAgendaAsCompleted(activeAgendaId);
    }
    
    setActiveAddonType(null);
    setParticipationData(null);
    setIsParticipationAvailable(false);
    setActiveAgendaId(null);
    stopAgendaTimer();
  }, [stopAgendaTimer, activeAgendaId, markAgendaAsCompleted]);

  // Clean up old cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const newCache = new Map(responseCache);
      let hasChanges = false;
      
      newCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_TTL && !value.isLoading) {
          newCache.delete(key);
          hasChanges = true;
          console.log(`Cleaned up expired cache entry: ${key}`);
        }
      });
      
      if (hasChanges) {
        setResponseCache(newCache);
      }
    }, 60000); // Run cleanup every minute
    
    return () => clearInterval(cleanupInterval);
  }, [responseCache]);

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
    activeAgendaId,
    setActiveAgendaId,
    isActive,
    agendas,
    isLoadingAgendas: isLoading,
    refetchAgendas,
    activeAddonType,
    isParticipationAvailable,
    participationData,
    hasActiveAddon,
    shouldShowParticipationTab,
    participationTabLabel,
    participationTabIcon,
    syncAddonState,
    clearAddonState,
    viewingResponsesForAgenda,
    setViewingResponsesForAgenda,
    getAgendaById,
    preloadedPollData,
    preloadedQuizData,
    isPreloadingPoll,
    isPreloadingQuiz,
    responseCache,
    getResponseData,
    preloadResponseData,
    isResponseDataLoading,
    clearResponseCache,
    remainingTime,
    isTimerRunning,
    markAgendaAsCompleted,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};