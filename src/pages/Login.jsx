import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/login.css";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { FaEye, FaEyeSlash, FaArrowLeft, FaEnvelope, FaLock, FaStore } from "react-icons/fa";

export default function Login() {
  const { signin, user: authUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { shop } = useShopStore();

  // ✅ Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password, // session will be stored securely by Supabase
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      toast.error("User not found");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", user.id);

    if (profileFetchError || !profileData?.length) {
      toast.error("Failed to load profile");
      setLoading(false);
      return;
    }

    // ✅ Save email for next login
    localStorage.setItem("savedEmail", email);

    signin(profileData[0]);
    toast.success("Welcome back 👋");
    navigate("/");
    setLoading(false);
  };

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="back-button">
          <FaArrowLeft /> Back to Home
        </Link>
        
        <div className="login-header">
          <div className="logo">
            <FaStore className="logo-icon" />
            <span>Shop<b>Stack</b></span>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
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

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : (
              "Login to Account"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>
        </div>
      </div>

     
    </div>
  );
}