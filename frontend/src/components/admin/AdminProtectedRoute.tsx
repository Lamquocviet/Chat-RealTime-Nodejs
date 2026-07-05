import { useAuthStore } from "@/stores/useAuthStore";
import { Navigate, Outlet } from "react-router";

const AdminProtectedRoute = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
