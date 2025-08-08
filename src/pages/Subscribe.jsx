import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { PaystackButton } from "react-paystack";
import { supabase } from "../services/supabaseClient";
import "../styles/Subscribe.css";

const Subscribe = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const expired = location.search.includes("expired=true");

  const publicKey = "pk_test_xxxxxxxx"; // Replace with your real key
  const amount = 2000 * 100; // in Kobo (₦2000)
  const email = user?.email || "example@example.com";

  const handleSuccess = async (reference) => {
    console.log("Payment successful:", reference);

    const { error } = await supabase
      .from("profiles")
      .update({ is_paid: true })
      .eq("auth_id", user?.id);

    if (!error) {
      alert("Payment successful! Redirecting...");
      navigate("/dashboard");
    } else {
      alert("Payment was successful, but your account update failed.");
      console.error(error);
    }
  };

  const handleClose = () => {
    alert("Payment window closed.");
  };

  const componentProps = {
    email,
    amount,
    publicKey,
    text: "Upgrade Now (₦2000/month)",
    onSuccess: handleSuccess,
    onClose: handleClose,
  };

  return (
    <div className="subscribe-container">
      {expired && (
        <div className="trial-expired-banner">
          <h2>⏳ Trial Expired</h2>
          <p>Your 45-day free trial has ended. Upgrade now to continue using ShopStack.</p>
        </div>
      )}

      <div className="subscribe-card">
        <h1>Upgrade to ShopStack Premium</h1>
        <p>Enjoy unlimited access for just <strong>₦2000/month</strong>.</p>

        <PaystackButton className="paystack-button" {...componentProps} />

        <p className="secure-note">🔒 Payments are processed securely via Paystack</p>
      </div>
    </div>
  );
};

export default Subscribe;
