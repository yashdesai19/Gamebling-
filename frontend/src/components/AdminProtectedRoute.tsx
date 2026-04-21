import { Navigate } from "react-router-dom";

export function isAdminAuthed(): boolean {
  return Boolean(localStorage.getItem("admin_access_token"));
}

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) return <Navigate to="/admin/login" replace />;
  return children;
}

