import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FaArrowLeft, FaEnvelope, FaCheckCircle } from "react-icons/fa";
import "../styles/passwordreset.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      toast.error("Please enter your email address");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setEmailSent(true);
      toast.success("Password reset instructions sent to your email");
    }
    
    setLoading(false);
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-background">
        <div className="forgot-password-background-shape"></div>
        <div className="forgot-password-background-shape"></div>
      </div>
      
      <div className="forgot-password-card">
        <Link to="/login" className="back-button">
          <FaArrowLeft /> Back to Login
        </Link>
        
        <div className="forgot-password-header">
          <h2>Reset Your Password</h2>
          <p>
            {emailSent
              ? "Check your email for reset instructions"
              : "Enter your email address and we'll send you instructions to reset your password"}
          </p>
        </div>

        {!emailSent ? (
          <form className="forgot-password-form" onSubmit={handleResetPassword}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="reset-button" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <FaCheckCircle className="success-icon" />
            <h3>Check Your Email</h3>
            <p>
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="support-text">
              Didn't receive the email? Check your spam folder or{" "}
              <button onClick={() => setEmailSent(false)}>try again</button>
            </p>
          </div>
        )}

        <div className="forgot-password-footer">
          <p>
            Remember your password? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}