import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VidbloqProvider } from "@vidbloq/react";
import { Toaster } from "react-hot-toast";
import { Login, CreateStream, JoinStream } from "./pages";
import { WalletProvider } from "./context";
import { ProtectedRoute } from "./components";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  {
    path: "/create",
    element: (
      <ProtectedRoute>
        <CreateStream />
      </ProtectedRoute>
    ),
  },
  {
    path: "/:id",
    element: (
      <ProtectedRoute>
        <JoinStream />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return (
    <>
      <VidbloqProvider
        apiKey="sk_5fa927d2ad021016ae36b2656fbf8085"
        apiSecret="iO24O0xXjuXSsIhfLorPKRS2NvcWjbRswYLcnYAvxk4="
      >
        <WalletProvider>
          <RouterProvider router={router} />
        </WalletProvider>
      </VidbloqProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
