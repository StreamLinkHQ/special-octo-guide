import { useContext } from "react"
import { ContestConfigContext } from "../context";

export const useContestConfig = () => {
  const context = useContext(ContestConfigContext);
  if (!context) {
    throw new Error(
      "useContestConfig must be used within ContestConfigProvider"
    );
  }
  return context;
};
