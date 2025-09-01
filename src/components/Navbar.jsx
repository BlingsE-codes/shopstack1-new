import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/navbar.css";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { User, Power } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { shop } = useShopStore();

  // Custom Home Icon (to match your colors)
  const HomeIcon = ({ color = "#007bff", size = 24 }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data && !error) setProfile(data);
    };
    fetchUserProfile();
  }, [user]);

 const handleLogout = () => {
   logout();
   navigate("/login");
 };
return (
    <div className="navbar">
      <div className="navbar-right">
        {/* Home */}
        <Link to="/" className="navbar-icon" title="Home">
          <HomeIcon color="#e67a00" size={26} />
        </Link>

        {/* Profile */}
        <Link to={`/shops/${id}/profile`} className="navbar-icon" title="Profile">
          <User size={22} stroke="#007bff" />
          <div className="initials-avatar">
            {getInitials(profile?.full_name || user?.email)}
          </div>
        </Link>

        {/* Logout */}
        <button className="navbar-icon logout-btn" onClick={handleLogout} title="Logout">
          <Power size={22} stroke="#17a2b8" />
        </button>
      </div>
    </div>
  );
}
