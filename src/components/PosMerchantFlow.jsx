import React from "react";
import { FaCashRegister, FaUsers, FaCreditCard, FaWallet, FaChartLine, FaExclamationTriangle, FaStore } from "react-icons/fa";
import "../styles/PosMerchantFlow.css";

export default function PosMerchantFlow() {
  const steps = [
    {
      icon: <FaStore />,
      title: "Setup",
      description: "Merchant registers with a bank/fintech (OPay, Moniepoint, Palmpay, etc.), gets a POS machine, and sets up a kiosk or roadside shop."
    },
    {
      icon: <FaUsers />,
      title: "Customer Arrives",
      description: "People come for cash withdrawals, deposits, airtime, data, or utility bill payments."
    },
    {
      icon: <FaCreditCard />,
      title: "Transaction",
      description: "Merchant collects card or account details, enters the amount, and customer authenticates with PIN. Transaction success or failure depends on the network."
    },
    {
      icon: <FaWallet />,
      title: "Settlement",
      description: "Money goes into the merchant’s settlement account (same day or next). Merchant keeps a cash float for serving the next customer."
    },
    {
      icon: <FaChartLine />,
      title: "Revenue",
      description: "Merchant charges fees per transaction (e.g. ₦100 for ₦1k–₦5k). Extra profit comes from selling provisions and recharge cards."
    },
    {
      icon: <FaExclamationTriangle />,
      title: "Challenges",
      description: "Network failures, need for large cash float, fraud risks, disputes over failed transactions, and high competition."
    },
    {
      icon: <FaCashRegister />,
      title: "Growth",
      description: "Successful agents expand into agency banking, becoming trusted community bankers. ShopStack can help with inventory, sales, and debt tracking."
    },
  ];

  return (
    <section className="pos-merchant-flow">
      <h2>How POS Merchants Work in Nigeria</h2>
      <div className="flow-grid">
        {steps.map((step, index) => (
          <div key={index} className="flow-card">
            <div className="icon">{step.icon}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
