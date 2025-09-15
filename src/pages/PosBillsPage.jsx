import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import "../styles/posbillspage.css";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Loading from "../components/Loading";
import {
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  Zap,
  Home,
  Tv,
  Wifi,
  BookOpen,
  Droplets,
  Building,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Commission configuration for bills
const BILLS_COMMISSION_CONFIG = {
  electricity: { min: 1000, commission: 100, percentage: 0.1 },
  cable_tv: { min: 1000, commission: 100, percentage: 0.15 },
  internet: { min: 1000, commission: 150, percentage: 0.2 },
  water: { min: 1000, commission: 80, percentage: 0.08 },
  education: { min: 1000, commission: 120, percentage: 0.12 },
  rent: { min: 1000, commission: 200, percentage: 0.25 }
};

// Pagination configuration
const ITEMS_PER_PAGE = 5;

export default function BillsPage() {
  const { shop } = useShopStore();
  const shopId = shop?.id;

  const [loading, setLoading] = useState(true);
  const [recentBillPayments, setRecentBillPayments] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBiller, setSelectedBiller] = useState("electricity");
  const [quickAmounts] = useState([1000, 2000, 5000, 10000, 20000]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  // Calculate total pages
  const totalPages = Math.ceil(totalPayments / ITEMS_PER_PAGE);

  // Fetch recent bill payments with pagination
  const fetchRecentBillPayments = useCallback(async (page = 1) => {
    if (!shopId) return;

    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Get total count
      const { count, error: countError } = await supabase
        .from("postransactions")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("type", "bill_payment");

      if (countError) throw countError;
      setTotalPayments(count || 0);

      // Get paginated data
      const { data, error } = await supabase
        .from("postransactions")
        .select("*")
        .eq("shop_id", shopId)
        .eq("type", "bill_payment")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setRecentBillPayments(data || []);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching bill payments:", error);
      toast.error("Failed to load recent bill payments");
    }
  }, [shopId]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      await fetchRecentBillPayments(1);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [shopId, fetchRecentBillPayments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for bill payments
  useEffect(() => {
    if (!shopId) return;

    const transactionsSubscription = supabase
      .channel("bills-transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "postransactions",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchRecentBillPayments(currentPage);
        }
      )
      .subscribe();

    return () => {
      transactionsSubscription.unsubscribe();
    };
  }, [shopId, fetchRecentBillPayments, currentPage]);

  // Calculate commission for bill payments
  const calculateCommission = (amount, billerType) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    if (numericAmount <= 0) return 0;

    const config = BILLS_COMMISSION_CONFIG[billerType];
    if (!config) return Math.max(50, Math.round(numericAmount * 0.1));

    // Use whichever is higher: fixed minimum or percentage
    const percentageCommission = Math.round(numericAmount * config.percentage);
    return Math.max(config.commission, percentageCommission);
  };

  // Calculate 2% charge
  const calculateCharges = (amount) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    return Math.round(numericAmount * 0.02);
  };

  const handleBillPayment = async (paymentData) => {
    try {
      const { data, error } = await supabase
        .from("postransactions")
        .insert([
          {
            ...paymentData,
            shop_id: shopId,
            type: "bill_payment",
            status: "completed",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        toast.success("Bill payment processed successfully!");
        setShowBillModal(false);
        fetchRecentBillPayments(currentPage);
      }
    } catch (error) {
      console.error("Error processing bill payment:", error);
      toast.error("Failed to process bill payment");
    }
  };

  const handleQuickSelect = (biller) => {
    setSelectedBiller(biller);
    setShowBillModal(true);
  };

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchRecentBillPayments(page);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="bills-wrapper">
      <div className="bills-page">
        {/* Header */}
        <div className="bills-header">
          <div className="header-left">
            <h1>Bill Payments</h1>
            <p>Process utility bills and services payments</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowBillModal(true)}
          >
            <Receipt size={18} />
            Pay Bill
          </button>
        </div>

        {/* Grid Layout */}
        <div className="bills-grid">
          {/* Biller Quick Actions */}
          <div className="bills-card quick-billers">
            <h2>Quick Pay</h2>
            <div className="billers-grid">
              <motion.button
                className="biller-btn electricity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickSelect("electricity")}
              >
                <div className="biller-icon">
                  <Zap size={24} />
                </div>
                <div className="biller-info">
                  <div className="biller-name">Electricity</div>
                  <div className="biller-desc">PHCN, AEDC, etc.</div>
                </div>
              </motion.button>

              <motion.button
                className="biller-btn cable_tv"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickSelect("cable_tv")}
              >
                <div className="biller-icon">
                  <Tv size={24} />
                </div>
                <div className="biller-info">
                  <div className="biller-name">Cable TV</div>
                  <div className="biller-desc">DStv, GOtv, Startimes</div>
                </div>
              </motion.button>

              <motion.button
                className="biller-btn internet"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickSelect("internet")}
              >
                <div className="biller-icon">
                  <Wifi size={24} />
                </div>
                <div className="biller-info">
                  <div className="biller-name">Internet</div>
                  <div className="biller-desc">ISPs, Data plans</div>
                </div>
              </motion.button>

              <motion.button
                className="biller-btn water"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickSelect("water")}
              >
                <div className="biller-icon">
                  <Droplets size={24} />
                </div>
                <div className="biller-info">
                  <div className="biller-name">Water</div>
                  <div className="biller-desc">Water corporations</div>
                </div>
              </motion.button>

              <motion.button
                className="biller-btn education"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickSelect("education")}
              >
                <div className="biller-icon">
                  <BookOpen size={24} />
                </div>
                <div className="biller-info">
                  <div className="biller-name">Education</div>
                  <div className="biller-desc">School fees, Exams</div>
                </div>
              </motion.button>

              <motion.button
                className="biller-btn rent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickSelect("rent")}
              >
                <div className="biller-icon">
                  <Home size={24} />
                </div>
                <div className="biller-info">
                  <div className="biller-name">Rent & Taxes</div>
                  <div className="biller-desc">Rent, Land use</div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Commission Guide */}
          <div className="bills-card commission-guide">
            <h2>Commission Rates</h2>
            <div className="commission-list">
              {Object.entries(BILLS_COMMISSION_CONFIG).map(([biller, config]) => (
                <div key={biller} className="commission-item">
                  <div className="biller-label">
                    {biller.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>
                  <div className="commission-details">
                    <span className="commission-amount">
                      ₦{config.commission} min or {config.percentage * 100}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="commission-item charges-info">
                <div className="biller-label">Service Charge</div>
                <div className="commission-details">
                  <span className="commission-amount">2% on all payments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bill Payments */}
          <div className="bills-card recent-payments">
            <div className="payments-header">
              <h2>Recent Bill Payments</h2>
              <button 
                className="refresh-btn"
                onClick={() => fetchRecentBillPayments(currentPage)}
              >
                <RotateCcw size={16} />
                Refresh
              </button>
            </div>
            <div className="payments-list">
              {recentBillPayments.length > 0 ? (
                recentBillPayments.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-icon">
                      <Receipt size={16} />
                    </div>
                    <div className="payment-details">
                      <div className="payment-main">
                        <span className="payment-amount">
                          ₦{parseFloat(payment.amount || 0).toLocaleString()}
                        </span>
                        <span className={`payment-biller ${payment.biller}`}>
                          {payment.biller?.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      </div>
                      <div className="payment-meta">
                        <span className="payment-customer">
                          {payment.customer_id || "No ID"}
                        </span>
                        <div className="payment-fees">
                          <span className="payment-charges">
                            Charge: ₦{parseFloat(payment.charges || 0).toLocaleString()}
                          </span>
                          <span className="payment-commission">
                            Commission: ₦{parseFloat(payment.commission || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="payment-time">
                        <Clock size={12} />
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="payment-status">
                      {payment.status === "completed" ? (
                        <CheckCircle size={16} className="success" />
                      ) : (
                        <XCircle size={16} className="error" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-payments">
                  <Receipt size={48} />
                  <p>No bill payments yet</p>
                  <small>Process your first bill payment</small>
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {recentBillPayments.length > 0 && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Amounts */}
          <div className="bills-card quick-amounts">
            <h2>Quick Amounts</h2>
            <div className="amounts-grid">
              {quickAmounts.map((amount) => (
                <motion.button
                  key={amount}
                  className="amount-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowBillModal(true);
                  }}
                >
                  ₦{amount.toLocaleString()}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Bill Payment Modal */}
        {showBillModal && (
          <BillPaymentModal
            onClose={() => setShowBillModal(false)}
            onSubmit={handleBillPayment}
            defaultBiller={selectedBiller}
          />
        )}
      </div>
    </div>
  );
}

// Bill Payment Modal Component
function BillPaymentModal({ onClose, onSubmit, defaultBiller = "electricity" }) {
  const [formData, setFormData] = useState({
    amount: "",
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    biller: defaultBiller,
  });
  const [commission, setCommission] = useState(0);
  const [charges, setCharges] = useState(0);

  const calculateCommission = (amount, billerType) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    if (numericAmount <= 0) return 0;

    const config = BILLS_COMMISSION_CONFIG[billerType];
    if (!config) return Math.max(50, Math.round(numericAmount * 0.1));

    const percentageCommission = Math.round(numericAmount * config.percentage);
    return Math.max(config.commission, percentageCommission);
  };

  const calculateCharges = (amount) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    return Math.round(numericAmount * 0.02);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const parseFormattedNumber = (formattedNum) => {
    if (!formattedNum) return 0;
    return Number(String(formattedNum).replace(/,/g, ""));
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    if (field === "amount") {
      const cleanedValue = value.replace(/[^0-9,]/g, "");
      if (cleanedValue) {
        const numericValue = parseFormattedNumber(cleanedValue);
        formattedValue = formatNumber(numericValue);
        
        if (numericValue > 0) {
          const newCommission = calculateCommission(numericValue, formData.biller);
          const newCharges = calculateCharges(numericValue);
          setCommission(newCommission);
          setCharges(newCharges);
        } else {
          setCommission(0);
          setCharges(0);
        }
      }
    } else if (field === "customer_name" && value) {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
    } else if (field === "biller") {
      formattedValue = value;
      // Recalculate commission when biller changes
      const rawAmount = parseFormattedNumber(formData.amount) || 0;
      if (rawAmount > 0) {
        const newCommission = calculateCommission(rawAmount, value);
        const newCharges = calculateCharges(rawAmount);
        setCommission(newCommission);
        setCharges(newCharges);
      }
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawAmount = parseFormattedNumber(formData.amount) || 0;

    if (rawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!formData.customer_id) {
      toast.error("Please enter customer ID/account number");
      return;
    }

    onSubmit({
      amount: rawAmount,
      customer_id: formData.customer_id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      biller: formData.biller,
      commission: commission,
      charges: charges,
    });
  };

  const getBillerPlaceholder = (biller) => {
    switch (biller) {
      case "electricity":
        return "Meter number (e.g., 04123456789)";
      case "cable_tv":
        return "Smartcard number";
      case "internet":
        return "Account number";
      case "water":
        return "Account number";
      case "education":
        return "Student ID/Registration number";
      case "rent":
        return "Property ID/Reference";
      default:
        return "Customer ID/Account number";
    }
  };

  const getBillerLabel = (biller) => {
    return biller.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Pay Bill</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Biller Type</label>
            <select
              value={formData.biller}
              onChange={(e) => handleInputChange("biller", e.target.value)}
              required
            >
              <option value="electricity">Electricity</option>
              <option value="cable_tv">Cable TV</option>
              <option value="internet">Internet</option>
              <option value="water">Water</option>
              <option value="education">Education</option>
              <option value="rent">Rent & Taxes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount (₦)</label>
            <input
              type="text"
              placeholder="Enter amount (e.g., 5,000)"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Customer ID / Account Number</label>
            <input
              type="text"
              placeholder={getBillerPlaceholder(formData.biller)}
              value={formData.customer_id}
              onChange={(e) => handleInputChange("customer_id", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Customer Name (Optional)</label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={formData.customer_name}
              onChange={(e) => handleInputChange("customer_name", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Customer Phone (Optional)</label>
            <input
              type="tel"
              placeholder="08012345678"
              value={formData.customer_phone}
              onChange={(e) => handleInputChange("customer_phone", e.target.value)}
              maxLength={11}
            />
          </div>

          <div className="transaction-summary">
            <div className="summary-item">
              <span>Biller:</span>
              <span>{getBillerLabel(formData.biller)}</span>
            </div>
            <div className="summary-item">
              <span>Amount:</span>
              <span>₦{formData.amount || "0"}</span>
            </div>
            <div className="summary-item charges">
              <span>Service Charge (2%):</span>
              <span>-₦{charges.toLocaleString()}</span>
            </div>
            <div className="summary-item commission">
              <span>Commission:</span>
              <span>+₦{commission.toLocaleString()}</span>
            </div>
            <div className="summary-item total">
              <span>Net Amount:</span>
              <span>
                ₦{(
                  (parseFormattedNumber(formData.amount) || 0) - 
                  charges + 
                  commission
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!formData.amount || !formData.customer_id}
            >
              Process Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}