import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VidbloqProvider } from "@vidbloq/react";
import { Toaster } from "react-hot-toast";
import { Login, CreateStream, JoinStream, Profile } from "./pages";
import { WalletProvider, AuthProvider } from "./context";
import { ProtectedRoute } from "./components";

function App() {
  return (
    <>
      <VidbloqProvider
        apiKey="sk_8f337b8a16c6c3519af1d98feaf4fe58"
        apiSecret="7sL2hNTCTWhL8s1FpqOJNB6nimKyl5kBpuR/tzRnW24="
      >
        <BrowserRouter>
          <WalletProvider>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route
                  path="/create"
                  element={
                    <ProtectedRoute>
                      <CreateStream />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:id"
                  element={
                    <ProtectedRoute>
                      <JoinStream />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </WalletProvider>
        </BrowserRouter>
      </VidbloqProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
