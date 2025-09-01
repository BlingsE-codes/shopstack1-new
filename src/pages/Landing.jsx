// Landing.jsx
import React, { useState, useEffect } from 'react';

import { NavLink, Outlet, useParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/Navbar.css";
import { Menu, X } from "lucide-react"; 
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts"



import "../styles/Landing.css";
import HowItWorks from './HowItWorks';





const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
 
const pieData = [
  { name: "Sales", value: 400 },
  { name: "Expenses", value: 200 },
  { name: "Debtors", value: 150 },
];

const barData = [
  { name: "Mon", sales: 400, expenses: 200 },
  { name: "Tue", sales: 300, expenses: 100 },
  { name: "Wed", sales: 500, expenses: 250 },
  { name: "Thu", sales: 600, expenses: 300 },
  { name: "Fri", sales: 700, expenses: 400 },
];

const COLORS = ["#e67a00", "#007bff", "#17a2b8"];


  useEffect(() => {
    if (user) {
      navigate("/shops"); // redirect to dashboard if logged in
    }
  }, [user, navigate]);


  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  window.scrollTo(0, 0);
}, []);


  // Simple SVG icons to replace react-icons
  const TrendingIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );

  
  const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")              // split by space
    .map((n) => n[0])        // take first letter
    .join("")                // join letters
    .toUpperCase();          // make uppercase
};

const NairaIcon = ({ size = 24 }) => (
  <span
    style={{
      fontSize: `${size}px`,
      fontWeight: "bold",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    }}
  >
    ₦
  </span>
);



  const AlertIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12" y2="17"></line>
    </svg>
  );

  const PrinterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="2" ry="2" />
  </svg>
);

const CloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 17.58A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.25" />
    <path d="M16 16h6v6h-6z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 0 20" />
    <path d="M12 2a15.3 15.3 0 0 0 0 20" />
  </svg>
);


  const ChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );

  const StoreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  const CartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  );

  const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );

  const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ChevronUp = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 12 10 7 5 12" />
    </svg>
  );

  const features = [
    { icon: <TrendingIcon />, title: 'Sales Tracking', desc: 'Real-time sales monitoring with advanced analytics' },
    { icon: <NairaIcon />, title: 'Expense Management', desc: 'Track and categorize all business expenses' },
    { icon: <AlertIcon />, title: 'Stock Alerts', desc: 'Automated notifications for low inventory levels' },
    { icon: <ChartIcon />, title: 'Advanced Analytics', desc: 'Customizable dashboards with detailed reports' },
    { icon: <StoreIcon />, title: 'Multi-Shop Support', desc: 'Manage multiple locations from a single dashboard' },
    { icon: <CartIcon />, title: 'Mobile POS', desc: 'Process sales from anywhere with our mobile app' },
    { icon: <PrinterIcon />, title: 'Unlimited Receipt Printing', desc: 'Print or share branded receipts instantly' },
    { icon: <CloudIcon />, title: 'Cloud Backup', desc: 'Your data is always safe and synced in the cloud' },
    { icon: <ShieldIcon />, title: 'Secure Login', desc: 'Protected with encryption and session tokens' },
    { icon: <GlobeIcon />, title: 'Offline Mode', desc: 'Keep selling even without internet access' },
  ];

  const steps = [
    { number: 1, title: 'Sign Up & Setup', desc: 'Create your account and customize store settings' },
    { number: 2, title: 'Import Your Data', desc: 'Easily import products, customers, and inventory' },
    { number: 3, title: 'Start Managing', desc: 'Begin processing sales and analyzing performance' }
  ];

  const testimonials = [
    { name: 'Tunde Adedeji', role: 'Boutique Owner', content: 'ShopStack has completely transformed how I manage my retail stores. The inventory alerts alone have saved me from countless stockouts.' },
    { name: 'Obinna Ikemefuna', role: 'Restaurant Manager', content: 'The analytics dashboard gives me insights I never had before. My costs are down 15% since implementing ShopStack.' },
    { name: 'Mohammed Waziri', role: 'Multi-store Owner', content: 'Managing all my locations from one dashboard has saved me hours every week. The mobile app is incredibly intuitive.' },
    { name: 'Chiamaka Eze', role: 'Supermarket Owner', content: 'With ShopStack, I can track sales and expenses in real-time. My staff finds it easy to use, and it has improved our efficiency.'},
    { name: 'Samuel Johnson', role: 'Electronics Retailer', content: 'The receipt printing and expense tracking features are a game-changer. My customers love the branded receipts!'},
    { name: 'Grace Oladipo', role: 'Pharmacy Owner', content: 'I never worry about losing data anymore. The cloud backup keeps everything safe, and I can access my business info from anywhere.'},
    { name: 'Adeola Martins', role: 'Cafe Owner', content: 'Offline mode is a lifesaver. Even when internet goes down, I can still record sales without interruption.'},
    { name: 'Ibrahim Musa', role: 'Wholesale Distributor', content: 'The secure login and multi-shop support help me manage my warehouses and shops with confidence.' }
  ];

  return (
    <div className="shopstack-landing">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="nav">
            {/* <div className="logo">ShopStack</div> */}
             <Link to="/" className="navbar-brand">
    <h1 className="shopstack-logo">
      Shop<b>Stack</b>
    </h1>
  </Link>



            



<div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
  <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
  <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</a>
  <a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
  <Link to="pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>

     <div className="navbar-dropdown">
        <span className="dropdown-text">More ▾</span>
        <div className="dropdown-content">
          <div className="dropdown-arrow"></div>
          {/* <a href="/About">About Us</a> */}
          <Link to="/about">About</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/feedback">Feedbacks & Reviews</Link>
          <Link to="/pos-merchant-flow">How POS Merchants Work</Link>
          {/* <a href="contact">Contact Us</a> */}
          {/* <a href="terms">Terms & Conditions</a> */}
          <Link to="/terms">Terms & Conditions</Link>
        </div>
      </div>

               <button onClick={() => navigate("/login")} className="btn-auth-landing">Login</button>
              {/* <a href="/login" className='btn btn-outline'>Login</a> */}
                {/* <Link to="login" className="btn-auth">
                    Login
                  </Link> */}

              <button onClick={() => navigate("/signup")} className="btn btn-primary">Get Started</button>

                <Link to={`/shops/${id}/profile`} className="navbar-avatar">
                    <h4 className="initials-avatar">{getInitials(user?.full_name)}</h4>
                </Link>
              
{/* 
              <button className="btn btn-primary">Get Started</button> */}
              {/* <a href="/signup" className='btn btn-outline'>Get Started</a> */}

            </div>
            <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
    <section className="hero">
  <div className="container">
    <div className="hero-content">
      <h1>Revolutionize Your Retail Business</h1>
      <p>
        ShopStack is the modern POS and inventory system designed to help small
        businesses streamline operations, boost sales, and manage inventory
        efficiently.
      </p>
      <div className="hero-buttons">
        <button
          onClick={() => navigate("/signup")}
          className="btn btn-primary btn-large"
        >
          Get Started Free
        </button>
        <button className="btn btn-secondary btn-large">
          <PlayIcon /> Watch Demo
        </button>
      </div>
    </div>

    {/* Dashboard Preview */}
    <div className="hero-visual">
      <div className="dashboard-preview">
        <div className="browser-window">
          <div className="browser-controls">
            <div className="control-dot red"></div>
            <div className="control-dot yellow"></div>
            <div className="control-dot green"></div>
          </div>
          <div className="browser-content">
            <div className="dashboard-grid">
              {/* Stat Cards */}
              <div className="stat-card sales">Total Sales: ₦140,500</div>
               <div className="stat-card sales">Total Profit: ₦28,300</div>
              <div className="stat-card expenses">Total Expenses: ₦12,000</div>
              <div className="stat-card debtors">Debtors: ₦14,200</div>

              {/* Bar Chart */}
              <div className="chart-area">
                <h3>Sales vs Expenses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#007bff" />
                    <Bar dataKey="expenses" fill="#e67a00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="landing-section-header">
            <h2>Powerful Features for Your Business</h2>
            <p>Everything you need to manage your retail operations efficiently</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="landing-section-header">
            <h2>How ShopStack Works</h2>
            <p>Get set up and running in just few simple steps</p>
          </div>
          <div className="steps">
            {steps.map((step, index) => (
              <div key={index} className="step">
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                 
              </div>
              
            ))}
          </div>
          <Link to="howitworks" className='Learn-more'>Learn More</Link>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="landing-section-header">
            <h2>What Our Customers Say</h2>
            <p>Join thousands of satisfied business owners using ShopStack</p>
          </div>
          <div className="testimonial-slider">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`testimonial ${index === activeTestimonial ? 'active' : ''}`}>
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                  <div className="testimonial-author">
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Business?</h2>
            <p>Start your free 30-days trial today. No credit card required.</p>
            <button className="btn btn-primary btn-large">Get Started Now</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>ShopStack</h3>
              <p>The modern POS and inventory system for small businesses.</p>
                <p>&copy; 2023 ShopStack. All rights reserved.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <a href="features">Features</a>
              <a href="pricing">Pricing</a>
              <a href="testimonials">Testimonials</a>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Blog</a>
              <a href="#">Support</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>
          </div>
          <div className="footer-bottom">
          
               <div className="footer-section">
                      <h4>System Status</h4>
                      <p className="status-online">Online</p>
                      <p>Version 1.0.2</p>
                    </div>
                  </div>
            
                    <button className="scroll-top" onClick={scrollToTop}>
                      <ChevronUp size={20} />
                    </button>
               
          </div>
      </footer>
    </div>
  );
};

export default Landing;