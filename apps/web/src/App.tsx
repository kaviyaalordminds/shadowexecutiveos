import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import CommandCenterPage from "./pages/CommandCenterPage";
import CmoPage from "./pages/CmoPage";
import CfoPage from "./pages/CfoPage";
import StubAgentPage from "./pages/StubAgentPage";
import ExecutiveShell from "./components/ExecutiveShell";
import NetworkBackground from "./components/NetworkBackground";

function LoginRoute() {
  const { status } = useAuth();
  if (status === "authed") return <Navigate to="/dashboard" replace />;
  return (
    <>
      <NetworkBackground />
      <LoginPage />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/dashboard"
          element={
            <ExecutiveShell>
              <CommandCenterPage />
            </ExecutiveShell>
          }
        />
        <Route
          path="/agents/cmo"
          element={
            <ExecutiveShell>
              <CmoPage />
            </ExecutiveShell>
          }
        />
        <Route
          path="/agents/cfo"
          element={
            <ExecutiveShell>
              <CfoPage />
            </ExecutiveShell>
          }
        />
        <Route
          path="/agents/:key"
          element={
            <ExecutiveShell>
              <StubAgentPage />
            </ExecutiveShell>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
