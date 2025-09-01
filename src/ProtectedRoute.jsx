import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import Navbar from "./components/Navbar";
import { useAuthStore } from "./store/auth-store";
import Loading from "./components/Loading";

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

      try {
        // fetch trial info from profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("created_at, is_paid")
          .eq("auth_id", user.id) // ✅ ensure consistent column
          .single();

        if (error || !data) {
          console.log(data);
          console.log(user);
          
          console.error("Profile fetch error:", error);
          setStatus({ loading: false, expired: false });
          return;
        }

        const trialEnd = new Date(data.created_at);
        console.log(trialEnd)
        trialEnd.setDate(trialEnd.getDate() + 30); // -day trial
        console.log(trialEnd)
        const now = new Date();

        const expired = now > trialEnd && !data.is_paid;
        console.log("check here", now > trialEnd);
        console.log("Fetched profile:", data);
        console.log("Trial ends on:", trialEnd.toISOString());
        console.log("Expired:", expired);

        setStatus({ loading: false, expired });
        console.log(status);
      } catch (err) {
        console.error("Unexpected error checking trial:", err);
        setStatus({ loading: false, expired: false });
      }
    };

    checkTrial();
  }, [user]);

  // 🔄 show loader while verifying status
  if (status.loading) {
    return <Loading />;
  }

  // 🚪 Not logged in → go to login
  else if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // ⛔ Trial expired and unpaid → redirect to subscribe page
  else if (status.expired && location.pathname !== "/subscribe") {
    return (
      <Navigate
        to="/subscribe"
        state={{ expired: true }}
        replace
      />
    );
  }

  // ✅ Otherwise, render app with Navbar
  return (
    <div>
      <Navbar /> 
      {children}
    </div>
  );
}
