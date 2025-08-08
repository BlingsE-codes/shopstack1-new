import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import "../styles/Auth.css";
import { useAuthStore } from "../store/auth-store";

export default function Signup() {
  const { signin } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    dob: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, surname, dob, email, password, confirmPassword } = form;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data?.user) {
      toast.error(error?.message || "Signup failed");
      setLoading(false);
      return;
    }

    const user = data.user;

    // Set trial to start now + 45 days
    const trialStart = new Date();
    trialStart.setDate(trialStart.getDate() + 45);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        full_name: `${name} ${surname}`,
        date_of_birth: dob,
        auth_id: user.id,
        is_paid: false,
        plan: "trial",
        trial_start: trialStart.toISOString(),
      })
      .select()
      .single();

    if (profileError || !profileData) {
      toast.error("Failed to create profile");
      setLoading(false);
      return;
    }

    signin(profileData);

    toast.success("Account created successfully!");
    toast.success("Check your email for confirmation");
    navigate("/confirm-email"); // ⬅️ Redirect to confirm page
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSignup}>
        <Link to="/" className="btn-home">Back To Login</Link>
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
          name="dob"
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
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
