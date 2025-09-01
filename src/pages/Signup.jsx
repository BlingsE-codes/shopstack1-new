import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import "../styles/Auth.css";
import { useAuthStore } from "../store/auth-store";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
      <form className="auth-form" onSubmit={handleSignup}>
        <Link to="/" className="btn-home">Back To Home</Link>
        <h2>Create Shop Account</h2>

        <input
          type="text"
          name="name"
          placeholder="First Name"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="surname"
          placeholder="Surname"
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date_of_birth"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
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

        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
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

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
