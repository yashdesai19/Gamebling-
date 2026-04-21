import { Navigate, useLocation } from "react-router-dom";

export function isAuthed(): boolean {
  return Boolean(localStorage.getItem("access_token"));
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

