import { StreamView, useStreamContext } from "@vidbloq/react";
import { Prejoin } from ".";

const JoinStreamView = () => {
  const { token } = useStreamContext();
  return <>{token ? <StreamView /> : <Prejoin />}</>;
};

export default JoinStreamView;
