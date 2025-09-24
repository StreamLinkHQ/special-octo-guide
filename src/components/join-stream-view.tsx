import { StreamView, useStreamContext } from "@vidbloq/react";
import { Prejoin } from ".";
import UserView from "./stream/user-view";

const JoinStreamView = () => {
  const { token } = useStreamContext();
  return (
    <>
      {token ? (
        <div className="h-screen">
          <StreamView>
            <UserView />
          </StreamView>
        </div>
      ) : (
        <Prejoin />
      )}
    </>
  );
};

export default JoinStreamView;
