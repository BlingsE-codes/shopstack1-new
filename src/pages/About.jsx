import React from "react";
import { useEffect } from "react";
import "../styles/about.css";

export default function About() {

   useEffect(() => {
      window.scrollTo(0, 0); // always scroll to top on load
    }, []);
  return (
    <div className="about-container">
      <h1 className="about-title">About ShopStack™</h1>

      {/* Who We Are */}
      <section className="about-section">
        <h2>Who We Are</h2>
        <p>
          ShopStack™ is a modern Point-of-Sale and Inventory Management System
          designed for small and medium-sized businesses. We provide a seamless
          way for shop owners to manage their sales, expenses, stock levels, and
          customers—all in one powerful platform.
        </p>
      </section>

      {/* Mission */}
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          To empower small businesses with simple, affordable, and powerful
          digital tools that streamline operations and drive growth.
        </p>
      </section>

      {/* Vision */}
      <section className="about-section">
        <h2>Our Vision</h2>
        <p>
          To become the leading POS and shop management platform for small
          businesses across Africa, enabling entrepreneurs to scale with ease
          and confidence.
        </p>
      </section>

      {/* Core Values */}
      <section className="about-section">
        <h2>Our Core Values</h2>
        <ul>
          <li>📌 Simplicity – Easy to use for all shop owners.</li>
          <li>📌 Reliability – Secure and always available.</li>
          <li>📌 Innovation – Continuously improving with modern technology.</li>
          <li>📌 Community – Supporting local businesses to thrive.</li>
        </ul>
      </section>

      {/* Contact */}
      <section className="about-section contact">
        <h2>Contact Us</h2>
        <p>
          Have questions or suggestions? Reach out to us:
          <br />
          📧 Email: <a href="mailto:shopstackng@gmail.com">shopstackng@gmail.com</a>
          <br />
          📞 Phone: +234 803 783 4432
          <br />
          🌍 Website: <a href="https://shopstackng.com">www.shopstackng.com</a>
        </p>
      </section>
    </div>
  );
}
