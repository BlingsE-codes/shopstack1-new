import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import "../styles/posairtimepage.css";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Loading from "../components/Loading";
import {
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  Smartphone
} from "lucide-react";
import MTN from "../assets/mtn.svg";
import GLO from "../assets/glo9mobile.svg";
import ETISALAT from "../assets/etisalat.svg";
import AIRTEL from "../assets/airtel.svg";

export default function AirtimePage() {
  const { shop } = useShopStore();
  const shopId = shop?.id;

  const [loading, setLoading] = useState(true);
  const [airtimeInventory, setAirtimeInventory] = useState({
    MTN: 0,
    GLO: 0,
    Airtel: 0,
    "9Mobile": 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("MTN");
  const [selectedTopupNetwork, setSelectedTopupNetwork] = useState("MTN");
  const [quickAmounts] = useState([100, 200, 500, 1000, 2000, 5000]);

  // Fetch airtime inventory
  const fetchAirtimeInventory = useCallback(async () => {
    if (!shopId) return;

    try {
      const { data, error } = await supabase
        .from("posinventory")
        .select("network, balance")
        .eq("shop_id", shopId);

      if (error) throw error;

      const invObj = { MTN: 0, GLO: 0, Airtel: 0, "9Mobile": 0 };
      data?.forEach((i) => {
        invObj[i.network] = parseFloat(i.balance || 0);
      });
      setAirtimeInventory(invObj);
    } catch (error) {
      console.error("Error fetching airtime inventory:", error);
      toast.error("Failed to load airtime inventory");
    }
  }, [shopId]);

  // Fetch recent airtime transactions
  const fetchRecentTransactions = useCallback(async () => {
    if (!shopId) return;

    try {
      const { data, error } = await supabase
        .from("postransactions")
        .select("*")
        .eq("shop_id", shopId)
        .eq("type", "airtime")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load recent transactions");
    }
  }, [shopId]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchAirtimeInventory(),
        fetchRecentTransactions()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [shopId, fetchAirtimeInventory, fetchRecentTransactions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!shopId) return;

    const inventorySubscription = supabase
      .channel("airtime-inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posinventory",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchAirtimeInventory();
        }
      )
      .subscribe();

    const transactionsSubscription = supabase
      .channel("airtime-transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "postransactions",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchRecentTransactions();
        }
      )
      .subscribe();

    return () => {
      inventorySubscription.unsubscribe();
      transactionsSubscription.unsubscribe();
    };
  }, [shopId, fetchAirtimeInventory, fetchRecentTransactions]);

 const handleAirtimeSale = async (transactionData) => {
  try {
    const transactionAmount = parseFloat(transactionData.amount || 0);
    
    // Check inventory before proceeding
    if (transactionAmount > airtimeInventory[transactionData.network]) {
      toast.error(`Not enough ${transactionData.network} airtime inventory. Available: ₦${airtimeInventory[transactionData.network].toLocaleString()}`);
      return;
    }

    const { data, error } = await supabase
      .from("postransactions")
      .insert([
        {
          ...transactionData,
          shop_id: shopId,
          type: "airtime",
          status: "completed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      const newTransaction = data[0];

      // Get current balance first
      const { data: currentData, error: fetchError } = await supabase
        .from("posinventory")
        .select("balance")
        .eq("shop_id", shopId)
        .eq("network", newTransaction.network)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = currentData?.balance || 0;
      const newBalance = currentBalance - transactionAmount;

      // Update airtime inventory
      const { error: invError } = await supabase
        .from("posinventory")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("shop_id", shopId)
        .eq("network", newTransaction.network);

      if (invError) throw invError;
      
      // Update local state
      setAirtimeInventory(prev => ({
        ...prev,
        [newTransaction.network]: newBalance
      }));

      toast.success("Airtime sold successfully!");
      setShowAirtimeModal(false);
    }
  } catch (error) {
    console.error("Error processing airtime sale:", error);
    toast.error("Failed to process airtime sale");
  }
};
const handleTopupInventory = async (topupData) => {
  try {
    // First, get the current balance
    const { data: currentData, error: fetchError } = await supabase
      .from("posinventory")
      .select("balance")
      .eq("shop_id", shopId)
      .eq("network", topupData.network)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const currentBalance = currentData?.balance || 0;
    const newBalance = currentBalance + topupData.amount;

    // Update or insert the inventory record
    const { error } = await supabase
      .from("posinventory")
      .upsert({
        shop_id: shopId,
        network: topupData.network,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shop_id,network'
      });

    if (error) throw error;

    // Update local state
    setAirtimeInventory(prev => ({
      ...prev,
      [topupData.network]: newBalance
    }));

    toast.success(`₦${topupData.amount.toLocaleString()} added to ${topupData.network} inventory!`);
    setShowTopupModal(false);
  } catch (error) {
    console.error("Error topping up inventory:", error);
    toast.error("Failed to top up inventory");
  }
};

  const handleQuickSelect = (network) => {
    setSelectedNetwork(network);
    setShowAirtimeModal(true);
  };

  if (loading) return <Loading />;

  return (
    <div className="airtime-wrapper">
      <div className="airtime-page">
        {/* Header */}
        <div className="airtime-header">
          <div className="header-left">
            <h1>Airtime Sales</h1>
            <p>Manage airtime inventory and sales</p>
          </div>
          <button 
            className="airtime-btn-primary"
            onClick={() => setShowAirtimeModal(true)}
          >
            <Phone size={18} />
            Sell Airtime
          </button>
        </div>

        {/* Grid Layout */}
        <div className="airtime-grid">
          {/* Network Quick Actions */}
          <div className="airtime-card quick-networks">
            <h2>Quick Sell</h2>
            <div className="network-grid">
              {Object.entries(airtimeInventory).map(([network, balance]) => (
                <motion.button
                  key={network}
                  className={`network-btn ${network.toLowerCase()}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickSelect(network)}
                  disabled={balance < 100}
                >
                  <div className="network-icon">
                    {network === "MTN" && <img src={MTN} alt="MTN" className="network-logo" />}
                    {network === "GLO" && <img src={GLO} alt="GLO" className="network-logo" />}
                    {network === "Airtel" && <img src={AIRTEL} alt="Airtel" className="network-logo" />}
                    {network === "9Mobile" && <img src={ETISALAT} alt="9Mobile" className="network-logo" />}
                  </div>
                  <div className="network-info">
                    <div className="network-name">{network}</div>
                    <div className="network-balance">
                      ₦{balance.toLocaleString()}
                    </div>
                    {balance < 5000 && (
                      <div className="low-balance-indicator">
                        Low balance
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="airtime-card inventory-summary">
            <div className="inventory-header">
              <h2>Inventory Summary</h2>
              <button 
                className="airtime-btn-primary btn-sm"
                onClick={() => {
                  setSelectedTopupNetwork("MTN");
                  setShowTopupModal(true);
                }}
              >
                <Plus size={16} />
                Top Up
              </button>
            </div>
            <div className="inventory-stats">
              {Object.entries(airtimeInventory).map(([network, balance]) => (
                <div key={network} className="inventory-item">
                  <div className="inventory-header">
                    <span className="network-label">{network}</span>
                    <span className={`inventory-amount ${balance < 5000 ? 'low' : ''}`}>
                      ₦{balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="inventory-bar">
                    <div 
                      className={`inventory-fill ${network.toLowerCase()} ${balance < 5000 ? 'low' : ''}`}
                      style={{ 
                        width: `${Math.min((balance / 50000) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="inventory-actions">
                    {balance < 5000 && (
                      <div className="low-balance-warning">
                        <XCircle size={14} />
                        Low balance
                      </div>
                    )}
                    <button 
                      className="topup-btn"
                      onClick={() => {
                        setSelectedTopupNetwork(network);
                        setShowTopupModal(true);
                      }}
                    >
                      Add Funds
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="airtime-card recent-transactions">
            <div className="transactions-header">
              <h2>Recent Airtime Sales</h2>
              <button 
                className="refresh-btn"
                onClick={fetchRecentTransactions}
              >
                <RotateCcw size={16} />
                Refresh
              </button>
            </div>
            <div className="transactions-list">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      <Phone size={16} />
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-main">
                        <span className="transaction-amount">
                          ₦{parseFloat(transaction.amount || 0).toLocaleString()}
                        </span>
                        <span className={`transaction-network ${transaction.network?.toLowerCase()}`}>
                          {transaction.network}
                        </span>
                      </div>
                      <div className="transaction-meta">
                        <span className="transaction-phone">
                          {transaction.customer_phone || "No phone"}
                        </span>
                        <span className="transaction-time">
                          <Clock size={12} />
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="transaction-status">
                      {transaction.status === "completed" ? (
                        <CheckCircle size={16} className="success" />
                      ) : (
                        <XCircle size={16} className="error" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-transactions">
                  <Phone size={48} />
                  <p>No airtime sales yet</p>
                  <small>Start selling to see transactions here</small>
                </div>
              )}
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="airtime-card quick-amounts">
            <h2>Quick Amounts</h2>
            <div className="amounts-grid">
              {quickAmounts.map((amount) => (
                <motion.button
                  key={amount}
                  className="amount-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAirtimeModal(true);
                  }}
                >
                  ₦{amount.toLocaleString()}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Airtime Sale Modal */}
        {showAirtimeModal && (
          <AirtimeModal
            onClose={() => setShowAirtimeModal(false)}
            onSubmit={handleAirtimeSale}
            airtimeInventory={airtimeInventory}
            defaultNetwork={selectedNetwork}
          />
        )}

        {/* Top Up Modal */}
        {showTopupModal && (
          <TopUpModal
            onClose={() => setShowTopupModal(false)}
            onSubmit={handleTopupInventory}
            network={selectedTopupNetwork}
          />
        )}
      </div>
    </div>
  );
}

// Airtime Modal Component
function AirtimeModal({ onClose, onSubmit, airtimeInventory, defaultNetwork = "MTN" }) {
  const [formData, setFormData] = useState({
    amount: "",
    customer_phone: "",
    customer_name: "",
    network: defaultNetwork,
  });
  const [commission, setCommission] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(airtimeInventory[defaultNetwork]);

  useEffect(() => {
    setAvailableBalance(airtimeInventory[formData.network]);
  }, [formData.network, airtimeInventory]);

  const calculateCommission = (amount) => {
    return Math.max(20, Math.round((amount * 1.0) / 100));
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
          const newCommission = calculateCommission(numericValue);
          setCommission(newCommission);
        } else {
          setCommission(0);
        }
      }
    } else if (field === "customer_phone") {
      formattedValue = value.replace(/[^0-9]/g, "").slice(0, 11);
    } else if (field === "customer_name" && value) {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
    } else if (field === "network") {
      formattedValue = value;
      setAvailableBalance(airtimeInventory[value]);
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

    if (rawAmount > availableBalance) {
      toast.error(`Not enough ${formData.network} airtime inventory. Available: ₦${availableBalance.toLocaleString()}`);
      return;
    }

    if (formData.customer_phone && formData.customer_phone.length !== 11) {
      toast.error("Please enter a valid 11-digit phone number");
      return;
    }

    onSubmit({
      amount: rawAmount,
      customer_phone: formData.customer_phone,
      customer_name: formData.customer_name,
      network: formData.network,
      commission: commission,
      charges: 0,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Sell Airtime</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Network</label>
            <select
              value={formData.network}
              onChange={(e) => handleInputChange("network", e.target.value)}
              required
            >
              <option value="MTN">MTN</option>
              <option value="GLO">GLO</option>
              <option value="Airtel">Airtel</option>
              <option value="9Mobile">9Mobile</option>
            </select>
            <div className="inventory-status">
              <span className="inventory-label">Available: </span>
              <span className={`inventory-value ${availableBalance < 5000 ? 'low' : 'normal'}`}>
                ₦{availableBalance.toLocaleString()}
              </span>
              {availableBalance < 5000 && (
                <span className="inventory-warning"> ⚠️ Low</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Amount (₦)</label>
            <input
              type="text"
              placeholder="Enter amount (e.g., 1,000)"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              required
            />
            {formData.amount && (
              <div className="amount-validation">
                {parseFormattedNumber(formData.amount) > availableBalance ? (
                  <span className="validation-error">
                    Exceeds available balance by ₦{(parseFormattedNumber(formData.amount) - availableBalance).toLocaleString()}
                  </span>
                ) : (
                  <span className="validation-success">
                    Within available balance
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="08012345678"
              value={formData.customer_phone}
              onChange={(e) => handleInputChange("customer_phone", e.target.value)}
              maxLength={11}
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

          <div className="transaction-summary">
            <div className="summary-item">
              <span>Amount:</span>
              <span>₦{formData.amount || "0"}</span>
            </div>
            <div className="summary-item commission">
              <span>Commission:</span>
              <span>+₦{commission.toLocaleString()}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="airtime-btn-primary"
              disabled={parseFormattedNumber(formData.amount) > availableBalance}
            >
              Sell Airtime
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Top Up Modal Component
function TopUpModal({ onClose, onSubmit, network }) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const parseFormattedNumber = (formattedNum) => {
    if (!formattedNum) return 0;
    return Number(String(formattedNum).replace(/,/g, ""));
  };

  const handleAmountChange = (value) => {
    const cleanedValue = value.replace(/[^0-9,]/g, "");
    if (cleanedValue) {
      const numericValue = parseFormattedNumber(cleanedValue);
      setAmount(formatNumber(numericValue));
    } else {
      setAmount("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawAmount = parseFormattedNumber(amount) || 0;

    if (rawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    onSubmit({
      network,
      amount: rawAmount,
      reference: reference || `TOPUP-${Date.now()}`
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Top Up {network} Inventory</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount to Add (₦)</label>
            <input
              type="text"
              placeholder="Enter amount (e.g., 10,000)"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Reference (Optional)</label>
            <input
              type="text"
              placeholder="Payment reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="airtime-btn-primary">
              Add Funds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}