import React from "react";
import "../styles/howitworks.css";
import { useEffect } from "react";
import { FaUserPlus, FaStore, FaBoxOpen, FaCashRegister, FaMoneyBillWave, FaUsers, FaUserEdit } from "react-icons/fa";

const steps = [
  {
    number: "1",
    icon: <FaUserPlus />,
    title: "Sign Up",
    desc: "Create your ShopStack account in just a few clicks. Enter your details and enjoy a 45-day free trial.",
  },
  {
    number: "2",
    icon: <FaStore />,
    title: "Create Shop(s)",
    desc: "Add one or multiple shops under your account. Each shop has its own sales, products, and reports.",
  },
  {
    number: "3",
    icon: <FaBoxOpen />,
    title: "Add Products",
    desc: "Upload your products with details like name, price, and stock quantity. Keep everything organized.",
  },
  {
    number: "4",
    icon: <FaCashRegister />,
    title: "Make Sales",
    desc: "Record customer purchases instantly. ShopStack auto-updates stock and tracks your daily sales.",
  },
  {
    number: "5",
    icon: <FaMoneyBillWave />,
    title: "Track Expenses",
    desc: "Easily log expenses such as supplies, rent, or utilities. See your true profit in real time.",
  },
  {
    number: "6",
    icon: <FaUsers />,
    title: "Manage Debtors",
    desc: "Record customers who owe money. Keep track of who owes what, and send reminders.",
  },
  {
    number: "7",
    icon: <FaUserEdit />,
    title: "Edit Profile",
    desc: "Customize your account, update shop details, and upload your shop logo anytime.",
  },
];



export default function HowItWorks() {

  useEffect(() => {
  window.scrollTo(0, 0);
}, []);

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2>How ShopStack Works</h2>
          <p>From signup to success — your business simplified step by step.</p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={index} className="step">
              <div className="step-orb">
                <div className="step-icon">{step.icon}</div>
                <div className="step-number">{step.number}</div>
                <div className="orb-glow"></div>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}