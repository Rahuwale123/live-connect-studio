import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getProfile, getToken, setUser } from "@/lib/api";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const token = getToken();
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const profile = await getProfile();
        if (!active) return;
        setUser(profile);
        navigate("/home", { replace: true });
      } catch {
        if (!active) return;
        clearAuth();
        navigate("/login", { replace: true });
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [navigate]);

  return null;
};

export default Index;
