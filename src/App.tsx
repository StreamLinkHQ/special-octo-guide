import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VidbloqProvider } from "@vidbloq/react";
import { Toaster } from "react-hot-toast";
import { Login, CreateStream, JoinStream, Profile } from "./pages";
import { WalletProvider, AuthProvider } from "./context";
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
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
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
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </WalletProvider>
      </VidbloqProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
