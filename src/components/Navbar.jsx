import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/navbar.css";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { User, Power, Home, Menu } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { shop } = useShopStore();

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
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="landlord-navbar">
      {/* Logo Section */}
      <nav className="shops-navbar">
        <div className="shop-shopstack-logo">
          <a href="/" className="logo-link">
            <span className="logo-shop">Shop</span>
            <span className="logo-stack">stack</span>
          </a>
        </div>
      </nav>

      {/* Navigation Buttons */}
      <div className="landlord-navbar-right">
        {/* Home */}
        <Link 
          to="/landing" 
          className="landlord-nav-btn" 
          title="Shops"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Home size={22} color="#e67a00" />
        </Link>

        {/* Profile */}
        <Link 
          to={`/shops/${id}/profile`} 
          className="landlord-nav-btn" 
          title="Profile"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="landlord-user-avatar-small">
            {getInitials(profile?.full_name || user?.email)}
          </div>
        </Link>

        {/* Logout */}
        <button 
          className="landlord-nav-btn landlord-logout-btn" 
          onClick={handleLogout} 
          title="Logout"
        >
          <Power size={22} color="#17a2b8" />
        </button>
      </div>
    </div>
  );
}