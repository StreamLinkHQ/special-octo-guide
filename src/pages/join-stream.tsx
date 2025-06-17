import { StreamRoom } from "@vidbloq/react";
import { useParams } from "react-router-dom";
import { JoinStreamView } from "../components";

const JoinStream = () => {
  const { id } = useParams();

  return (
    <StreamRoom roomName={id as string}>
      <JoinStreamView />
    </StreamRoom>
  );
};

export default JoinStream;
