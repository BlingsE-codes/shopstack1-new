import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import "../styles/auth.css";
import { useAuthStore } from "../store/auth-store";
import { FaEye, FaEyeSlash, FaArrowLeft, FaUser, FaEnvelope, FaLock, FaCalendarAlt, FaStore, FaSignInAlt } from "react-icons/fa";

export default function Signup() {
  const { signin } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    date_of_birth: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only capitalize name + surname, leave passwords as-is
    const newValue =
      name === "name" || name === "surname"
        ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, surname, date_of_birth, email, password, confirmPassword } = form;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${name} ${surname}`,
          date_of_birth: date_of_birth, // must be YYYY-MM-DD
        },
      },
    });

    setLoading(false);

    if (error || !data?.user) {
      toast.error(error?.message || "Signup failed");
      return;
    }

    toast.success("Account created successfully!");
    toast.success("Check your email for confirmation");
    navigate("/confirm-email");
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-shape"></div>
        <div className="auth-background-shape"></div>
      </div>
      
      <div className="auth-card">
        <Link to="/" className="back-button">
          <FaArrowLeft /> Back to Home
        </Link>
        
        <div className="auth-header">
          <div className="logo">
            <FaStore className="logo-icon" />
            <span>Shop<b>Stack</b></span>
          </div>
          <h2>Create Your Account</h2>
          <p>Join thousands of shop owners using our POS system</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-row">
            <div className="input-group">
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="First name"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  id="surname"
                  type="text"
                  name="surname"
                  placeholder="Surname"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <FaCalendarAlt className="input-icon" />
              <input
                id="date_of_birth"
                type="date"
                name="date_of_birth"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email address"
                onChange={handleChange}
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
                name="password"
                placeholder="Create password"
                onChange={handleChange}
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

          <div className="input-group">
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <FaSignInAlt className="button-icon" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}