import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/auth.css";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import loginImage from "../assets/login.svg";

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
    <div className="auth-container">
      {/* Left illustration */}
      <div className="auth-illustration">
        <img src={loginImage} alt="Login illustration" />
      </div>

      {/* Right form */}
      <form className="auth-form" onSubmit={handleLogin}>
        <h1 to="/" className="navbar-brand">
          <h1 className="shopstack-logo">
            Shop<b>Stack</b>
          </h1>
        </h1>

        <p className="auth-subtitle">Login to your account</p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-wrapper">
          <input
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

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-toggle">
          Don’t have an account?{" "}
          <Link to="/signup" className="toggle">
            Sign up here
          </Link>
        </p>
      </form>
    </div>
  );
}
