// components/ModernReceipt.js
import React, { useRef } from "react";
import { useShopStore } from "../store/shop-store";
import dayjs from "dayjs";

const ModernReceipt = ({ cartItems, onClose, isOffline = false }) => {
  const { shop } = useShopStore();
  const receiptRef = useRef(null);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.amount, 0);
  const dateStr = dayjs(new Date()).format("DD MMM YYYY, HH:mm");
  const receiptNumber = Date.now().toString().slice(-6);

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="max-width: 80mm; margin: 0 auto; font-family: 'Courier New', monospace;">
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleDownload = () => {
    const receiptContent = receiptRef.current.innerHTML;
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt-${receiptNumber}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              max-width: 80mm; 
              margin: 0 auto; 
              padding: 10px;
            }
            .receipt-header { text-align: center; border-bottom: 1px dashed #000; margin-bottom: 10px; }
            .receipt-info { font-size: 12px; margin-bottom: 10px; }
            table { width: 100%; font-size: 12px; border-collapse: collapse; }
            th, td { padding: 3px 0; }
            th { border-bottom: 1px solid #000; }
            .receipt-total { border-top: 1px dashed #000; font-weight: bold; margin-top: 5px; }
            .receipt-footer { text-align: center; font-size: 11px; margin-top: 10px; }
            .offline-notice { color: #e74c3c; font-weight: bold; text-align: center; margin: 5px 0; }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modern-receipt-overlay">
      <div className="modern-receipt-container">
        <div className="modern-receipt-actions">
          <button onClick={onClose} className="modern-receipt-close">
            <span>×</span>
          </button>
          <div className="action-buttons">
            <button onClick={handlePrint} className="action-btn print-btn">
              <span className="icon">🖨️</span> Print
            </button>
            <button onClick={handleDownload} className="action-btn download-btn">
              <span className="icon">📥</span> Download
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Receipt ${receiptNumber}`,
                    text: `Receipt from ${shop.name} for ₦${totalAmount.toLocaleString()}`,
                  }).catch(() => {})
                }
              }} 
              className="action-btn share-btn" 
              disabled={!navigator.share}
            >
              <span className="icon">↗️</span> Share
            </button>
          </div>
        </div>

        <div className="modern-receipt-content" ref={receiptRef}>
          <div className="modern-receipt-header">
            {shop.logo_url && (
              <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />
            )}
            <h2>{shop.name || "My Shop"}</h2>
            <p>{shop.address || ""}</p>
            <small>{shop.phone || ""}</small>
          </div>
          
          {isOffline && (
            <div className="offline-notice">
              OFFLINE SALE - PENDING SYNC
            </div>
          )}
          
          <div className="modern-receipt-info">
            <div className="info-row">
              <span>Date: {dateStr}</span>
              <span>Receipt #: {receiptNumber}</span>
            </div>
          </div>
          
          <table className="modern-receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="item-name">{item.name}</div>
                    {item.form && <div className="item-form">{item.form}</div>}
                  </td>
                  <td>{item.quantity}</td>
                  <td>₦{item.price.toLocaleString()}</td>
                  <td>₦{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="modern-receipt-total">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>₦0.00</span>
            </div>
            <div className="total-row grand-total">
              <span>TOTAL:</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="modern-receipt-footer">
            <p>Thank you for your purchase!</p>
            <div className="payment-info">
              <div>Payment Method: Cash</div>
              <div>Status: {isOffline ? 'Pending Sync' : 'Completed'}</div>
            </div>
            <small>Powered by ShopStack</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernReceipt;