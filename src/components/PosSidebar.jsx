import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Phone,
  FileText,
  Users,
  BarChart2,
  Settings,
  Menu,
  X,
} from "lucide-react";
import "../styles/possidebar.css";

const PosSidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const sidebarRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      // Always open on desktop, closed by default on mobile
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      // Only close when clicking outside on mobile
      if (window.innerWidth < 1024 && 
          isOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) && 
          !event.target.closest('.posmenu-btn')) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // FIXED: Added closing parenthesis and semicolon
  };

  const handleLinkClick = () => {
    // Only auto-close on mobile devices
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  // Check if a link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      {/* <div className="posmobile-header"> */}
        <button onClick={toggleSidebar} className="posmenu-btn">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <h2 className="posmobile-title">ShopStack POS</h2>
      {/* </div> */}

      {/* Overlay for mobile */}
      {isOpen && window.innerWidth < 1024 && (
        <div className="possidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div ref={sidebarRef} className={`possidebar ${isOpen ? "open" : ""}`}>
        <div className="possidebar-header">
          <h2>ShopStack</h2>
        </div>
        <nav className="possidebar-nav">
          <Link 
            to="/pos-dashboard" 
            onClick={handleLinkClick}
            className={isActiveLink("/pos-dashboard") ? "active" : ""}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/transactions" 
            onClick={handleLinkClick}
            className={isActiveLink("/transactions") ? "active" : ""}
          >
            <CreditCard size={20} />
            <span>Transactions</span>
          </Link>
          <Link 
            to="/airtime" 
            onClick={handleLinkClick}
            className={isActiveLink("/airtime") ? "active" : ""}
          >
            <Phone size={20} />
            <span>Airtime</span>
          </Link>
          <Link 
            to="/bills" 
            onClick={handleLinkClick}
            className={isActiveLink("/bills") ? "active" : ""}
          >
            <FileText size={20} />
            <span>Bills</span>
          </Link>
          <Link 
            to="/customers" 
            onClick={handleLinkClick}
            className={isActiveLink("/customers") ? "active" : ""}
          >
            <Users size={20} />
            <span>Customers</span>
          </Link>
          <Link 
            to="/reports" 
            onClick={handleLinkClick}
            className={isActiveLink("/reports") ? "active" : ""}
          >
            <BarChart2 size={20} />
            <span>Reports</span>
          </Link>
          <Link 
            to="/settings" 
            onClick={handleLinkClick}
            className={isActiveLink("/settings") ? "active" : ""}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </>
  );
};

export default PosSidebar;