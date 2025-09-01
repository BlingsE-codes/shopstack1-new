import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
// import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import { supabase } from "../services/supabaseClient";

import { FlutterWaveButton } from 'flutterwave-react-v3';

import "../styles/Subscribe.css";

const Subscribe = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const expired = location.search.includes("expired=true");

  const config = {
    public_key: "https://sandbox.flutterwave.com/pay/4z3yznqakv2y", // Replace with your Flutterwave public key
    tx_ref: Date.now().toString(),
    amount: 2000,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: user?.email || "example@example.com",
      phonenumber: user?.phone || "08000000000",
      name: user?.full_name || "ShopStack User",
    },
    customizations: {
      title: "ShopStack Premium Subscription",
      description: "Upgrade to ShopStack Premium",
      logo: "https://yourdomain.com/logo.png", // Optional: your logo URL
    },
  };

  const handleFlutterwaveResponse = async (response) => {
    if (response.status === "successful") {
      // Close the modal
      // closePaymentModal();

      // Update user payment status in Supabase
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
    } else {
      alert("Payment was not successful. Please try again.");
    }
  };

  const fwConfig = {
    ...config,
    text: "Subscribe",
    callback: handleFlutterwaveResponse,
    onClose: () => alert("Payment window closed."),
  };

  return (
    <div className="subscribe-container">
      {expired && (
        <div className="trial-expired-banner">
          <h2>⏳ Trial Expired</h2>
          <p>Your 30-day free trial has ended. Upgrade now to continue using ShopStack.</p>
        </div>
      )}

      <div className="subscribe-card">
        <h1>Upgrade to ShopStack Premium</h1>
        <p>
          Enjoy unlimited access for just <strong>₦2000/month</strong>.
        </p>

        <FlutterWaveButton className="flutterwave-button" {...fwConfig} />

        <p className="secure-note">🔒 Payments are processed securely via Flutterwave</p>
      </div>
    </div>
  );
};

export default Subscribe;
