import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import "../styles/Footer.css";

export default function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/sales">Sales</a></li>
            <li><a href="/inventory">Inventory</a></li>
            <li><a href="/settings">Settings</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <a
            href="https://wa.me/2348037834432"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            Chat on WhatsApp
          </a>
          <p>Email: charlichal2@gmail.com</p>
        </div>

        <div className="footer-section">
          <h4>System Status</h4>
          <p className="status-online">Online</p>
          <p>Version 1.0.2</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} ShopStack. All rights reserved.</p>
        <button className="scroll-top" onClick={scrollToTop}>
          <ChevronUp size={20} />
        </button>
      </div>
    </footer>
  );
}
