import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import { getToken } from "./api/client";

export default function App() {
  const [authed, setAuthed] = useState<boolean>(!!getToken());

  return (
    <Routes>
      <Route
        path="/login"
        element={authed ? <Navigate to="/chat" /> : <LoginPage onAuthed={() => setAuthed(true)} />}
      />
      <Route
        path="/chat"
        element={
          authed ? (
            <ChatPage onLogout={() => setAuthed(false)} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to={authed ? "/chat" : "/login"} />} />
    </Routes>
  );
}
