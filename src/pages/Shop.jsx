import { NavLink, Outlet, useParams } from "react-router-dom";
import { useShopStore } from "../store/shop-store";
import { useState, useEffect, useRef  } from "react";
import "../styles/sidebar.css";


export default function Shop() {
  const { id } = useParams();
  const { shop } = useShopStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMenuOpen(false);
      } else {
        setMenuOpen(true);
      }
      // Check for overflow after resize
      checkSidebarOverflow();
    };

    // Function to check if sidebar content overflows its container
    const checkSidebarOverflow = () => {
      if (sidebarRef.current) {
        const hasVerticalScrollbar = sidebarRef.current.scrollHeight > sidebarRef.current.clientHeight;
        setHasOverflow(hasVerticalScrollbar);
      }
    };

    handleResize();
    checkSidebarOverflow(); // Check on initial mount

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [shop]); // Re-run if shop data changes

  const toggleMenu = () => setMenuOpen((open) => !open);

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setMenuOpen(false);
    }
  };
  return (
    <div className="layout">
      {/* Sidebar */}
      <div className={`sidebar ${menuOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-info">
            {shop.logo_url && (
              <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />
            )}
            <h2>{shop.name || "Shop"}</h2>
            <p>Welcome to your dashboard!</p>
          </div>
        </div>

        <NavLink to={`/shops/${id}`} end className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">🏠</span> Overview
        </NavLink>
        <NavLink to={`/shops/${id}/products`} className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">📦</span> Products
        </NavLink>
        <NavLink to={`/shops/${id}/sales`} className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">💰</span> Sales
        </NavLink>
        <NavLink to={`/shops/${id}/expenses`} className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">📊</span> Expenses
        </NavLink>
        <NavLink to={`/shops/${id}/debtors`} className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">👥</span> Debtors
        </NavLink>
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">🏪</span> Shops
        </NavLink>
        <NavLink to={`/shops/${id}/profile`} className={({ isActive }) => (isActive ? "active" : "")} onClick={handleNavClick}>
          <span className="icon">⚙️</span> Profile
        </NavLink>
      </div>

      {/* Main Content */}
      <div className={`main-content ${!menuOpen ? "expanded" : ""}`}>
        {/* Hamburger toggle */}
        <button
          className="hamburger"
          onClick={toggleMenu}
          style={{ position: "fixed", top: 10, left: 10, zIndex: 1000 }}
        >
          ☰
        </button>
        <Outlet />
      </div>
    </div>
  );
}




