// src/pages/EmailConfirmation.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/EmailConfirmation.css";

export default function EmailConfirmation() {
  const navigate = useNavigate();

  const resendEmail = async () => {
    const user = (await supabase.auth.getUser()).data.user;

    if (user) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        alert("Failed to resend email: " + error.message);
      } else {
        alert("Confirmation email resent.");
      }
    }
  };

  return (
    <div className="email-confirmation-wrapper">
    <div className="email-confirmation-container">
      <h1>📩</h1>
      <h2>  Confirm Your Email</h2>
      <p>
        We've sent a confirmation email to your inbox. Please check it and click the link to activate your account.
      </p>
      <button onClick={resendEmail}>Resend Email</button>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
    </div>
  );
}
