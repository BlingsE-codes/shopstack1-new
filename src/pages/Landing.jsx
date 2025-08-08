import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import "../styles/Landing.css";

export default function Landing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/shops"); // redirect to dashboard if logged in
    }
  }, [user, navigate]);

  return (
    <div className="landing-container">
      <header className="landing-header">
           <h1>Welcome to ShopStack</h1>
           <p>Your futuristic POS & inventory system built for Nigerian businesses.</p>
          <div className="landing-buttons">
              <button onClick={() => navigate("/signup")} className="primary-btn">Get Started</button>
              <button onClick={() => navigate("/login")} className="secondary-btn">Login</button>
           </div>
       </header>

      <section className="features-section">
        <h3>Why Choose ShopStack?</h3>
        <div className="features-grid">
          <div className="feature-box">
            <h4>✨ Simple to Use</h4>
            <p>No tech skills required. Anyone can start selling instantly.</p>
          </div>
          <div className="feature-box">
            <h4>📅 Daily Sales & Expense Tracking</h4>
            <p>Track your cashflow, profit, and losses in real time.</p>
          </div>
          <div className="feature-box">
            <h4>🤑 Manage Debtors</h4>
            <p>Record who owes you and get reminders with totals.</p>
          </div>
          <div className="feature-box">
            <h4>🌐 Offline Ready</h4>
            <p>Use even with slow or no internet. Data syncs when back online.</p>
          </div>
        </div>
      </section>

      <section className="video-demo-section">
        <h2>How It Works</h2>
        <div className="video-container">
          <iframe
            width="100%"
            height="400"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="ShopStack Demo Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      <section className="testimonials-section">
        <h2>What Our Users Are Saying</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <p>“ShopStack changed how I run my shop. I now know my daily profit without stress.”</p>
            <span>- Mama Chika, Lagos</span>
          </div>
          <div className="testimonial">
            <p>“I used to forget who owed me. With ShopStack, I track all debtors easily.”</p>
            <span>- Ahmed, Kano</span>
          </div>
          <div className="testimonial">
            <p>“Even when there’s no network, I can still sell. It’s perfect for our area.”</p>
            <span>- John, Aba</span>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Start using ShopStack for free today</h2>
        <button className="get-started-btn" onClick={() => navigate("/signup")}>Create Your Free Account</button>
      </section>

    </div>
  );
}