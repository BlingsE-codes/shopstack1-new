import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/Navbar.css";
import { useAuthStore } from "../store/auth-store";
import shopstackLogo from "../assets/Shopstack-Image.svg";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  // const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchUserProfile = async () => {
  //     if (!user) return;

  //     const { data, error } = await supabase
  //       .from("profiles")
  //       .select("shop_name, logo_url")
  //       .eq("user_id", user.id)
  //       .single();

  //     if (data && !error) {
  //       setProfile(data);
  //     }
  //   };

  //   fetchUserProfile();
  // }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar-wrapper">
      
        <div className="logo-container">
           
              </div>
    <nav className="navbar">
      
      <Link to="/" className="navbar-brand">

         <img src={shopstackLogo} alt="ShopStack Logo" className="shop-logo" />
         
          <h1 className="logo">ShopStack</h1>
      
      </Link>

      <div className="nav-buttons">
        {!user ? (
          <Link to="/login" className="btn btn-auth">
            Login / Signup
          </Link>
        ) : (
          <>
            <button className="btn btn-auth" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
         {/* <Link to="/shops" className="shopprofile">
              Shop Profile
            </Link> */}
      </div>
    </nav>
    </header>
  );
}
