import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/landing.css";
import { Menu, X, ChevronUp, Play, TrendingUp, AlertCircle, BarChart3, Store, ShoppingCart, Printer, Cloud, Shield, Globe } from "lucide-react"; 
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

  const COLORS = ["#4f46e5", "#f97316", "#0ea5e9"];

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

  const features = [
    { icon: <TrendingUp size={20} />, title: 'Sales Tracking', desc: 'Real-time sales monitoring with advanced analytics' },
    { icon: <NairaIcon />, title: 'Expense Management', desc: 'Track and categorize all business expenses' },
    { icon: <AlertCircle size={20} />, title: 'Stock Alerts', desc: 'Automated notifications for low inventory levels' },
    { icon: <BarChart3 size={20} />, title: 'Advanced Analytics', desc: 'Customizable dashboards with detailed reports' },
    { icon: <Store size={20} />, title: 'Multi-Shop Support', desc: 'Manage multiple locations from a single dashboard' },
    { icon: <ShoppingCart size={20} />, title: 'Mobile POS', desc: 'Process sales from anywhere with our mobile app' },
    { icon: <Printer size={20} />, title: 'Unlimited Receipt Printing', desc: 'Print or share branded receipts instantly' },
    { icon: <Cloud size={20} />, title: 'Cloud Backup', desc: 'Your data is always safe and synced in the cloud' },
    { icon: <Shield size={20} />, title: 'Secure Login', desc: 'Protected with encryption and session tokens' },
    { icon: <Globe size={20} />, title: 'Offline Mode', desc: 'Keep selling even without internet access' },
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="shopstack-landing1">
      {/* Header */}
      <header className="header1">
        <div className="container1">
          <div className="nav1">
            <Link to="/" className="navbar-brand1">
              <h1 className="shopstack-logo1">
                Shop<span>Stack</span>
              </h1>
            </Link>

            <div className={`nav-links1 ${isMenuOpen ? 'active' : ''}`}>
              <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</a>
              <a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
              <Link to="pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>

              <div className="navbar-dropdown1">
                <span className="dropdown-text1">More ▾</span>
                <div className="dropdown-content1">
                  <div className="dropdown-arrow1"></div>
                  <Link to="/about">About</Link>
                  <Link to="/contact">Contact Us</Link>
                  <Link to="/feedback">Feedbacks & Reviews</Link>
                  <Link to="/pos-merchant-flow">How POS Merchants Work</Link>
                  <Link to="/terms">Terms & Conditions</Link>
                </div>
              </div>

              {user ? (
                <Link to={`/shops/${id}/profile`} className="navbar-avatar1">
                  <div className="initials-avatar1">{getInitials(user?.full_name)}</div>
                </Link>
              ) : (
                <>
                  <button onClick={() => navigate("/login")} className="btn-auth-landing1">Login</button>
                  <button onClick={() => navigate("/signup")} className="btn btn-primary1">Get Started</button>
                </>
              )}
            </div>
            
            <button className="mobile-toggle1" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero1">
        <div className="container1">
          <div className="hero-content1">
            <h1>Simplify Your Business Operations with ShopStack</h1>
            <p>
              The all-in-one platform for inventory management, sales tracking, and business analytics designed specifically for Nigerian businesses.
            </p>
            <div className="hero-buttons1">
              <button
                onClick={() => navigate("/signup")}
                className="btn btn-primary1 btn-large"
              >
                Get Started Free
              </button>
              <button className="btn btn-secondary1 btn-large">
                <Play size={18} /> Watch Demo
              </button>
            </div>
            <div className="hero-stats1">
              <div className="stat1">
                <span className="stat-number1">500+</span>
                <span className="stat-label1">Active Businesses</span>
              </div>
              <div className="stat1">
                <span className="stat-number1">₦2.5B+</span>
                <span className="stat-label1">Monthly Transactions</span>
              </div>
              <div className="stat1">
                <span className="stat-number1">98%</span>
                <span className="stat-label1">Customer Satisfaction</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hero-visual1">
            <div className="dashboard-preview1">
              <div className="browser-window1">
                <div className="browser-controls1">
                  <div className="control-dot1 red"></div>
                  <div className="control-dot1 yellow"></div>
                  <div className="control-dot1 green"></div>
                </div>
                <div className="browser-content1">
                  <div className="dashboard-grid1">
                    <div className="stat-card sales1">
                      <span className="stat-label1">Total Sales</span>
                      <span className="stat-value1">₦140,500</span>
                    </div>
                    <div className="stat-card profit1">
                      <span className="stat-label1">Total Profit</span>
                      <span className="stat-value1">₦28,300</span>
                    </div>
                    <div className="stat-card expenses1">
                      <span className="stat-label1">Total Expenses</span>
                      <span className="stat-value1">₦12,000</span>
                    </div>
                    <div className="stat-card debtors1">
                      <span className="stat-label1">Debtors</span>
                      <span className="stat-value1">₦14,200</span>
                    </div>

                    <div className="chart-area1">
                      <h3>Sales vs Expenses</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pie-chart-area1">
                      <h3>Revenue Distribution</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
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
        <div className="container1">
          <div className="landing-section-header1">
            <h2>Everything You Need to Run Your Business</h2>
            <p>Powerful tools designed specifically for Nigerian retailers and small businesses</p>
          </div>
          <div className="features-grid1">
            {features.map((feature, index) => (
              <div key={index} className="feature-card1">
                <div className="feature-icon1">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works1">
        <div className="container1">
          <div className="landing-section-header1">
            <h2>Get Started in 3 Simple Steps</h2>
            <p>Start managing your business more effectively in minutes</p>
          </div>
          <div className="steps1">
            {steps.map((step, index) => (
              <div key={index} className="step1">
                <div className="step-number1">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="steps-cta1">
            <Link to="howitworks" className="btn btn-outline1">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials1">
        <div className="container1">
          <div className="landing-section-header1">
            <h2>Trusted by Nigerian Business Owners</h2>
            <p>See what our customers are saying about ShopStack</p>
          </div>
          <div className="testimonial-slider1">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`testimonial1 ${index === activeTestimonial ? 'active' : ''}`}>
                <div className="testimonial-content1">
                  <div className="testimonial-quote1">"</div>
                  <p>{testimonial.content}</p>
                  <div className="testimonial-author1">
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="testimonial-dots1">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot1 ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta1">
        <div className="container1">
          <div className="cta-content1">
            <h2>Start Your Free 30-Day Trial Today</h2>
            <p>No credit card required. Get set up in minutes.</p>
            <button onClick={() => navigate("/signup")} className="btn btn-primary btn-large">Get Started Now</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer1">
        <div className="container1">
          <div className="footer-content1">
            <div className="footer-section1">
              <h3>ShopStack</h3>
              <p>Simplifying business management for Nigerian retailers and SMEs.</p>
              <p>&copy; {new Date().getFullYear()} ShopStack. All rights reserved.</p>
            </div>

            <div className="footer-section1">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="/pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            
            <div className="footer-section1">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Blog</a>
              <a href="#">Support</a>
            </div>
            
            <div className="footer-section1">
              <h4>Company</h4>
              <a href="/about">About Us</a>
              <a href="/contact">Contact</a>
              <a href="#">Careers</a>
            </div>
          </div>
          
          <div className="footer-bottom1">
            <p>Made with ❤️ for Nigerian businesses</p>
          </div>
          
          <button className="scroll-top1" onClick={scrollToTop}>
            <ChevronUp size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Landing;