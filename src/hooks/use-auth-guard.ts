import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getProfile, setUser, clearAuth } from "@/lib/api";

const useAuthGuard = () => {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function verify() {
      const token = getToken();
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const profile = await getProfile();
        if (!active) return;
        setUser(profile);
        setReady(true);
      } catch (error) {
        clearAuth();
        if (!active) return;
        navigate("/login", { replace: true });
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [navigate]);

  return ready;
};

export default useAuthGuard;
