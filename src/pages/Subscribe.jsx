import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { supabase } from "../services/supabaseClient";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import "../styles/subscribe.css";

const Subscribe = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const expired = location.search.includes("expired=true");
  const isRenewal = location.search.includes("renewal=true");
  const [isPaid, setIsPaid] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Plan configuration
  const plans = {
    basic: {
      name: "Basic",
      monthlyPrice: 1500,
      description: "Perfect for small businesses just getting started"
    },
    pro: {
      name: "Pro",
      monthlyPrice: 2000,
      description: "Everything you need to grow your business"
    },
    enterprise: {
      name: "Enterprise",
      monthlyPrice: 3500,
      description: "For growing businesses with advanced needs"
    }
  };

  // Fetch user's subscription data
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("auth_id", user.id)
            .single();
          
          if (error) throw error;
          setUserSubscription(data);
          
          if (isRenewal && data.plan_type) {
            setSelectedPlan(data.plan_type.toLowerCase());
          }
        } catch (error) {
          console.error("Error fetching subscription:", error);
          setError("Failed to load subscription data");
        }
      }
    };

    fetchUserSubscription();
  }, [user?.id, isRenewal]);

  // Generate transaction reference
  const generateTransactionRef = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return `flw_tx_ref_${result}_${Date.now()}`;
  };

  // Calculate subscription expiration date
  const calculateExpirationDate = () => {
    if (isRenewal && userSubscription?.subscription_expires) {
      const currentExpiration = new Date(userSubscription.subscription_expires);
      if (currentExpiration > new Date()) {
        return new Date(currentExpiration.setDate(currentExpiration.getDate() + 30));
      }
    }
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  };

  // Get payment config
  const getPaymentConfig = () => {
    const selectedPlanData = plans[selectedPlan];
    return {
      public_key: "FLWPUBK_TEST-53394d3c1980a69a7e22dbc0143da46c-X",
      tx_ref: generateTransactionRef(10),
      amount: selectedPlanData.monthlyPrice,
      currency: "NGN",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: user?.email || "example@example.com",
        phone_number: user?.phone || "08000000000",
        name: user?.user_metadata?.full_name || "ShopStack User",
      },
      customizations: {
        title: isRenewal ? `ShopStack ${selectedPlanData.name} Renewal` : `ShopStack ${selectedPlanData.name} Subscription`,
        description: isRenewal ? `Renew your ${selectedPlanData.name} subscription` : `Upgrade to ${selectedPlanData.name} plan`,
        logo: "https://yourdomain.com/logo.png",
      },
    };
  };

  const handleFlutterwaveResponse = async (response) => {
    console.log("Payment response:", response);
    
    if (response.status === "successful") {
      closePaymentModal();
      setLoading(true);
      setError("");
      
      try {
        const expirationDate = calculateExpirationDate();
        const currentRenewalCount = userSubscription?.renewal_count || 0;
        const selectedPlanData = plans[selectedPlan];
        const config = getPaymentConfig();

        // Update user profile
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            is_paid: true,
            plan_type: selectedPlanData.name,
            renewed_at: new Date().toISOString(),
            subscription_expires: expirationDate.toISOString(),
            renewal_count: isRenewal ? currentRenewalCount + 1 : 1,
            subscription_data: {
              ...(userSubscription?.subscription_data || {}),
              last_payment: {
                amount: selectedPlanData.monthlyPrice,
                currency: "NGN",
                date: new Date().toISOString(),
                transaction_ref: response.transaction_id || config.tx_ref
              },
              plan_history: [
                ...(userSubscription?.subscription_data?.plan_history || []),
                {
                  plan: selectedPlan,
                  start_date: new Date().toISOString(),
                  end_date: expirationDate.toISOString(),
                  amount: selectedPlanData.monthlyPrice,
                  type: isRenewal ? 'renewal' : 'new'
                }
              ]
            }
          })
          .eq("auth_id", user?.id);

        if (profileError) throw profileError;

        // Record transaction
        const { error: transactionError } = await supabase
          .from("payment_transactions")
          .insert({
            user_id: user.id,
            plan_type: selectedPlan,
            amount: selectedPlanData.monthlyPrice,
            currency: "NGN",
            transaction_ref: response.transaction_id || config.tx_ref,
            status: "completed",
            payment_method: "flutterwave",
            subscription_type: isRenewal ? "renewal" : "new",
            expires_at: expirationDate.toISOString()
          });

        if (transactionError) {
          console.error("Transaction recording failed:", transactionError);
        }

        console.log("Payment successful! Account updated.");
        setIsPaid(true);
        
        // Navigate to shops after successful payment
        setTimeout(() => {
          navigate("/shops", { replace: true });
        }, 1500);
        
      } catch (error) {
        console.error("Error updating subscription:", error);
        setError("Payment successful but there was an error updating your subscription. Please contact support.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Payment was not successful. Please try again.");
      console.log("Payment status:", response.status);
    }
  };

  const config = getPaymentConfig();
  const handleFlutterwavePayment = useFlutterwave(config);

  if (!handleFlutterwavePayment) {
    return (
      <div className="subscribe-container">
        <div className="subscribe-card">
          <div>Loading payment system...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscribe-container">
      {expired && (
        <div className="trial-expired-banner">
          <h2>⏳ Trial Expired</h2>
          <p>Your 30-day free trial has ended. Upgrade now to continue using ShopStack.</p>
        </div>
      )}
      
      {isRenewal && (
        <div className="renewal-banner">
          <h2>🔄 Renew Your Subscription</h2>
          <p>Renew your subscription to continue enjoying ShopStack features.</p>
          {userSubscription && (
            <div className="previous-subscription-info">
              <p>Current plan: <strong>{userSubscription.plan_type || 'None'}</strong></p>
              {userSubscription.subscription_expires && (
                <p>
                  Expires: <strong>{new Date(userSubscription.subscription_expires).toLocaleDateString()}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="subscribe-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {isPaid && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Redirecting you to your shops...</p>
          </div>
        )}
        
        {!isPaid && (
          <>
            <div className="header-section">
              <h1>
                {isRenewal 
                  ? `Renew ${plans[selectedPlan].name} Plan` 
                  : 'Choose Your Plan'
                }
              </h1>
              <p>Get started with ShopStack Premium features</p>
            </div>
            
            {/* Plan Selection */}
            {!isRenewal && (
              <div className="plan-selection">
                <h3>Select a Plan</h3>
                <div className="plan-options">
                  {Object.entries(plans).map(([key, plan]) => (
                    <div 
                      key={key}
                      className={`plan-option ${selectedPlan === key ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(key)}
                    >
                      <div className="plan-header">
                        <h4>{plan.name}</h4>
                        <div className="price">₦{plan.monthlyPrice}<span>/month</span></div>
                      </div>
                      <p>{plan.description}</p>
                      <div className="plan-features">
                        <span>✓ All Basic Features</span>
                        {key === 'pro' && <span>✓ Advanced Analytics</span>}
                        {key === 'enterprise' && <span>✓ Priority Support</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Payment Summary */}
            <div className="payment-summary">
              <h3>Order Summary</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Plan</span>
                  <strong>{plans[selectedPlan].name}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount</span>
                  <strong>₦{plans[selectedPlan].monthlyPrice}</strong>
                </div>
                <div className="summary-row">
                  <span>Duration</span>
                  <strong>30 days</strong>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <strong>₦{plans[selectedPlan].monthlyPrice}</strong>
                </div>
              </div>
            </div>
            
            {/* Payment Button */}
            <button 
              className={`payment-button ${loading ? 'loading' : ''} ${isRenewal ? 'renewal' : 'subscribe'}`}
              onClick={() => {
                if (loading) return;
                handleFlutterwavePayment({
                  callback: handleFlutterwaveResponse,
                  onClose: () => {
                    console.log("Payment window closed.");
                    setLoading(false);
                  },
                });
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing Payment...
                </>
              ) : isRenewal ? (
                `Renew ${plans[selectedPlan].name} - ₦${plans[selectedPlan].monthlyPrice}`
              ) : (
                `Subscribe to ${plans[selectedPlan].name} - ₦${plans[selectedPlan].monthlyPrice}`
              )}
            </button>
            
            <p className="secure-note">🔒 Secure payment processed by Flutterwave</p>
            
            {/* Subscription Terms */}
            <div className="subscription-terms">
              <h4>Subscription Terms</h4>
              <ul>
                <li>✅ 30-day subscription period</li>
                <li>✅ Auto-renewal reminders sent 3 days before expiry</li>
                <li>✅ Cancel anytime from your account settings</li>
                <li>✅ Full access to all plan features</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Subscribe;