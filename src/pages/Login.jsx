import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/login.css";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { FaEye, FaEyeSlash, FaArrowLeft, FaEnvelope, FaLock, FaStore, FaSignInAlt, FaGoogle } from "react-icons/fa";

export default function Login() {
  const { signin, user: authUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { shop } = useShopStore();

  // ✅ Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
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

  // ✅ Remember email for next login
  if (rememberMe) localStorage.setItem("savedEmail", email);
  else localStorage.removeItem("savedEmail");

  signin(profileData[0]);
  toast.success("Welcome back 👋");

  // ✅ Safe redirect (no landing loop)
  navigate("/shops", { replace: true });
  setLoading(false);
};


  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-background-shape"></div>
        <div className="login-background-shape"></div>
      </div>
      
      <div className="login-card">
        <Link to="/" className="back-button">
          <FaArrowLeft /> Back to Home
        </Link>
        
        <div className="login-header">
          <div className="logo">
            <FaStore className="logo-icon" />
            <span>Shop<b>Stack</b></span>
          </div>
        
          <p>Sign in to your account to continue</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
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

          <div className="login-options">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
            <Link to="/passwordreset" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <FaSignInAlt className="button-icon" />
                Login to Account
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <button 
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <FaGoogle className="google-icon" />
          Sign in with Google
        </button>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}