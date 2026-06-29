import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | null;
}

const ProtectedRoute = ({ children, requiredRole = null }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!requiredRole) return <>{children}</>;

  const roles: string[] = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  const normalizedRoles = roles.map((role: string) => String(role).toUpperCase());
  const hasAccess: boolean =
    normalizedRoles.includes(requiredRole.toUpperCase()) ||
    (requiredRole.toUpperCase() === "INSTRUCTOR" &&
      normalizedRoles.includes("ADMIN")) ||
    (requiredRole.toUpperCase() === "STUDENT" &&
      (normalizedRoles.includes("ADMIN") || normalizedRoles.includes("INSTRUCTOR")));

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Access denied</h1>
          <p className="text-gray-500 mt-2">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
