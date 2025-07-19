import { useContext } from "react";
import { StreamContext } from "../context/stream";
// import type { StreamContextValue } from "../types";


// export const useStream = (): StreamContextValue => {
//   const context = useContext(StreamContext);
  
//   if (context === undefined) {
//     throw new Error('useStream must be used within a StreamProvider');
//   }
  
//   return context;
// };

// Custom hook to use the enhanced context
export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within StreamProvider');
  }
  return context;
};