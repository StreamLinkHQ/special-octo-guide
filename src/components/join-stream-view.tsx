import { StreamView, useStreamContext } from "@vidbloq/react";
import { Prejoin } from ".";
import UserView from "./stream/user-view";

const JoinStreamView = () => {
  const { token } = useStreamContext();
  return (
    <>
      {token ? (
        <StreamView>
          <UserView />
        </StreamView>
      ) : (
        <Prejoin />
      )}
    </>
  );
};

export default JoinStreamView;
