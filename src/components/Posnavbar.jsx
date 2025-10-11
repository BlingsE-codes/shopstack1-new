import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useShopStore } from "../store/shop-store";
import { useAuthStore } from "../store/auth-store";

import {
  Search,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  Phone,
  FileText,
  BarChart2,
  Settings,
  Menu,
  Home,
  X,
  User
} from "lucide-react";
import "../styles/posnavbar.css";

const Navbar = ({ id }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  // const { shop, logout, user } = useShopStore();
  // const { user, logout } = useAuthStore();
  const { shop, user } = useShopStore();
  const { logout } = useAuthStore();
  const shopId = shop?.id;

  const profileRef = useRef(null);
  const navDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);


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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setIsNavDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsNavDropdownOpen(false);
  };

  const toggleNavDropdown = () => {
    setIsNavDropdownOpen(!isNavDropdownOpen);
    setIsProfileOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', !darkMode);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleNavItemClick = () => {
    setIsNavDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Check for saved dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      setDarkMode(savedDarkMode);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Navigation items data
  const navItems = [
    { to: `/pospage/${shopId}`, icon: LayoutDashboard, label: "Dashboard" },
    { to: `/transactions/${shopId}`, icon: CreditCard, label: "Transactions" },
    { to: `/posairtimepage/${shopId}`, icon: Phone, label: "Airtime" },
    { to: `/posbillspage/${shopId}`, icon: FileText, label: "Bills" },
    { to: `/posreportpage/${shopId}`, icon: BarChart2, label: "Reports" },
  ];

  // Fixed logout function
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="posnavbar">
        <div className="navbar-left">
          {/* Mobile menu toggle */}
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo/Brand */}
          <Link to={`/pospage/${shopId}`} className="navbar-brand">
            <div className="brand-logo">
              <LayoutDashboard size={24} />
            </div>
            <span className="brand-name">POS System</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav">
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={index}
                  to={item.to}
                  className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Dropdown for navigation links (Tablet) */}
          <div className="nav-dropdown" ref={navDropdownRef}>
            <button className="nav-dropdown-toggle" onClick={toggleNavDropdown}>
              <LayoutDashboard size={20} />
              <span>Menu</span>
              <ChevronDown size={16} className={`dropdown-chevron ${isNavDropdownOpen ? 'open' : ''}`} />
            </button>
            
            {isNavDropdownOpen && (
              <div className="nav-dropdown-menu">
                {navItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Link 
                      key={index}
                      to={item.to} 
                      className={`dropdown-link ${location.pathname === item.to ? 'active' : ''}`}
                      onClick={handleNavItemClick}
                    >
                      <IconComponent size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-center">
          <form onSubmit={handleSearch} className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search transactions, customers..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="navbar-right">
          <button className="nav-btn" title="Shops" onClick={() => navigate("/Shops")}>
            <HomeIcon size={20} />
          </button>
          
          {/* My Shops button added here */}
          <button className="nav-btn" title="My Shops" onClick={() => navigate("/shops")}>
            <Home size={20} />
          </button>
          
          <button className="nav-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="profile-menu" ref={profileRef}>
            <button className="profile-btn" onClick={toggleProfileMenu}>
              <div className="user-avatar">
                <User size={20} />
              </div>
              <span className="user-name">{shop?.name || "Shop"}</span>
              <ChevronDown size={16} className={`dropdown-chevron ${isProfileOpen ? 'open' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="user-avatar-large">
                    <User size={24} />
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user?.name || "Admin User"}</div>
                    <div className="user-shop">{shop?.name}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                
                <Link to="/settings" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu" ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="mobile-user-info">
                <div className="user-avatar">
                  <User size={24} />
                </div>
                <div>
                  <div className="user-name">{user?.name || "Admin User"}</div>
                  <div className="user-shop">{shop?.name}</div>
                </div>
              </div>
              <button className="close-mobile-menu" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="mobile-menu-items">
              {navItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.to}
                    className={`mobile-menu-item ${location.pathname === item.to ? 'active' : ''}`}
                    onClick={handleNavItemClick}
                  >
                    <IconComponent size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="mobile-menu-divider"></div>

              <button className="mobile-menu-item" onClick={toggleDarkMode}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <Link to="/help" className="mobile-menu-item" onClick={handleNavItemClick}>
                <HelpCircle size={20} />
                <span>Help & Support</span>
              </Link>

              {/* My Shops removed from mobile menu dropdown since it's now in navbar */}

              <div className="mobile-menu-divider"></div>

              <button className="mobile-menu-item logout-btn" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;