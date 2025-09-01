import { useEffect, useRef } from 'react';
import { useStreamContext, useTenantContext } from '@vidbloq/react';

/**
 * This hook prevents WebSocket/WebRTC disconnection when users:
 * - Minimize the browser window
 * - Switch to another browser tab
 * - Switch to another application
 * 
 * It works by:
 * 1. Overriding the Page Visibility API to always report "visible"
 * 2. Maintaining aggressive keepalive pings
 * 3. Preventing the browser from throttling the connection
 */
export const useBackgroundConnectionPersistence = (): void => {
  const { websocket } = useTenantContext();
  const { roomName } = useStreamContext();
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!websocket || !roomName) return;

    console.log('Background persistence enabled for room:', roomName);

    // Aggressive keepalive mechanism
    const startKeepAlive = (interval: number = 5000): void => {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }

      keepAliveInterval.current = setInterval(() => {
        if (websocket && 'readyState' in websocket && websocket.readyState === 1) {
          if ('send' in websocket && typeof websocket.send === 'function') {
            websocket.send(JSON.stringify({
              type: 'ping',
              roomName,
              timestamp: Date.now()
            }));
          }
        }
      }, interval);
    };

    // Handle visibility changes without disconnecting
    const handleVisibilityChange = (): void => {
      const isHidden = document.visibilityState === 'hidden';
      
      if (isHidden) {
        // User minimized or switched tabs - maintain connection
        console.log('Browser hidden - maintaining connection with aggressive keepalive');
        startKeepAlive(3000); // More aggressive 3-second interval when hidden
      } else {
        // User returned - back to normal
        console.log('Browser visible - returning to normal keepalive');
        startKeepAlive(10000); // Normal 10-second interval when visible
      }
    };

    // Store original property descriptors
    const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    const originalVisibilityState = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    
    // Override document.hidden to prevent disconnection
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: function(): boolean {
        return false; // Always report as visible
      }
    });
    
    // Override document.visibilityState to prevent disconnection
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: function(): DocumentVisibilityState {
        return 'visible'; // Always report as visible
      }
    });

    // Prevent page from being suspended
    const preventSuspension = (): void => {
      // Create a tiny audio context to prevent browser suspension
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Create a silent audio source
        const source = audioContext.createConstantSource();
        source.offset.value = 0;
        source.connect(audioContext.destination);
        source.start();
        
        // Clean up after 1ms (just enough to prevent suspension)
        setTimeout(() => {
          source.stop();
          audioContext.close();
        }, 1);
      }
    };

    // Run suspension prevention every 20 seconds
    const suspensionInterval = setInterval(preventSuspension, 20000);

    // Start keepalive
    startKeepAlive(10000);
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle beforeunload to save session
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleBeforeUnload = (_e: BeforeUnloadEvent): void => {
      if (websocket && roomName) {
        sessionStorage.setItem('vidbloq_active_call', JSON.stringify({
          roomName,
          timestamp: Date.now()
        }));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
      
      clearInterval(suspensionInterval);
      
      // Restore original property descriptors
      if (originalHidden) {
        Object.defineProperty(document, 'hidden', originalHidden);
      }
      if (originalVisibilityState) {
        Object.defineProperty(document, 'visibilityState', originalVisibilityState);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [websocket, roomName]);
};