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
  
      <div className="footer-bottom">

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


        <p>&copy; {year} ShopStack. All rights reserved.</p>

          <div className="footer-section">
          <h4>System Status</h4>
          <p className="status-online">Online</p>
          <p>Version 1.0.2</p>
        </div>
      </div>

        <button className="scroll-top" onClick={scrollToTop}>
          <ChevronUp size={20} />
        </button>
   
    </footer>
  );
}
