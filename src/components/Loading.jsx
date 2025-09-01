import React from "react";
import "../styles/loading.css";

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="dots-container">
          <div className="dot dot-11"></div>
          <div className="dot dot-22"></div>
          <div className="dot dot-33"></div>
        </div>
        <p className="loading-text">Loading ShopStack...</p>
      </div>
    </div>
  );
}