import { useState, useEffect, useRef } from "react";
import { useStreamContext, useParticipantControls, type SDKParticipant } from "@vidbloq/react";
// import { GuestRequest } from "../types";

export type GuestRequest = {
  participantId: string;
  name: string;
  walletAddress: string;
};

interface RequestCardProps {
  request: GuestRequest;
  onRemove: (participantId: string) => void;
}

const RequestCard = ({ request, onRemove }: RequestCardProps) => {
  const { websocket, roomName, userType } = useStreamContext();
  const { participantId, name, walletAddress } = request;
  const [isRemoved, setIsRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create a participant object that matches what useParticipantControls expects
  const participantForHook = {
    sid: '', // We don't have this from the request, but it's required by the type
    identity: participantId,
    metadata: JSON.stringify({
      userName: name || participantId,
      walletAddress: walletAddress,
      userType: 'guest', // Guest requests are always from guests
    }),
    isLocal: false,
  };

  // Use the participant controls hook
  const controls = useParticipantControls({
    participant: participantForHook as SDKParticipant,
    isLocal: false,
  });

  // Use ref to track if this request has been processed to prevent duplicate actions
  const processedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log(`RequestCard for ${participantId} unmounted`);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [participantId]);

  // Listen for WebSocket updates to remove this card when the request is actually processed
  useEffect(() => {
    if (!websocket) return;

    const handleGuestRequestsUpdate = (requests: GuestRequest[]) => {
      // Check if this specific request is no longer in the list
      const requestStillExists = requests.some(req => req.participantId === participantId);
      
      if (!requestStillExists && processedRef.current) {
        console.log(`Request for ${participantId} removed from server state, hiding card`);
        
        // Clear timeout since we got the update
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsRemoved(true);
        onRemove(participantId);
      }
    };

    websocket.addEventListener("guestRequestsUpdate", handleGuestRequestsUpdate);

    return () => {
      websocket.removeEventListener("guestRequestsUpdate", handleGuestRequestsUpdate);
    };
  }, [websocket, participantId, onRemove]);

  // Early returns AFTER all hooks
  if (isRemoved) {
    return null;
  }

  // Only show the request card if the current user is a host
  if (userType !== "host") return null;

  // Handle accepting a guest's request to speak using the hook
  const handleAccept = async () => {
    if (processedRef.current) {
      console.log(`Request for ${participantId} already being processed`);
      return;
    }

    if (!websocket || !websocket.isConnected) {
      setError("WebSocket not connected");
      return;
    }

    // Mark as processing to prevent duplicate actions
    processedRef.current = true;
    setError(null);

    try {
      console.log(`Accepting speaking request for ${participantId} in ${roomName}`);
      
      // Use the promoteParticipant function from the hook
      const result = await controls.promoteParticipant();
      
      if (result.success) {
        console.log("Permission update successful for", participantId);
        
        // Set a timeout to remove the card if WebSocket doesn't update quickly enough
        timeoutRef.current = setTimeout(() => {
          console.log(`Timeout reached, removing request card for ${participantId}`);
          setIsRemoved(true);
          onRemove(participantId);
        }, 3000); // 3 second timeout
      } else {
        // Reset processing state on error
        processedRef.current = false;
        setError(result.error || "Failed to accept request");
      }
    } catch (error) {
      console.error("Error accepting guest request:", error);
      
      // Reset processing state on error
      processedRef.current = false;
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Handle rejecting a guest's request to speak
  const handleReject = async () => {
    if (processedRef.current) {
      console.log(`Request for ${participantId} already being processed`);
      return;
    }

    if (!websocket || !websocket.isConnected) {
      setError("WebSocket not connected");
      return;
    }

    // Mark as processing to prevent duplicate actions
    processedRef.current = true;
    setError(null);
    
    try {
      console.log(`Rejecting speaking request for ${participantId} in ${roomName}`);
      
      // Use WebSocket to remove the request
      websocket.returnToGuest(roomName, participantId);
      
      // Set a timeout to remove the card if WebSocket doesn't update quickly enough
      timeoutRef.current = setTimeout(() => {
        console.log(`Timeout reached, removing rejected request card for ${participantId}`);
        setIsRemoved(true);
        onRemove(participantId);
      }, 2000); // 2 second timeout for rejection
      
    } catch (error) {
      console.error("Error rejecting guest request:", error);
      
      // Reset processing state on error
      processedRef.current = false;
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-4 mb-2 w-60">
      <h3 className="text-md font-semibold">{name || participantId}</h3>
      <p className="text-xs text-gray-500 mb-4">Wants to speak</p>
      
      {error && (
        <p className="text-red-400 text-xs mb-2">{error}</p>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={handleReject}
          disabled={controls.isPromoting || processedRef.current}
          className={`bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs hover:bg-red-200 transition-colors ${
            controls.isPromoting || processedRef.current ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {controls.isPromoting ? 'Processing...' : 'Decline'}
        </button>
        <button
          onClick={handleAccept}
          disabled={controls.isPromoting || processedRef.current}
          className={`bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs hover:bg-green-200 transition-colors ${
            controls.isPromoting || processedRef.current ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {controls.isPromoting ? 'Processing...' : 'Accept'}
        </button>
      </div>
    </div>
  );
};

export default RequestCard;