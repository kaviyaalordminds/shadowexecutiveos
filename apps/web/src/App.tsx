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
  const { status, devBypass } = useAuth();
  // In bypass mode `status` is always "authed" by design, but /login must
  // stay directly reachable (it's only the default entry point that's
  // bypassed, not the route itself) — so skip the redirect in that case.
  if (status === "authed" && !devBypass) return <Navigate to="/dashboard" replace />;
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
