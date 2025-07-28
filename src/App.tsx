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
        apiKey="sk_c061e1d6fa8b1438226b1cc8b8764136"
        apiSecret="ZHJEEBSlufheOxXnrMdrBp5QepVf+UAVOaLAUKHa+14="
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
