import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import Navbar from "./components/Navbar";
import { useAuthStore } from "./store/auth-store";
import Loading from "./components/Loading"

export default function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  const [status, setStatus] = useState({ loading: true, expired: false });
  const location = useLocation();

  useEffect(() => {
    const checkTrial = async () => {
      if (!user) {
        setStatus({ loading: false, expired: false });
        return;
      }

      // Fetch user's trial start date & payment status
      const { data, error } = await supabase
        .from("profiles")
        .select("created_at, is_paid")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.error(error);
        setStatus({ loading: false, expired: false });
        return;
      }

      const trialEnd = new Date(data.created_at);
      trialEnd.setDate(trialEnd.getDate() + 45); // 45-day trial
      const now = new Date();

      const expired = now > trialEnd && !data.is_paid;

      setStatus({ loading: false, expired });
    };

    checkTrial();
  }, [user]);

  // if (status.loading) return <Loading/>;

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Trial expired and unpaid → force to subscribe page
  if (status.expired && location.pathname !== "/subscribe") {
    return (
      <Navigate
        to="/subscribe?expired=true"
        state={{ expired: true }}
        replace
      />
    );
  }

  // Show app content
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
