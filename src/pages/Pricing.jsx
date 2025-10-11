import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaCrown, FaStore, FaRocket, FaStar, FaQuestionCircle, FaPhone, FaEnvelope, FaArrowLeft, FaSync } from 'react-icons/fa';
import '../styles/pricing.css';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const togglePlan = () => {
    setIsAnnual(!isAnnual);
    setSelectedPlan(isAnnual ? 'monthly' : 'annual');
  };

  const handleStartTrial = (plan) => {
    // In a real app, this would redirect to signup with the selected plan
    navigate('/signup');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleRenewal = () => {
    // Navigate to renewal page or show renewal modal
    navigate('/subscribe');
    // Alternatively, you could open a modal or redirect to login
    // navigate('/login?action=renewal');
  };

  const plans = [
    {
      name: 'Basic',
      description: 'Perfect for small businesses just getting started',
      monthlyPrice: '₦1,500',
      annualPrice: '₦15,300',
      features: [
        { text: 'Basic POS System', included: true },
        { text: 'Inventory Management', included: true },
        { text: 'Basic Sales Reports', included: true },
        { text: 'Single User', included: true },
        { text: 'Customer Management', included: false },
        { text: 'Multi-user Support', included: false }
      ],
      featured: false
    },
    {
      name: 'Pro',
      description: 'Everything you need to grow your business',
      monthlyPrice: '₦2,000',
      annualPrice: '₦20,400',
      features: [
        { text: 'Full POS System', included: true },
        { text: 'Advanced Inventory', included: true },
        { text: 'Sales Analytics & Reports', included: true },
        { text: 'Customer Management', included: true },
        { text: 'Multi-user Support (up to 5)', included: true },
        { text: 'Email & Chat Support', included: true }
      ],
      featured: true
    },
    {
      name: 'Enterprise',
      description: 'For growing businesses with advanced needs',
      monthlyPrice: '₦3,500',
      annualPrice: '₦35,700',
      features: [
        { text: 'Advanced POS System', included: true },
        { text: 'Unlimited Inventory', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Customer Loyalty Program', included: true },
        { text: 'Multi-user Support (unlimited)', included: true },
        { text: 'Priority Support', included: true }
      ],
      featured: false
    }
  ];

  const comparisonData = [
    { feature: 'Users', basic: '1', pro: 'Up to 5', enterprise: 'Unlimited' },
    { feature: 'Products', basic: '100', pro: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Sales Reports', basic: 'Basic', pro: 'Advanced', enterprise: 'Advanced + Export' },
    { feature: 'Support', basic: 'Email', pro: 'Email & Chat', enterprise: 'Priority 24/7' },
  ];

  const faqs = [
    {
      question: 'How does the 30-day free trial work?',
      answer: 'You get full access to all ShopStack features for 30 days completely free. No credit card required. After 30 days, your subscription will automatically continue unless you cancel.'
    },
    {
      question: 'Can I cancel during the trial period?',
      answer: 'Yes, you can cancel at any time during your trial without charges. We\'ll send reminders before your trial ends.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bank transfers, debit cards, and payments through Flutterwave and Paystack.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No, there are no hidden fees or setup costs. You only pay the subscription after your free trial.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely! We use industry-standard encryption and security practices to protect your data.'
    },
  ];

  return (
    <div className="pricing-page">

      
      {/* Header Section */}
      
      <section className="pricing-hero">
        <div className="back-to-home-container">
          <button className="back-to-home-btn" onClick={handleBackToHome}>
            <FaArrowLeft /> Back to Home
          </button>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1>Simple, Transparent Pricing</h1>
            <p>Choose the plan that works best for your business. All plans include a 30-day free trial.</p>
            
            {/* Renewal Link for Existing Users */}
            <div className="renewal-section">
              <p className="renewal-text">Existing user? Need to renew your subscription?</p>
              <button className="renewal-link" onClick={handleRenewal}>
                <FaSync /> Renew Your Subscription
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="pricing-toggle-section">
        <div className="container">
          <div className="toggle-container">
            <span className={!isAnnual ? 'active' : ''}>Monthly</span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isAnnual}
                onChange={togglePlan}
              />
              <span className="slider"></span>
            </label>
            <span className={isAnnual ? 'active' : ''}>
              Annual <span className="save-badge">Save 15%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-cards-section">
        <div className="container">
          <div className="pricing-cards">
            {plans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                {plan.featured && (
                  <div className="popular-badge">
                    <FaCrown /> MOST POPULAR
                  </div>
                )}
                
                <div className="card-header">
                  <div className="plan-icon">
                    {plan.name === 'Basic' && <FaStore />}
                    {plan.name === 'Pro' && <FaRocket />}
                    {plan.name === 'Enterprise' && <FaStar />}
                  </div>
                  <h3>{plan.name}</h3>
                  <div className="price">
                    {selectedPlan === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                    <span>/{selectedPlan === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <p>{plan.description}</p>
                </div>

                <ul className="features-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={feature.included ? 'included' : 'excluded'}>
                      {feature.included ? <FaCheck className="check-icon" /> : <FaTimes className="times-icon" />}
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <button 
                  className={`cta-button ${plan.featured ? 'primary' : 'secondary'}`}
                  onClick={() => handleStartTrial(plan.name)}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison-section">
        <div className="container">
          <h2>Plan Comparison</h2>
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-feature">Feature</div>
              <div className="comparison-plan">Basic</div>
              <div className="comparison-plan">Pro</div>
              <div className="comparison-plan">Enterprise</div>
            </div>
            
            {comparisonData.map((row, index) => (
              <div key={index} className="comparison-row">
                <div className="comparison-feature">{row.feature}</div>
                <div className="comparison-plan">{row.basic}</div>
                <div className="comparison-plan">{row.pro}</div>
                <div className="comparison-plan">{row.enterprise}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h4><FaQuestionCircle /> {faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta">
        <div className="container">
          <h2>Still have questions?</h2>
          <p>Our team is here to help you choose the right plan for your business</p>
          <div className="contact-options">
            <a href="mailto:shopstackng@gmail.com" className="contact-link">
              <FaEnvelope /> shopstackng@gmail.com
            </a>
            <a href="tel:+2348037834432" className="contact-link">
              <FaPhone /> +234 803 783 4432
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;