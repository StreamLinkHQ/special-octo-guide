import { useBackgroundConnectionPersistence } from "../../hooks/index";

const BackgroundPersistence = () => {
  useBackgroundConnectionPersistence();
  return null; // No UI, just the persistence logic
};

export default BackgroundPersistence;