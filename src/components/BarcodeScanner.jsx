import React from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import "../styles/BarcodeScanner.css";

export default function BarcodeScanner({ onDetected, onClose }) {
  return (
    <div className="barcode-scanner-overlay">
      <button className="close-btn" onClick={onClose}>Close Scanner</button>
      <BarcodeScannerComponent
        width={400}
        height={400}
        onUpdate={(err, result) => {
          if (result) {
            onDetected(result.text);
          }
        }}
      />
    </div>
  );
}
