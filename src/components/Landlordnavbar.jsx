
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useShopStore } from "../store/shop-store";
import { useAuthStore } from "../store/auth-store";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";
import {
  Search,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  Settings,
  Menu,
  X,
  User,
  FileSignature,
  History,
  ClipboardList,
  FileWarning,
  Users,
  Home,
  Receipt,
  FileText,
  Download,
  Printer
} from "lucide-react";
import "../styles/landlordnavbar.css";

const LandlordNavbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { shop } = useShopStore();
  const { user, logout } = useAuthStore();
  const shopId = shop?.id;
  const { tenantId } = useParams();

  const profileRef = useRef(null);
  const documentsRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (documentsRef.current && !documentsRef.current.contains(event.target)) {
        setIsDocumentsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.landlord-mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target) && 
          !event.target.closest('.landlord-mobile-search-toggle')) {
        setShowMobileSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsDocumentsOpen(false);
  };

  const toggleDocumentsMenu = () => {
    setIsDocumentsOpen(!isDocumentsOpen);
    setIsProfileOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    setIsMobileMenuOpen(false);
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
      setShowMobileSearch(false);
    }
  };

  const handleNavItemClick = () => {
    setIsDocumentsOpen(false);
    setIsMobileMenuOpen(false);
    setShowMobileSearch(false);
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
    { to: `/landlordoverview/${shopId}`, icon: LayoutDashboard, label: "Overview" },
    { to: `/landlordtenantmanagement/${shopId}`, icon: Users, label: "Tenants" },
  ];

  // Document dropdown items
  const documentItems = [
    { 
      name: "Rent Receipt", 
      icon: Receipt, 
      tab: "receipt",
      description: "Generate rent payment receipts"
    },
    { 
      name: "Reprint Receipt", 
      icon: History, 
      tab: "reprint",
      description: "Reprint previous receipts"
    },
    { 
      name: "Tenancy Agreement", 
      icon: FileSignature, 
      tab: "agreement",
      description: "Create rental agreements"
    },
    { 
      name: "Quit Notice", 
      icon: FileWarning, 
      tab: "notice",
      description: "Generate tenant eviction notices"
    },
    { 
      name: "House Rules", 
      icon: ClipboardList, 
      tab: "rules",
      description: "Create property rules document"
    },
    { 
      name: "Increase Notice", 
      icon: ClipboardList, 
      tab: "increase",
      description: "Create property increase notice document"
    },
    { 
      name: "Tenant Application Form",
      icon: ClipboardList, 
      tab: "application",
      description: "Create tenant application form document"
    },
    { 
      name: "Reminder",
      icon: ClipboardList, 
      tab: "reminder",
      description: "Create tenant application form document"
    },
  ];

  // Function to handle document selection
  const handleDocumentSelect = (tab) => {
    navigate(`/landlordpage/${shopId}?tab=${tab}`);
    setIsDocumentsOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="landlord-navbar">
        <div className="landlord-navbar-left">
          <div className="landlord-toggle">
           {/* Hamburger button - hidden on large screens */}
<button className="landlord-mobile-menu-toggle" onClick={toggleMobileMenu}>
  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
</button>

 {/* Logo/Brand */}
            <Link to={`/landlordpage/${shopId}`} className="landlord-navbar-brand">
              <div className="landlord-brand-logo">
                <LayoutDashboard size={20} />
              </div>
              <span className="landlord-brand-name">Landlord Portal</span>
            </Link>
          </div>

{/* Desktop navigation - visible on large screens */}
<div className="landlord-desktop-nav">
  <Link
    to={`/landlordoverview/${shopId}`}
    className={`landlord-nav-link ${location.pathname.includes("/landlordoverview") ? "landlord-active" : ""}`}
  >
    <LayoutDashboard size={18} />
    <span>Overview</span>
  </Link>

  <Link
    to={`/landlordtenantmanagement/${shopId}`}
    className={`landlord-nav-link ${location.pathname.includes("/landlordtenantmanagement") ? "landlord-active" : ""}`}
  >
    <Users size={18} />
    <span>Tenants</span>
  </Link>


  <div className="landlord-nav-dropdown" ref={documentsRef}>
    <button className="landlord-nav-dropdown-toggle" onClick={toggleDocumentsMenu}>
      <FileText size={18} />
      <span>Documents</span>
      <ChevronDown size={16} className={`landlord-dropdown-chevron ${isDocumentsOpen ? "landlord-open" : ""}`} />
    </button>

    {isDocumentsOpen && (
      <div className="landlord-nav-dropdown-menu landlord-documents-dropdown">
        <div className="landlord-dropdown-header">
          <FileText size={18} />
          <span>Document Management</span>
        </div>
        {documentItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <button
              key={index}
              className="landlord-dropdown-item"
              onClick={() => handleDocumentSelect(item.tab)}
            >
              <div className="landlord-dropdown-item-icon">
                <IconComponent size={16} />
              </div>
              <div className="landlord-dropdown-item-content">
                <div className="landlord-dropdown-item-title">{item.name}</div>
                <div className="landlord-dropdown-item-description">{item.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
</div>

          </div>

        <div className="landlord-navbar-center">
          {/* Center search removed - now in desktop nav */}
        </div>

        <div className="landlord-navbar-right">
          <button className="landlord-nav-btn" title="All Shops" onClick={() => navigate("/shops")}>
            <Home size={20} />
          </button>
          
          <button className="landlord-nav-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="landlord-profile-menu" ref={profileRef}>
            <button className="landlord-profile-btn" onClick={toggleProfileMenu}>
              <div className="landlord-user-avatar">
                <User size={18} />
              </div>
              <span className="landlord-user-name">{user?.full_name || "Landlord"}</span>
              <ChevronDown size={16} className={`landlord-dropdown-chevron ${isProfileOpen ? 'landlord-open' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="landlord-profile-dropdown">
                <div className="landlord-dropdown-header">
                  <div className="landlord-user-avatar-large">
                    <User size={20} />
                  </div>
                  <div className="landlord-user-info">
                    <div className="landlord-user-name-large">{user?.full_name || "Landlord"}</div>
                    <div className="landlord-user-shop">{shop?.name}</div>
                  </div>
                </div>
                
                <div className="landlord-dropdown-divider"></div>
                
                <Link to="/profile" className="landlord-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                
                <Link to="/settings" className="landlord-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                
                <div className="landlord-dropdown-divider"></div>
                
                <button className="landlord-dropdown-item landlord-logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Search */}
      {showMobileSearch && (
        <div className="landlord-mobile-menu-overlay" onClick={() => setShowMobileSearch(false)}>
          <div className="landlord-mobile-menu" ref={mobileSearchRef} onClick={(e) => e.stopPropagation()}>
            <div className="landlord-mobile-menu-header">
              <h3>Search</h3>
              <button className="landlord-close-mobile-menu" onClick={() => setShowMobileSearch(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="landlord-mobile-search-container">
              <input
                type="text"
                placeholder="Search tenants, receipts..."
                className="landlord-mobile-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="landlord-mobile-search-button" onClick={handleSearch}>
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="landlord-mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="landlord-mobile-menu" ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
            <div className="landlord-mobile-menu-header">
              <div className="landlord-mobile-user-info">
                <div className="landlord-user-avatar">
                  <User size={24} />
                </div>
                <div>
                  <div className="landlord-user-name-large">{user?.full_name || "Landlord"}</div>
                  <div className="landlord-user-shop">{shop?.name}</div>
                </div>
              </div>
              <button className="landlord-close-mobile-menu" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="landlord-mobile-menu-items">
              {navItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.to}
                    className={`landlord-mobile-menu-item ${location.pathname === item.to ? 'landlord-active' : ''}`}
                    onClick={handleNavItemClick}
                  >
                    <IconComponent size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="landlord-mobile-menu-divider"></div>

              <h4 className="landlord-mobile-menu-subheader">Document Management</h4>
              
              {documentItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={index}
                    className="landlord-mobile-menu-item"
                    onClick={() => handleDocumentSelect(item.tab)}
                  >
                    <IconComponent size={20} />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              <div className="landlord-mobile-menu-divider"></div>

              <button className="landlord-mobile-menu-item" onClick={toggleMobileSearch}>
                <Search size={20} />
                <span>Search</span>
              </button>

              <button className="landlord-mobile-menu-item" onClick={toggleDarkMode}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <Link to="/help" className="landlord-mobile-menu-item" onClick={handleNavItemClick}>
                <HelpCircle size={20} />
                <span>Help & Support</span>
              </Link>

              <Link to="/shops" className="landlord-mobile-menu-item" onClick={handleNavItemClick}>
                <Home size={20} />
                <span>All Shops</span>
              </Link>

              <div className="landlord-mobile-menu-divider"></div>

              <button className="landlord-mobile-menu-item landlord-logout-btn" onClick={handleLogout}>
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

export default LandlordNavbar;




