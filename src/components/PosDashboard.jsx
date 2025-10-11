import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import "../styles/posdashboard.css";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Loading from "../components/Loading";

// Commission configuration for withdrawals (updated to match transaction page)
const WITHDRAWAL_COMMISSION_CONFIG = {
  tiers: [
    { min: 1000, max: 5000, commission: 100 },
    { min: 6000, max: 10000, commission: 300 },
    { min: 11000, max: 15000, commission: 400 },
    { min: 16000, max: 20000, commission: 500 },
    { min: 21000, max: 25000, commission: 600 },
    { min: 26000, max: 30000, commission: 800 },
    { min: 31000, max: 35000, commission: 800 },
    { min: 36000, max: 40000, commission: 1000 },
    { min: 41000, max: 45000, commission: 1200 },
    { min: 46000, max: 50000, commission: 1500 }
  ],
  aboveTierRate: 0.02
};

// Commission configuration for deposits (updated to match transaction page)
const DEPOSIT_COMMISSION_CONFIG = {
  tiers: [
    { min: 1000, max: 5000, commission: 200 },
    { min: 6000, max: 10000, commission: 200 },
    { min: 11000, max: 15000, commission: 200 },
    { min: 16000, max: 20000, commission: 300 },
    { min: 21000, max: 25000, commission: 300 },
    { min: 26000, max: 30000, commission: 400 },
    { min: 31000, max: 35000, commission: 400 },
    { min: 36000, max: 40000, commission: 500 },
    { min: 41000, max: 45000, commission: 600 },
    { min: 46000, max: 50000, commission: 800 }
  ],
  aboveTierRate: 0.01
};

// IndexedDB setup
const DB_NAME = 'POSDashboardDB';
const DB_VERSION = 1;
const TRANSACTIONS_STORE = 'pendingTransactions';
const INVENTORY_STORE = 'inventory';
const CUSTOMERS_STORE = 'customers';
const SETTINGS_STORE = 'appSettings';

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create transactions store if it doesn't exist
      if (!db.objectStoreNames.contains(TRANSACTIONS_STORE)) {
        const store = db.createObjectStore(TRANSACTIONS_STORE, { 
          keyPath: 'localId', 
          autoIncrement: true 
        });
        store.createIndex('shopId', 'shop_id', { unique: false });
        store.createIndex('createdAt', 'created_at', { unique: false });
      }
      
      // Create inventory store if it doesn't exist
      if (!db.objectStoreNames.contains(INVENTORY_STORE)) {
        const store = db.createObjectStore(INVENTORY_STORE, { keyPath: ['shop_id', 'network'] });
      }
      
      // Create customers store if it doesn't exist
      if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
        const store = db.createObjectStore(CUSTOMERS_STORE, { keyPath: 'id' });
        store.createIndex('shopId', 'shop_id', { unique: false });
      }
      
      // Create settings store if it doesn't exist
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
};

const saveToIndexedDB = async (storeName, data) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error saving to ${storeName}:`, error);
    throw error;
  }
};

const getFromIndexedDB = async (storeName, key) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    if (key) {
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error(`Error reading from ${storeName}:`, error);
    throw error;
  }
};

const deleteFromIndexedDB = async (storeName, key) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    store.delete(key);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error deleting from ${storeName}:`, error);
    throw error;
  }
};

export default function Dashboard() {
  const { shop } = useShopStore();
  const shopId = shop?.id;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState({
    deposits: 0,
    withdrawals: 0,
    totalGain: 0,           // Changed from commission to totalGain
    bankCharges: 0,         // Changed from charges to bankCharges
  });
  const [airtimeInventory, setAirtimeInventory] = useState({
    MTN: 0,
    GLO: 0,
    Airtel: 0,
    "9Mobile": 0,
  });
  const [customers, setCustomers] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState("withdrawal");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending transactions when coming online
  useEffect(() => {
    if (isOnline) {
      syncPendingTransactions();
      syncInventory();
      syncCustomers();
    }
  }, [isOnline]);

  // Calculate commission based on transaction type and amount (updated to match transaction page)
  const calculateCommission = (amount, transactionType) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    if (numericAmount <= 0) return 0;

    // Choose the appropriate config based on transaction type
    const config = transactionType === 'withdrawal' 
      ? WITHDRAWAL_COMMISSION_CONFIG 
      : DEPOSIT_COMMISSION_CONFIG;

    // Find the appropriate tier
    const tier = config.tiers.find(
      t => numericAmount >= t.min && numericAmount <= t.max
    );

    if (tier) {
      return tier.commission;
    }

    // For amounts above the highest tier
    const highestTier = config.tiers[config.tiers.length - 1];
    if (numericAmount > highestTier.max) {
      const amountAboveTier = numericAmount - highestTier.max;
      const additionalCommission = Math.round(amountAboveTier * config.aboveTierRate);
      return highestTier.commission + additionalCommission;
    }

    // For amounts below the lowest tier (less than 1000)
    if (numericAmount < config.tiers[0].min) {
      const baseRate = transactionType === 'withdrawal' ? 0.01 : 0.005;
      return Math.max(10, Math.round(numericAmount * baseRate));
    }

    return 0;
  };

  // Calculate bank charge based on amount (added from transaction page)
  const calculateBankCharge = (amount) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    if (numericAmount <= 0) return 0;
    
    // ₦25 for amounts below 10k, ₦75 for amounts equal to or above 10k
    return numericAmount >= 10000 ? 75 : 25;
  };

  // Fetch transactions function
  const fetchTransactions = useCallback(async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      
      if (isOnline) {
        const { data, error } = await supabase
          .from("postransactions")
          .select("*")
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTransactions(data || []);
        
        // Save to IndexedDB for offline access
        if (data && data.length > 0) {
          await saveToIndexedDB(SETTINGS_STORE, {
            key: 'lastSyncedTransactions',
            value: new Date().toISOString(),
            data: data
          });
        }
      } else {
        // Offline mode: get from IndexedDB
        const pendingTransactions = await getFromIndexedDB(TRANSACTIONS_STORE);
        const savedTransactions = await getFromIndexedDB(SETTINGS_STORE, 'lastSyncedTransactions');
        
        // Combine saved transactions with pending ones
        let allTransactions = [];
        
        if (savedTransactions && savedTransactions.data) {
          allTransactions = [...savedTransactions.data];
        }
        
        if (pendingTransactions && pendingTransactions.length > 0) {
          // Filter to only include transactions for this shop
          const shopPendingTransactions = pendingTransactions.filter(t => t.shop_id === shopId);
          allTransactions = [...shopPendingTransactions, ...allTransactions];
        }
        
        setTransactions(allTransactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [shopId, isOnline]);

  // Calculate summary from transactions (updated to match transaction page)
  const calculateSummary = useCallback((txData) => {
    let deposits = 0;
    let withdrawals = 0;
    let totalGain = 0;
    let bankCharges = 0;

    const today = new Date().toDateString();
    const todayTransactions = txData.filter(
      (t) => new Date(t.created_at).toDateString() === today
    );

    todayTransactions.forEach((t) => {
      const amount = parseFloat(t.amount || 0);
      if (t.type === "deposit") {
        deposits += amount;
      } else if (["withdrawal", "airtime", "bill_payment"].includes(t.type)) {
        withdrawals += amount;
      }
      
      // Use transaction_charge and bank_charge fields from transaction page
      const transactionCharge = parseFloat(t.transaction_charge || t.commission || 0);
      const bankCharge = parseFloat(t.bank_charge || t.charges || 0);
      
      totalGain += transactionCharge;
      bankCharges += bankCharge;
    });

    setSummary({ deposits, withdrawals, totalGain, bankCharges });
  }, []);

  // Fetch airtime inventory
  const fetchAirtimeInventory = useCallback(async () => {
    if (!shopId) return;

    try {
      if (isOnline) {
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
        
        // Save to IndexedDB for offline access
        await saveToIndexedDB(SETTINGS_STORE, {
          key: 'lastSyncedInventory',
          value: new Date().toISOString(),
          data: invObj
        });
      } else {
        // Offline mode: get from IndexedDB
        const inventoryData = await getFromIndexedDB(SETTINGS_STORE, 'lastSyncedInventory');
        
        if (inventoryData && inventoryData.data) {
          setAirtimeInventory(inventoryData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching airtime inventory:", error);
    }
  }, [shopId, isOnline]);

  // Fetch customers with pending balances
  const fetchCustomers = useCallback(async () => {
    if (!shopId) return;

    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from("poscustomers")
          .select("id, name, pending_balance")
          .eq("shop_id", shopId)
          .gt("pending_balance", 0);

        if (error) throw error;
        setCustomers(data || []);
        
        // Save to IndexedDB for offline access
        await saveToIndexedDB(SETTINGS_STORE, {
          key: 'lastSyncedCustomers',
          value: new Date().toISOString(),
          data: data || []
        });
      } else {
        // Offline mode: get from IndexedDB
        const customersData = await getFromIndexedDB(SETTINGS_STORE, 'lastSyncedCustomers');
        
        if (customersData && customersData.data) {
          setCustomers(customersData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, [shopId, isOnline]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchTransactions(),
        fetchAirtimeInventory(),
        fetchCustomers()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [shopId, fetchTransactions, fetchAirtimeInventory, fetchCustomers]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (transactions.length > 0) {
      calculateSummary(transactions);
    } else {
      setSummary({ deposits: 0, withdrawals: 0, totalGain: 0, bankCharges: 0 });
    }
  }, [transactions, calculateSummary]);

  // Set up real-time subscriptions (only when online)
  useEffect(() => {
    if (!shopId || !isOnline) return;

    const transactionsSubscription = supabase
      .channel("dashboard-transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "postransactions",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    const inventorySubscription = supabase
      .channel("dashboard-inventory-changes")
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

    const customersSubscription = supabase
      .channel("dashboard-customers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poscustomers",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      transactionsSubscription.unsubscribe();
      inventorySubscription.unsubscribe();
      customersSubscription.unsubscribe();
    };
  }, [shopId, fetchTransactions, fetchAirtimeInventory, fetchCustomers, isOnline]);

  // Sync pending transactions with the server
  const syncPendingTransactions = async () => {
    if (!isOnline) return;
    
    try {
      setSyncing(true);
      const pendingTransactions = await getFromIndexedDB(TRANSACTIONS_STORE);
      
      if (!pendingTransactions || pendingTransactions.length === 0) {
        return;
      }
      
      // Filter transactions for this shop
      const shopPendingTransactions = pendingTransactions.filter(t => t.shop_id === shopId);
      
      if (shopPendingTransactions.length === 0) {
        return;
      }
      
      // Process each pending transaction
      for (const transaction of shopPendingTransactions) {
        try {
          // Remove localId before sending to server
          const { localId, ...transactionData } = transaction;
          
          const { data, error } = await supabase
            .from('postransactions')
            .insert([transactionData])
            .select();
            
          if (error) throw error;
          
          // Remove from IndexedDB after successful sync
          await deleteFromIndexedDB(TRANSACTIONS_STORE, transaction.localId);
        } catch (error) {
          console.error('Error syncing transaction:', error);
          // Keep transaction in IndexedDB for next sync attempt
        }
      }
      
      toast.success('Pending transactions synced successfully');
      fetchTransactions(); // Refresh transactions list
    } catch (error) {
      console.error('Error syncing pending transactions:', error);
      toast.error('Failed to sync some transactions');
    } finally {
      setSyncing(false);
    }
  };

  // Sync inventory with the server
  const syncInventory = async () => {
    if (!isOnline) return;
    
    try {
      const inventoryUpdates = await getFromIndexedDB(INVENTORY_STORE);
      
      if (inventoryUpdates && inventoryUpdates.length > 0) {
        for (const update of inventoryUpdates) {
          if (update.shop_id === shopId) {
            const { error } = await supabase
              .from('posinventory')
              .upsert({
                shop_id: shopId,
                network: update.network,
                balance: update.balance,
                updated_at: new Date().toISOString()
              });
              
            if (error) throw error;
            
            // Remove from IndexedDB after successful sync
            await deleteFromIndexedDB(INVENTORY_STORE, [shopId, update.network]);
          }
        }
        
        // Refresh inventory data
        fetchAirtimeInventory();
      }
    } catch (error) {
      console.error('Error syncing inventory:', error);
    }
  };

  // Sync customers with the server
  const syncCustomers = async () => {
    if (!isOnline) return;
    
    try {
      const customerUpdates = await getFromIndexedDB(CUSTOMERS_STORE);
      
      if (customerUpdates && customerUpdates.length > 0) {
        for (const update of customerUpdates) {
          if (update.shop_id === shopId) {
            const { error } = await supabase
              .from('poscustomers')
              .upsert({
                ...update,
                updated_at: new Date().toISOString()
              });
              
            if (error) throw error;
            
            // Remove from IndexedDB after successful sync
            await deleteFromIndexedDB(CUSTOMERS_STORE, update.id);
          }
        }
        
        // Refresh customers data
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error syncing customers:', error);
    }
  };

  const handleQuickAction = (type) => {
    setSelectedTransactionType(type);
    setShowTransactionModal(true);
  };

  const handleSubmitTransaction = async (transactionData) => {
    try {
      // Use transaction_charge and bank_charge fields to match transaction page
      const transactionToSave = {
        ...transactionData,
        // Map commission to transaction_charge and charges to bank_charge
        transaction_charge: transactionData.commission,
        bank_charge: transactionData.charges,
        shop_id: shopId,
        status: "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isOnline) {
        const { data, error } = await supabase
          .from("postransactions")
          .insert([transactionToSave])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newTransaction = data[0];
          setTransactions((prev) => [newTransaction, ...prev]);

          // Update airtime inventory if it's an airtime sale
          if (newTransaction.type === "airtime") {
            const transactionAmount = parseFloat(newTransaction.amount || 0);
            const { error: invError } = await supabase
              .from("posinventory")
              .update({ 
                balance: supabase.sql`balance - ${transactionAmount}` 
              })
              .eq("shop_id", shopId)
              .eq("network", newTransaction.network);

            if (invError) throw invError;
            
            // Update local state
            setAirtimeInventory(prev => ({
              ...prev,
              [newTransaction.network]: prev[newTransaction.network] - transactionAmount
            }));
          }
        }
      } else {
        // Offline mode: save to IndexedDB
        await saveToIndexedDB(TRANSACTIONS_STORE, transactionToSave);
        
        // Update local state optimistically
        setTransactions(prev => [transactionToSave, ...prev]);
        
        // Update airtime inventory if it's an airtime sale (offline)
        if (transactionToSave.type === "airtime") {
          const transactionAmount = parseFloat(transactionToSave.amount || 0);
          const network = transactionToSave.network;
          
          // Update local state
          setAirtimeInventory(prev => ({
            ...prev,
            [network]: prev[network] - transactionAmount
          }));
          
          // Save inventory update to IndexedDB for syncing later
          await saveToIndexedDB(INVENTORY_STORE, {
            shop_id: shopId,
            network: network,
            balance: airtimeInventory[network] - transactionAmount,
            updated_at: new Date().toISOString()
          });
        }
      }

      // Update summary for today's transactions
      const today = new Date().toDateString();
      const transactionDate = new Date(
        transactionToSave.created_at
      ).toDateString();

      if (transactionDate === today) {
        setSummary((prev) => {
          let newDeposits = parseFloat(prev.deposits || 0);
          let newWithdrawals = parseFloat(prev.withdrawals || 0);
          let newTotalGain = parseFloat(prev.totalGain || 0);
          let newBankCharges = parseFloat(prev.bankCharges || 0);

          if (transactionToSave.type === "deposit") {
            newDeposits += parseFloat(transactionToSave.amount || 0);
          } else if (["withdrawal", "airtime", "bill_payment"].includes(transactionToSave.type)) {
            newWithdrawals += parseFloat(transactionToSave.amount || 0);
          }

          // Use transaction_charge and bank_charge fields
          const transactionCharge = parseFloat(transactionToSave.transaction_charge || transactionToSave.commission || 0);
          const bankCharge = parseFloat(transactionToSave.bank_charge || transactionToSave.charges || 0);
          
          newTotalGain += transactionCharge;
          newBankCharges += bankCharge;

          return {
            deposits: newDeposits,
            withdrawals: newWithdrawals,
            totalGain: newTotalGain,
            bankCharges: newBankCharges,
          };
        });
      }

      toast.success(isOnline ? "Transaction recorded successfully!" : "Transaction saved offline and will sync when online");
      setShowTransactionModal(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to record transaction");
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="posdashboard-wrapper">
      <div className="posdashboard-page">
        {/* Connection Status */}
        <div className="connection-status-bar">
          {isOnline ? (
            <div className="connection-status online">
              <i className="fas fa-wifi"></i> Online
            </div>
          ) : (
            <div className="connection-status offline">
              <i className="fas fa-wifi-slash"></i> Offline
            </div>
          )}
          {!isOnline && (
            <button 
              className="sync-btn" 
              onClick={() => {
                syncPendingTransactions();
                syncInventory();
                syncCustomers();
              }}
              disabled={syncing}
            >
              <i className={`fas fa-sync ${syncing ? 'spinning' : ''}`}></i>
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
          )}
        </div>

        {/* Grid Layout */}
        <div className="posdashboard-grid">
          {/* Quick Actions */}
          <div className="poscard quick-actions">
            <h2>Quick Actions</h2>
            <div className="posactions">
              <button
                className="posbtn green"
                onClick={() => handleQuickAction("deposit")}
              >
                <i className="fas fa-arrow-down"></i> Deposit
              </button>
              <button
                className="posbtn red"
                onClick={() => handleQuickAction("withdrawal")}
              >
                <i className="fas fa-arrow-up"></i> Withdrawal
              </button>
              <button
                className="posbtn blue"
                onClick={() => handleQuickAction("airtime")}
              >
                <i className="fas fa-mobile"></i> Airtime
              </button>
              <button
                className="posbtn purple"
                onClick={() => handleQuickAction("bill_payment")}
              >
                <i className="fas fa-receipt"></i> Bill Payment
              </button>
            </div>
          </div>

          {/* Daily Transactions Summary */}
          <div className="poscard daily-summary">
            <h2>Today's Transactions</h2>
            <div className="transaction-summary-grid">
              <div className="transaction-metric">
                <div className="metric-icon green">
                  <i className="fas fa-arrow-down"></i>
                </div>
                <div className="metric-details">
                  <div className="metric-label">Total Deposits</div>
                  <div className="metric-value">₦{summary.deposits.toLocaleString()}</div>
                </div>
              </div>
              <div className="transaction-metric">
                <div className="metric-icon red">
                  <i className="fas fa-arrow-up"></i>
                </div>
                <div className="metric-details">
                  <div className="metric-label">Total Withdrawals</div>
                  <div className="metric-value">₦{summary.withdrawals.toLocaleString()}</div>
                </div>
              </div>
              <div className="transaction-metric">
                <div className="metric-icon gold">
                  <i className="fas fa-coins"></i>
                </div>
                <div className="metric-details">
                  <div className="metric-label">Total Gain</div>
                  <div className="metric-value">₦{summary.totalGain.toLocaleString()}</div>
                </div>
              </div>
              <div className="transaction-metric">
                <div className="metric-icon blue">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="metric-details">
                  <div className="metric-label">Bank Charges</div>
                  <div className="metric-value">₦{summary.bankCharges.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Airtime Inventory */}
          <div className="poscard airtime-inventory">
            <h2>Airtime Inventory</h2>
            <div className="inventory-grid">
              {Object.entries(airtimeInventory).map(([network, bal]) => (
                <div key={network} className="inventory-item">
                  <div className="network-name">{network}</div>
                  <div className="inventory-bar">
                    <div 
                      className="inventory-fill"
                      style={{ width: `${Math.min((bal / 50000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="inventory-balance">₦{bal.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="poscard transactions">
            <div className="transactions-header">
              <h2>Recent Transactions</h2>
              <span className="transactions-count">{transactions.length} total</span>
            </div>
            <div className="transactions-list">
              {currentTransactions && currentTransactions.length > 0 ? (
                currentTransactions.map((t) => (
                 <div className="transaction-item" key={t.id || t.localId}>
                   <div className="transaction-type">
                     <span className={`transaction-badge ${t.type}`}>
                       {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                     </span>
                     {!t.id && <span className="offline-indicator">Offline</span>}
                   </div>
                   <div className="transaction-details">
                     <div className="transaction-amount">₦{parseFloat(t.amount || 0).toLocaleString()}</div>
                     <div className="transaction-customer">{t.customer_name || "Walk-in Customer"}</div>
                     <div className="transaction-time">
                       {new Date(t.created_at).toLocaleTimeString()}
                     </div>
                   </div>
                   <div className="transaction-commission">
                     {/* Use transaction_charge field from transaction page */}
                     +₦{parseFloat(t.transaction_charge || t.commission || 0).toLocaleString()}
                   </div>
                 </div>
                ))
              ) : (
                <p className="no-data">No transactions yet</p>
              )}
            </div>
            
            {/* Pagination Controls */}
            {transactions.length > itemsPerPage && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>

          {/* Customer Summary */}
          <div className="poscard customers">
            <h2>Customer Balances</h2>
            <div className="customers-list">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <div key={c.id} className="customer-item">
                    <div className="customer-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="customer-details">
                      <div className="customer-name">{c.name}</div>
                      <div className="customer-balance">
                        ₦{parseFloat(c.pending_balance || 0).toLocaleString()}
                      </div>
                    </div>
                    <span className="pending-badge">Pending</span>
                  </div>
                ))
              ) : (
                <p className="no-data">No pending balances</p>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Modal */}
        {showTransactionModal && (
          <TransactionModal
            type={selectedTransactionType}
            onClose={() => setShowTransactionModal(false)}
            onSubmit={handleSubmitTransaction}
            airtimeInventory={airtimeInventory}
            calculateCommission={calculateCommission}
            calculateBankCharge={calculateBankCharge} // Added from transaction page
            isOnline={isOnline}
          />
        )}
      </div>
    </div>
  );
}

// Transaction Modal Component (updated to match transaction page)
function TransactionModal({ type, onClose, onSubmit, airtimeInventory, calculateCommission, calculateBankCharge, isOnline }) {
  const [formData, setFormData] = useState({
    amount: "",
    customer_phone: "",
    customer_name: "",
    network: "MTN",
    biller: "electricity",
    customer_id: "",
  });
  const [transactionCharge, setTransactionCharge] = useState(0); // Changed from commission
  const [bankCharge, setBankCharge] = useState(0); // Changed from charges

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const parseFormattedNumber = (formattedNum) => {
    if (formattedNum == null || formattedNum === "") return 0;
    return Number(String(formattedNum).replace(/,/g, ""));
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    // Handle amount field formatting
    if (field === "amount") {
      const cleanedValue = value.replace(/[^0-9,]/g, "");

      if (cleanedValue) {
        const numericValue = parseFormattedNumber(cleanedValue);
        formattedValue = formatNumber(numericValue);
      }
    }

    // Handle text fields capitalization
    if ((field === "customer_name" || field === "customer_id") && value) {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    const updatedData = { ...formData, [field]: formattedValue };
    setFormData(updatedData);

    // Recalculate charges and commission when amount changes
    if (field === "amount" && value) {
      const amount = parseFormattedNumber(value) || 0;
      if (amount > 0) {
        let newTransactionCharge = 0;
        let newBankCharge = 0;
        
        if (type === "withdrawal") {
          newTransactionCharge = calculateCommission(amount, "withdrawal");
          newBankCharge = calculateBankCharge(amount); // Use calculateBankCharge from transaction page
        } else if (type === "deposit") {
          newTransactionCharge = calculateCommission(amount, "deposit");
        } else if (type === "airtime") {
          // Flat 1% commission for airtime
          newTransactionCharge = Math.max(20, Math.round(amount * 0.01));
        } else if (type === "bill_payment") {
          // Flat 1.5% commission for bill payments
          newTransactionCharge = Math.max(20, Math.round(amount * 0.015));
        }

        setTransactionCharge(newTransactionCharge);
        setBankCharge(newBankCharge);
      } else {
        setTransactionCharge(0);
        setBankCharge(0);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawAmount = parseFormattedNumber(formData.amount) || 0;

    if (rawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if there's enough airtime inventory for airtime sales
    if (type === "airtime" && rawAmount > airtimeInventory[formData.network]) {
      toast.error(`Not enough ${formData.network} airtime inventory`);
      return;
    }

    onSubmit({
      type,
      amount: rawAmount,
      customer_phone: formData.customer_phone,
      customer_name: formData.customer_name,
      charges: bankCharge, // Map to charges for backward compatibility
      commission: transactionCharge, // Map to commission for backward compatibility
      network: type === "airtime" ? formData.network : null,
      biller: type === "bill_payment" ? formData.biller : null,
      customer_id: type === "bill_payment" ? formData.customer_id : null,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>New {type.replace("_", " ").toUpperCase()} Transaction</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {!isOnline && (
          <div className="offline-notice">
            <i className="fas fa-wifi-slash"></i> You are currently offline. This transaction will be synced when you're back online.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Amount Field */}
          <div className="form-group">
            <label>Amount (₦)</label>
            <input
              type="text"
              placeholder="Enter amount (e.g., 1,000)"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              required
            />
          </div>

          {/* Network Selection (for airtime sales) */}
          {type === "airtime" && (
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
              {airtimeInventory[formData.network] && (
                <small>
                  Available balance: ₦
                  {airtimeInventory[formData.network].toLocaleString()}
                </small>
              )}
            </div>
          )}

          {/* Biller Selection (for bill payments) */}
          {type === "bill_payment" && (
            <>
              <div className="form-group">
                <label>Biller</label>
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
                </select>
              </div>
              <div className="form-group">
                <label>Customer ID</label>
                <input
                  type="text"
                  placeholder="Enter customer ID"
                  value={formData.customer_id || ""}
                  onChange={(e) =>
                    handleInputChange("customer_id", e.target.value)
                  }
                  required
                />
              </div>
            </>
          )}

          {/* Customer Information */}
          <div className="form-group">
            <label>Customer Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="e.g., 08012345678"
              value={formData.customer_phone || ""}
              onChange={(e) =>
                handleInputChange("customer_phone", e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Customer Name (Optional)</label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={formData.customer_name || ""}
              onChange={(e) =>
                handleInputChange("customer_name", e.target.value)
              }
            />
          </div>

          {/* Transaction Summary */}
          <div className="transaction-summary">
            <div className="summary-item">
              <span>Amount:</span>
              <span>₦{formData.amount || "0"}</span>
            </div>
            {bankCharge > 0 && (
              <div className="summary-item">
                <span>Bank Charges:</span>
                <span>₦{bankCharge.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-item commission">
              <span>Your Commission:</span>
              <span>+₦{transactionCharge.toLocaleString()}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="dash-btn-primary"
              disabled={!formData.amount}
            >
              {isOnline ? 'Record Transaction' : 'Save Offline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}