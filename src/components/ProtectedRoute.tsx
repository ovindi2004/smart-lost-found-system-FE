import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactElement } from "react";

interface ProtectedRouteProps {
  children: ReactElement;
  requiredRole?: "USER" | "ADMIN";
}

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === "ADMIN" && currentUser?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
