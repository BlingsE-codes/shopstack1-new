import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/emailconfirmation.css";

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
    <div className="email-confirmation-page">
      
      
      <div className="email-confirmation-container">
        <div className="confirmation-card">
          <div className="confirmation-icon">
            <i className="fas fa-envelope"></i>
          </div>
          
          <h2>Confirm Your Email Address</h2>
          
          <p className="confirmation-text">
            We've sent a confirmation email to your inbox. 
            Please check your email and click the verification link to activate your account.
          </p>
          
          <div className="confirmation-actions">
            <button className="resend-button" onClick={resendEmail}>
              <i className="fas fa-redo"></i>
              Resend Email
            </button>
            
            <button className="login-button" onClick={() => navigate("/Login")}>
              <i className="fas fa-arrow-left"></i>
              Back to Login
            </button>
          </div>
          
          <div className="confirmation-help">
            <p>Didn't receive the email?</p>
            <ul>
              <li><i className="fas fa-check-circle"></i> Check your spam folder</li>
              <li><i className="fas fa-check-circle"></i> Verify you entered the correct email address</li>
              <li><i className="fas fa-check-circle"></i> Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}