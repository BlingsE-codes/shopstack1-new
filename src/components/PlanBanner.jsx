// src/components/PlanBanner.jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";

export default function PlanBanner() {
  const { user } = useAuthStore();
  const [daysLeft, setDaysLeft] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchPlanInfo = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("created_at, is_paid")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setIsPaid(data.is_paid);

        const start = new Date(data.created_at);
        const periodDays = data.is_paid ? 30 : 45; // Paid plan = 30 days, Trial = 45 days
        const endDate = new Date(start);
        endDate.setDate(start.getDate() + periodDays);

        const diffTime = endDate - new Date();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDaysLeft(diffDays);
      }
    };

    fetchPlanInfo();

    // Hide banner after 6 seconds
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [user]);

  if (daysLeft === null || !visible) return null;

  let message = "";
  if (isPaid) {
    message = `💳 You are on a paid plan. ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left until renewal.`;
  } else {
    message = `🎉 You are on your free trial. ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left.`;
  }

  return (
    <div
      style={{
        background: isPaid ? "#e6ffed" : "#e6f0ff",
        padding: "12px 20px",
        borderRadius: "8px",
        margin: "16px 0",
        border: `1px solid ${isPaid ? "#b3ffcc" : "#b3d1ff"}`,
        fontWeight: "500",
        color: isPaid ? "#006633" : "#0052cc",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.5s ease",
      }}
    >
      {message}
    </div>
  );
}
