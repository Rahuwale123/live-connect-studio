import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { clearAuth, getProfile, getToken, setUser } from "@/lib/api";

const RequireAuth = () => {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let active = true;

    async function verify() {
      const token = getToken();
      if (!token) {
        if (active) setStatus("denied");
        return;
      }

      try {
        const profile = await getProfile();
        if (!active) return;
        setUser(profile);
        setStatus("allowed");
      } catch {
        clearAuth();
        if (active) setStatus("denied");
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "denied") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
