import React from "react";
import "../styles/Loading.css";

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="breathing-circle"></div>
      <p className="loading-text">Loading ShopStack...</p>
    </div>
  );
}
