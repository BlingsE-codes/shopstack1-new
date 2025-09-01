import React, { useState, useEffect } from 'react';
import '../styles/pricing.css';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0); // ensure page opens at the top
  }, []);

  // Toggle between monthly and annual plans
  const togglePlan = () => {
    setIsAnnual(!isAnnual);
    setSelectedPlan(isAnnual ? 'monthly' : 'annual');
  };

  return (
    <div className="pricing-container">
      <div className='pricing-header'>
        <div>
           <h1 className="subtitle1">
          Empower your business with tools built for growth 🚀
        </h1>
          {/* <h1>ShopStack Pricing</h1> */}
          <p className="subtitle">Simple, transparent pricing to grow your business</p>
        </div>
      </div>
      
      <div className="pricing-content">
        {/* Toggle */}
        <div className="plan-toggle-container">
          <div className="plan-toggle">
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
        
        {/* Pricing Cards */}
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="card-header">
              <h2>Basic Plan</h2>
              <div className="price">
                {selectedPlan === 'monthly' ? (
                  <>
                    ₦1,500 <span>/month</span>
                  </>
                ) : (
                  <>
                    ₦15,300 <span>/year</span>
                  </>
                )}
              </div>
              <div className="trial-badge">30-Day Free Trial</div>
            </div>
            
            <p>Perfect for small businesses just getting started</p>
            
            <ul className="features">
              <li><i className="fas fa-check"></i> Basic POS System</li>
              <li><i className="fas fa-check"></i> Inventory Management</li>
              <li><i className="fas fa-check"></i> Basic Sales Reports</li>
              <li><i className="fas fa-check"></i> Single User</li>
              <li><i className="fas fa-times"></i> Customer Management</li>
              <li><i className="fas fa-times"></i> Multi-user Support</li>
            </ul>
            
            <button className="cta-button secondary">Start Free Trial</button>
          </div>
          
          <div className="pricing-card featured">
            <div className="popular-badge">MOST POPULAR</div>
            <div className="card-header">
              <h2>Pro Plan</h2>
              <div className="price">
                {selectedPlan === 'monthly' ? (
                  <>
                    ₦2,000 <span>/month</span>
                  </>
                ) : (
                  <>
                    ₦20,400 <span>/year</span>
                  </>
                )}
              </div>
              <div className="trial-badge">30-Day Free Trial</div>
            </div>
            
            <p>Everything you need to grow your business</p>
            
            <ul className="features">
              <li><i className="fas fa-check"></i> Full POS System</li>
              <li><i className="fas fa-check"></i> Advanced Inventory</li>
              <li><i className="fas fa-check"></i> Sales Analytics & Reports</li>
              <li><i className="fas fa-check"></i> Customer Management</li>
              <li><i className="fas fa-check"></i> Multi-user Support (up to 5)</li>
              <li><i className="fas fa-check"></i> Email & Chat Support</li>
            </ul>
            
            <button className="cta-button primary">Start Free Trial</button>
          </div>
          
          <div className="pricing-card">
            <div className="card-header">
              <h2>Enterprise</h2>
              <div className="price">
                {selectedPlan === 'monthly' ? (
                  <>
                    ₦3,500 <span>/month</span>
                  </>
                ) : (
                  <>
                    ₦35,700 <span>/year</span>
                  </>
                )}
              </div>
              <div className="trial-badge">30-Day Free Trial</div>
            </div>
            
            <p>For growing businesses with advanced needs</p>
            
            <ul className="features">
              <li><i className="fas fa-check"></i> Advanced POS System</li>
              <li><i className="fas fa-check"></i> Unlimited Inventory</li>
              <li><i className="fas fa-check"></i> Advanced Analytics</li>
              <li><i className="fas fa-check"></i> Customer Loyalty Program</li>
              <li><i className="fas fa-check"></i> Multi-user Support (unlimited)</li>
              <li><i className="fas fa-check"></i> Priority Support</li>
            </ul>
            
            <button className="cta-button secondary">Start Free Trial</button>
          </div>
        </div>
        
        {/* Comparison Table */}
        <div className="comparison-section">
          <h2>Plan Comparison</h2>

           <div className="comparison-row headerr">
              <div className="comparison-feature">Feature</div>
              <div className="comparison-plan">Basic</div>
              <div className="comparison-plan">Pro</div>
              <div className="comparison-plan">Enterprise</div>
            </div>
          <div className="comparison-table">
           
            <div className="comparison-row">
              <div className="comparison-feature">Users</div>
              <div className="comparison-plan">1</div>
              <div className="comparison-plan">Up to 5</div>
              <div className="comparison-plan">Unlimited</div>
            </div>
            <div className="comparison-row">
              <div className="comparison-feature">Products</div>
              <div className="comparison-plan">100</div>
              <div className="comparison-plan">Unlimited</div>
              <div className="comparison-plan">Unlimited</div>
            </div>
            <div className="comparison-row">
              <div className="comparison-feature">Sales Reports</div>
              <div className="comparison-plan">Basic</div>
              <div className="comparison-plan">Advanced</div>
              <div className="comparison-plan">Advanced + Export</div>
            </div>
            <div className="comparison-row">
              <div className="comparison-feature">Support</div>
              <div className="comparison-plan">Email</div>
              <div className="comparison-plan">Email & Chat</div>
              <div className="comparison-plan">Priority 24/7</div>
            </div>
          </div>
        </div>
        
        {/* FAQ */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How does the 30-day free trial work?</h3>
              <p>
                You get full access to all ShopStack features for 30 days completely free. 
                No credit card required. After 30 days, your subscription will automatically continue unless you cancel.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Can I cancel during the trial period?</h3>
              <p>Yes, you can cancel at any time during your trial without charges. We'll send reminders before your trial ends.</p>
            </div>
            
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept bank transfers, debit cards, and payments through Flutterwave and Paystack.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is there a setup fee?</h3>
              <p>No, there are no hidden fees or setup costs. You only pay the subscription after your free trial.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I change plans later?</h3>
              <p>Yes, you can upgrade or downgrade your plan at any time from your account settings.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is my data secure?</h3>
              <p>Absolutely! We use industry-standard encryption and security practices to protect your data.</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="pricing-footer">
        <p>Have more questions? Contact us at <a href="mailto:shopstackng@gmail.com">shopstackng@gmail.com</a> or call <a href="tel:+2348037834432">+234 803 783 4432</a></p>
      </footer>
    </div>
  );
};

export default Pricing;