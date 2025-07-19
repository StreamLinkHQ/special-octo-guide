// import { useState } from "react";
// import { CallControls, StreamView, useStreamContext } from "@vidbloq/react";
// import Prejoin from "./prejoin";
// import AgendaTabs from "./agenda-tabs";
// import { StreamProvider } from "../context/stream";
// import MeetingView from "./meeting";

// const JoinStreamView = () => {
//   const { token } = useStreamContext();
//   const [showAgenda, setShowAgenda] = useState(false);
//   return (
//     <StreamProvider>
//       {token ? (
//         <>
//           <StreamView>
//             <MeetingView />
//             <CallControls />
//             <button onClick={() => setShowAgenda(true)}>Create Agendas</button>
//           </StreamView>
//         </>
//       ) : (
//         <Prejoin />
//       )}

//       {showAgenda && <AgendaTabs closeFunc={() => setShowAgenda(false)} />}
//     </StreamProvider>
//   );
// };

// export default JoinStreamView;

import { useState } from "react";
import { CallControls, StreamView, useStreamContext } from "@vidbloq/react";
import Prejoin from "./prejoin";
import AgendaTabs from "./agenda-tabs";
import AddonIndicator from "./addon-indicator";
import { StreamProvider } from "../context/stream";
import MeetingView from "./meeting";

const JoinStreamView = () => {
  const { token } = useStreamContext();
  const [showAgenda, setShowAgenda] = useState(false);
  
  return (
    <StreamProvider>
      {token ? (
        <>
          <StreamView>
            <MeetingView />
            <CallControls />
            <button onClick={() => setShowAgenda(true)}>Open Agenda</button>
          </StreamView>
          
          {/* Show addon indicator when modal is closed and addon is active */}
          {!showAgenda && <AddonIndicator onOpenModal={() => setShowAgenda(true)} />}
        </>
      ) : (
        <Prejoin />
      )}

      {showAgenda && <AgendaTabs closeFunc={() => setShowAgenda(false)} />}
    </StreamProvider>
  );
};

export default JoinStreamView;