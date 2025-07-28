import { useContext } from "react";
import { StreamContext } from "../context";

export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within StreamProvider');
  }
  return context;
};