import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShopStore } from '../store/shop-store';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import "../styles/postransactions.css";
import Loading from "../components/Loading";
import {
  Plus,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  PiggyBank,
  Calculator,
  BarChart3,
  Settings,
  Target,
  Zap,
  Clock,
  UserCheck,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import Posnavbar from '../components/Posnavbar.jsx';

// Commission configuration for withdrawals
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
  // For amounts above the highest tier
  aboveTierRate: 0.02 // 2% of amount above highest tier
};

// Commission configuration for deposits (50% lower than withdrawals)
const DEPOSIT_COMMISSION_CONFIG = {
  tiers: [
    { min: 1000, max: 5000, commission: 200 },        // 50% of 100
    { min: 6000, max: 10000, commission: 200 },      // 50% of 300
    { min: 11000, max: 15000, commission: 200 },     // 50% of 400
    { min: 16000, max: 20000, commission: 300 },     // 50% of 500
    { min: 21000, max: 25000, commission: 300 },     // 50% of 600
    { min: 26000, max: 30000, commission: 400 },     // 50% of 800
    { min: 31000, max: 35000, commission: 400 },     // 50% of 800
    { min: 36000, max: 40000, commission: 500 },     // 50% of 1000
    { min: 41000, max: 45000, commission: 600 },     // 50% of 1200
    { min: 46000, max: 50000, commission: 800 }      // 50% of 1500
  ],
  // For amounts above the highest tier (50% of withdrawal rate)
  aboveTierRate: 0.01 // 1% of amount above highest tier (50% of 2%)
};

// IndexedDB setup
const DB_NAME = 'POSDatabase';
const DB_VERSION = 1;
const TRANSACTIONS_STORE = 'pendingTransactions';
const CASH_STORE = 'cashManagement';
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
      
      // Create cash management store if it doesn't exist
      if (!db.objectStoreNames.contains(CASH_STORE)) {
        const store = db.createObjectStore(CASH_STORE, { keyPath: 'shop_id' });
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

export default function PosTransactions() {
  const { shop } = useShopStore();
  const shopId = shop?.id;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const cashEditRef = useRef(null)
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransactionCharges: 0,
    totalBankCharges: 0,
    dailyGain: 0,
    transactionCount: 0,
    averageTransaction: 0,
    peakHour: 'N/A',
    regularCustomers: 0
  });
  
  const [activeTab, setActiveTab] = useState('all');
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'withdrawal',
    amount: '',
    customer_phone: '',
    customer_name: '',
    transaction_charge: 0,
    bank_charge: 0
  });

  // Cash management state
  const [cashManagement, setCashManagement] = useState({
    cashAtHand: 0,
    cashInMachine: 0,
    openingBalance: 0,
    lastUpdatedDate: null,
  });
  const [editingCash, setEditingCash] = useState(false);
  const [tempCashData, setTempCashData] = useState({
    cashAtHand: 0,
    cashInMachine: 0,
  });

  // Daily targets state
  const [dailyTargets, setDailyTargets] = useState({
    transactionCount: 20,
    dailyGainTarget: 5000,
    cashFlow: 100000
  });

  
  // Commission configuration state
  const [withdrawalCommissionConfig] = useState(WITHDRAWAL_COMMISSION_CONFIG);
  const [depositCommissionConfig] = useState(DEPOSIT_COMMISSION_CONFIG);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      syncCashManagement();
    }
  }, [isOnline]);

  // Calculate commission based on transaction type and amount
  const calculateCommission = (amount, transactionType) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    if (numericAmount <= 0) return 0;

    // Choose the appropriate config based on transaction type
    const config = transactionType === 'withdrawal' 
      ? withdrawalCommissionConfig 
      : depositCommissionConfig;

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
      const baseRate = transactionType === 'withdrawal' ? 0.01 : 0.005; // 1% for withdrawal, 0.5% for deposit
      return Math.max(10, Math.round(numericAmount * baseRate));
    }

    return 0;
  };

  // Calculate bank charge based on amount
  const calculateBankCharge = (amount) => {
    const numericAmount = typeof amount === 'string' ? 
      Number(amount.replace(/,/g, '')) : amount;
    
    if (numericAmount <= 0) return 0;
    
    // ₦25 for amounts below 10k, ₦75 for amounts equal to or above 10k
    return numericAmount >= 10000 ? 75 : 25;
  };

  // Check if it's a new day and reset opening balance if needed
  const checkAndResetOpeningBalance = useCallback(async (currentCashData) => {
    if (!shopId) return;

    const today = new Date().toDateString();
    const lastUpdatedDate = currentCashData.lastUpdatedDate 
      ? new Date(currentCashData.lastUpdatedDate).toDateString() 
      : null;

    // If it's a new day, reset opening balance to current cash position
    if (lastUpdatedDate !== today) {
      const newOpeningBalance = parseFloat(currentCashData.cashAtHand || 0) + parseFloat(currentCashData.cashInMachine || 0);
      
      if (isOnline) {
        // Update the database
        const { error } = await supabase
          .from("poscashmanagement")
          .update({
            opening_balance: newOpeningBalance,
            last_updated_date: new Date().toISOString()
          })
          .eq("shop_id", shopId);

        if (error) {
          console.error("Error resetting opening balance:", error);
          return;
        }
      } else {
        // Save to IndexedDB for offline
        const cashData = {
          shop_id: shopId,
          cash_at_hand: currentCashData.cashAtHand,
          cash_in_machine: currentCashData.cashInMachine,
          opening_balance: newOpeningBalance,
          last_updated_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await saveToIndexedDB(CASH_STORE, cashData);
      }

      setCashManagement(prev => ({
        ...prev,
        openingBalance: newOpeningBalance,
        lastUpdatedDate: new Date().toISOString()
      }));
    }
  }, [shopId, isOnline]);

  // Fetch cash management data
  const fetchCashManagement = useCallback(async () => {
    if (!shopId) return;

    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from("poscashmanagement")
          .select("*")
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const cashData = {
            cashAtHand: parseFloat(data[0].cash_at_hand || 0),
            cashInMachine: parseFloat(data[0].cash_in_machine || 0),
            openingBalance: parseFloat(data[0].opening_balance || 0),
            lastUpdatedDate: data[0].last_updated_date || null,
          };

          setCashManagement(cashData);
          setTempCashData({
            cashAtHand: cashData.cashAtHand,
            cashInMachine: cashData.cashInMachine,
          });

          await checkAndResetOpeningBalance(cashData);
        } else {
          // If no row exists, create one with zeros
          const today = new Date().toISOString();
          
          const { data: inserted, error: insertError } = await supabase
            .from("poscashmanagement")
            .upsert(
              {
                shop_id: shopId,
                cash_at_hand: 0,
                cash_in_machine: 0,
                opening_balance: 0,
                last_updated_date: today,
                created_at: today,
                updated_at: today,
              },
              { onConflict: ["shop_id"] }
            )
            .select();
          
          if (insertError) throw insertError;
          
          if (inserted && inserted.length > 0) {
            setCashManagement({
              cashAtHand: 0,
              cashInMachine: 0,
              openingBalance: 0,
              lastUpdatedDate: today,
            });
            setTempCashData({ cashAtHand: 0, cashInMachine: 0 });
          }
        }
      } else {
        // Offline mode: get from IndexedDB
        const cashData = await getFromIndexedDB(CASH_STORE, shopId);
        
        if (cashData) {
          const cashManagementData = {
            cashAtHand: parseFloat(cashData.cash_at_hand || 0),
            cashInMachine: parseFloat(cashData.cash_in_machine || 0),
            openingBalance: parseFloat(cashData.opening_balance || 0),
            lastUpdatedDate: cashData.last_updated_date || null,
          };
          
          setCashManagement(cashManagementData);
          setTempCashData({
            cashAtHand: cashManagementData.cashAtHand,
            cashInMachine: cashManagementData.cashInMachine,
          });
          
          await checkAndResetOpeningBalance(cashManagementData);
        } else {
          // Create default cash management data
          const defaultCashData = {
            cashAtHand: 0,
            cashInMachine: 0,
            openingBalance: 0,
            lastUpdatedDate: new Date().toISOString(),
          };
          
          setCashManagement(defaultCashData);
          setTempCashData({
            cashAtHand: 0,
            cashInMachine: 0,
          });
          
          // Save to IndexedDB
          await saveToIndexedDB(CASH_STORE, {
            shop_id: shopId,
            cash_at_hand: 0,
            cash_in_machine: 0,
            opening_balance: 0,
            last_updated_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error fetching cash management:", error);
    }
  }, [shopId, checkAndResetOpeningBalance, isOnline]);

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!shopId) return;
    
    try {
      setLoading(true);
      
      if (isOnline) {
        const { data, error } = await supabase
          .from('postransactions')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false });

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
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (editingCash && cashEditRef.current) {
    cashEditRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [editingCash]);


  // Calculate stats whenever transactions change
  // Calculate stats whenever transactions change
const calculateStats = () => {
  if (!transactions.length) {
    setStats({
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalTransactionCharges: 0,
      totalBankCharges: 0,
      dailyGain: 0,
      transactionCount: 0,
      averageTransaction: 0,
      peakHour: 'N/A',
      regularCustomers: 0
    });
    return;
  }
  
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => 
    new Date(t.created_at).toDateString() === today
  );

  // Convert all values to numbers before calculations
  const totalDeposits = todayTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalWithdrawals = todayTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalTransactionCharges = todayTransactions
    .reduce((sum, t) => sum + Number(t.transaction_charge || 0), 0);

  const totalBankCharges = todayTransactions
    .reduce((sum, t) => sum + Number(t.bank_charge || 0), 0);

  // Calculate daily gain (transaction charges minus bank charges)
  const dailyGain = totalTransactionCharges - totalBankCharges;

  // Calculate average transaction value
  const averageTransaction = todayTransactions.length > 0 
    ? (totalDeposits + totalWithdrawals) / todayTransactions.length 
    : 0;

  // Find peak hour
  const hourCounts = {};
  todayTransactions.forEach(t => {
    const hour = new Date(t.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  let peakHour = 'N/A';
  let maxCount = 0;
  Object.keys(hourCounts).forEach(hour => {
    if (hourCounts[hour] > maxCount) {
      maxCount = hourCounts[hour];
      peakHour = `${hour}:00 - ${parseInt(hour)+1}:00`;
    }
  });

  // Count regular customers (customers with more than 1 transaction today)
  const customerCounts = {};
  todayTransactions.forEach(t => {
    if (t.customer_phone) {
      customerCounts[t.customer_phone] = (customerCounts[t.customer_phone] || 0) + 1;
    }
  });
  
  const regularCustomers = Object.values(customerCounts).filter(count => count > 1).length;

  setStats({
    totalDeposits,
    totalWithdrawals,
    totalTransactionCharges,
    totalBankCharges,
    dailyGain,
    transactionCount: todayTransactions.length,
    averageTransaction,
    peakHour,
    regularCustomers
  });
};

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
          
          // Update cash balances if transaction was completed
          if (transaction.status === 'completed') {
            await updateCashAfterTransaction(transaction);
          }
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

  // Sync cash management data with the server
  const syncCashManagement = async () => {
    if (!isOnline) return;
    
    try {
      const cashData = await getFromIndexedDB(CASH_STORE, shopId);
      
      if (cashData) {
        const { error } = await supabase
          .from('poscashmanagement')
          .upsert({
            shop_id: shopId,
            cash_at_hand: cashData.cash_at_hand,
            cash_in_machine: cashData.cash_in_machine,
            opening_balance: cashData.opening_balance,
            last_updated_date: cashData.last_updated_date,
            updated_at: new Date().toISOString()
          }, { onConflict: 'shop_id' });
          
        if (error) throw error;
        
        // Refresh cash management data
        fetchCashManagement();
      }
    } catch (error) {
      console.error('Error syncing cash management:', error);
    }
  };

  // Update cash after a transaction
  const updateCashAfterTransaction = async (transaction) => {
    if (!shopId) return;
    
    try {
      const transactionAmount = parseFloat(transaction.amount || 0);
      
      // Calculate new cash balances
      let newCashAtHand = parseFloat(cashManagement.cashAtHand || 0);
      let newCashInMachine = parseFloat(cashManagement.cashInMachine || 0);
      
      if (transaction.type === 'deposit') {
        // Deposits increase cash in machine
        newCashInMachine += transactionAmount;
      } else if (transaction.type === 'withdrawal') {
        // Withdrawals reduce cash at hand
        newCashAtHand -= transactionAmount;
      }

      if (isOnline) {
        // Update the cash management record in the database
        const { error: cashError } = await supabase
          .from("poscashmanagement")
          .update({
            cash_at_hand: newCashAtHand,
            cash_in_machine: newCashInMachine,
            updated_at: new Date().toISOString(),
          })
          .eq("shop_id", shopId);

        if (cashError) throw cashError;
      } else {
        // Save to IndexedDB for offline
        const cashData = {
          shop_id: shopId,
          cash_at_hand: newCashAtHand,
          cash_in_machine: newCashInMachine,
          opening_balance: cashManagement.openingBalance,
          last_updated_date: cashManagement.lastUpdatedDate,
          updated_at: new Date().toISOString()
        };
        
        await saveToIndexedDB(CASH_STORE, cashData);
      }

      // Update local state
      setCashManagement((prev) => ({
        ...prev,
        cashAtHand: newCashAtHand,
        cashInMachine: newCashInMachine,
      }));
    } catch (error) {
      console.error('Error updating cash after transaction:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCashManagement();
  }, [shopId, isOnline]);

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  // Set up real-time subscription (only when online)
  useEffect(() => {
    if (!shopId || !isOnline) return;

    const transactionsSubscription = supabase
      .channel('transactions-changes')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'postransactions',
          filter: `shop_id=eq.${shopId}`
        }, 
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    const cashSubscription = supabase
      .channel('cash-changes')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'poscashmanagement',
          filter: `shop_id=eq.${shopId}`
        }, 
        () => {
          fetchCashManagement();
        }
      )
      .subscribe();

    return () => {
      transactionsSubscription.unsubscribe();
      cashSubscription.unsubscribe();
    };
  }, [shopId, isOnline]);

  // Format number with thousand separators
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  // Parse formatted number back to raw number
  const parseFormattedNumber = (formattedNum) => {
    return Number(formattedNum.replace(/,/g, ''));
  };

  const handleAmountChange = (formattedValue) => {
    const rawValue = formattedValue ? parseFormattedNumber(formattedValue) : 0;
    
    const updatedTransaction = { 
      ...newTransaction, 
      amount: formattedValue
    };
    
    if (rawValue > 0) {
      const transactionCharge = calculateCommission(rawValue, newTransaction.type);
      const bankCharge = calculateBankCharge(rawValue);
      
      updatedTransaction.transaction_charge = transactionCharge;
      updatedTransaction.bank_charge = bankCharge;
    } else {
      updatedTransaction.transaction_charge = 0;
      updatedTransaction.bank_charge = 0;
    }
    
    setNewTransaction(updatedTransaction);
  };

  const handleInputChange = (field, value) => {
    if (field === 'amount') {
      const cleanedValue = value.replace(/[^0-9,]/g, '');
      let formattedValue = cleanedValue;
      
      if (cleanedValue) {
        const numericValue = parseFormattedNumber(cleanedValue);
        formattedValue = formatNumber(numericValue);
      }
      
      handleAmountChange(formattedValue);
    } else if (field === 'customer_name' && value) {
      // Capitalize first letter of each word for customer name
      const capitalizedValue = value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      setNewTransaction(prev => ({ ...prev, [field]: capitalizedValue }));
    } else if (field === 'type') {
      // When transaction type changes, recalculate charges
      const updatedTransaction = { ...newTransaction, [field]: value };
      
      const rawAmount = newTransaction.amount ? parseFormattedNumber(newTransaction.amount) : 0;
      if (rawAmount > 0) {
        const transactionCharge = calculateCommission(rawAmount, value);
        const bankCharge = calculateBankCharge(rawAmount);
        
        updatedTransaction.transaction_charge = transactionCharge;
        updatedTransaction.bank_charge = bankCharge;
      }
      
      setNewTransaction(updatedTransaction);
    } else {
      setNewTransaction(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCashInputChange = (field, value) => {
    // Allow only numbers and commas
    const cleanedValue = value.replace(/[^0-9,]/g, "");

    // Format with thousand separators
    let formattedValue = cleanedValue;
    if (cleanedValue) {
      const numericValue = Number(cleanedValue.replace(/,/g, ""));
      formattedValue = new Intl.NumberFormat("en-NG").format(numericValue);
    }

    setTempCashData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleCashUpdate = async (cashData) => {
    try {
      // Calculate opening balance based on cash at hand + cash in machine
      const openingBalance = parseFloat(cashData.cash_at_hand || 0) + parseFloat(cashData.cash_in_machine || 0);
      const today = new Date().toISOString();

      if (isOnline) {
        const { data, error } = await supabase
          .from("poscashmanagement")
          .upsert([
            {
              ...cashData,
              opening_balance: openingBalance,
              last_updated_date: today,
              shop_id: shopId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) {toast.error(error.message); return;}

        if (data && data.length > 0) {
          setCashManagement({
            cashAtHand: parseFloat(data[0].cash_at_hand || 0),
            cashInMachine: parseFloat(data[0].cash_in_machine || 0),
            openingBalance: parseFloat(data[0].opening_balance || 0),
            lastUpdatedDate: data[0].last_updated_date,
          });
          
          setTempCashData({
            cashAtHand: parseFloat(data[0].cash_at_hand || 0),
            cashInMachine: parseFloat(data[0].cash_in_machine || 0),
          });
        }
      } else {
        // Offline mode: save to IndexedDB
        const cashUpdate = {
          shop_id: shopId,
          cash_at_hand: cashData.cash_at_hand,
          cash_in_machine: cashData.cash_in_machine,
          opening_balance: openingBalance,
          last_updated_date: today,
          updated_at: new Date().toISOString()
        };
        
        await saveToIndexedDB(CASH_STORE, cashUpdate);
        
        setCashManagement({
          cashAtHand: cashData.cash_at_hand,
          cashInMachine: cashData.cash_in_machine,
          openingBalance: openingBalance,
          lastUpdatedDate: today,
        });
        
        setTempCashData({
          cashAtHand: cashData.cash_at_hand,
          cashInMachine: cashData.cash_in_machine,
        });
      }

      setEditingCash(false);
      toast.success("Cash balances updated successfully!");
    } catch (error) {
      console.error("Error updating cash balances:", error);
      toast.error("Failed to update cash balances");
    }
  };

  const handleSaveCash = () => {
    const cashAtHand = Number(String(tempCashData.cashAtHand || "0").replace(/,/g, ""));
    const cashInMachine = Number(String(tempCashData.cashInMachine || "0").replace(/,/g, ""));

    handleCashUpdate({
      cash_at_hand: cashAtHand,
      cash_in_machine: cashInMachine,
    });
  };

  const handleCancelEdit = () => {
    setTempCashData({
      cashAtHand: cashManagement.cashAtHand,
      cashInMachine: cashManagement.cashInMachine,
    });
    setEditingCash(false);
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    
    try {
      const rawAmount = newTransaction.amount ? parseFormattedNumber(newTransaction.amount) : 0;
      
      if (rawAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      const transactionData = {
        ...newTransaction,
        amount: rawAmount,
        shop_id: shopId,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isOnline) {
        const { data, error } = await supabase
          .from('postransactions')
          .insert([transactionData])
          .select();

        if (error) throw error;

        // Update cash balances based on transaction type
        if (data && data.length > 0) {
          await updateCashAfterTransaction(data[0]);
          
          // Update transactions list
          setTransactions(prev => [data[0], ...prev]);
        }
      } else {
        // Offline mode: save to IndexedDB
        await saveToIndexedDB(TRANSACTIONS_STORE, transactionData);
        
        // Update local state optimistically
        setTransactions(prev => [transactionData, ...prev]);
        
        // Update cash balances
        await updateCashAfterTransaction(transactionData);
      }

      toast.success(isOnline ? 'Transaction recorded successfully!' : 'Transaction saved offline and will sync when online');
      setShowNewTransaction(false);
      setNewTransaction({
        type: 'withdrawal',
        amount: '',
        customer_phone: '',
        customer_name: '',
        transaction_charge: 0,
        bank_charge: 0
      });
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to record transaction');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    return transaction.type === activeTab;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Quick amount buttons
  const quickAmounts = [1000, 2000, 5000, 10000, 20000];

  // Calculate performance percentages
  const transactionPerformance = Math.min(100, (stats.transactionCount / dailyTargets.transactionCount) * 100);
  const dailyGainPerformance = Math.min(100, (stats.dailyGain / dailyTargets.dailyGainTarget) * 100);
  const cashFlowPerformance = Math.min(100, ((stats.totalDeposits + stats.totalWithdrawals) / dailyTargets.cashFlow) * 100);

  if (loading) return <Loading />;

  return (
    <div className="pos-transactions-container">
      {/* Header */}
      <div className="transactions-header">
        <div className="header-left">
          <h2>POS Transactions</h2>
          <div className="commission-info">
            <Settings size={14} />
            <span>Tiered Charges + Bank Fees</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="connection-status">
            {isOnline ? (
              <><Wifi size={16} /> Online</>
            ) : (
              <><WifiOff size={16} /> Offline</>
            )}
          </div>
          {!isOnline && (
            <button className="btn-warning" onClick={syncPendingTransactions} disabled={syncing}>
              <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
              {syncing ? 'Syncing...' : 'Sync Pending'}
            </button>
          )}
          <button className="btn-secondary" onClick={fetchTransactions}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button 
            className="tran-btn-primary"
            onClick={() => setShowNewTransaction(true)}
          >
            <Plus size={16} />
            New Transaction
          </button>
        </div>
      </div>

      {/* Cash Position Summary */}
      <div className="cash-position-section">
        <div className="section-header">
          <h2><span>₦</span> Available Cash</h2>
          <button 
            className="btn-secondary"
            onClick={() => setEditingCash(true)}
          >
            <Calculator size={16} />
            Update Cash
          </button>
        </div>
        
        <div className="cash-summary-grid">
          <div className="cash-metric">
            <div className="metric-icon">
              <Wallet size={20} />
            </div>
            <div className="metric-details">
              <div className="metric-label">Cash at Hand</div>
              <div className="metric-value">{formatCurrency(cashManagement.cashAtHand)}</div>
              {cashManagement.cashAtHand < 10000 && (
                <div className="metric-alert">
                  <AlertCircle size={12} />
                  <span>Low cash</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="cash-metric">
            <div className="metric-icon">
              <PiggyBank size={20} />
            </div>
            <div className="metric-details">
              <div className="metric-label">Cash in Machine</div>
              <div className="metric-value">{formatCurrency(cashManagement.cashInMachine)}</div>
            </div>
          </div>
          
          <div className="cash-metric highlight">
            <div className="metric-icon">
              <BarChart3 size={20} />
            </div>
            <div className="metric-details">
              <div className="metric-label">Total Available</div>
              <div className="metric-value">{formatCurrency(cashManagement.cashAtHand + cashManagement.cashInMachine)}</div>
              <div className="metric-note">(Cash at Hand + Cash in Machine)</div>
            </div>
          </div>
          
          <div className="cash-metric highlight">
            <div className="metric-icon">
              <Target size={20} />
            </div>
            <div className="metric-details">
              <div className="metric-label">Daily Gain</div>
              <div className="metric-value">{formatCurrency(stats.dailyGain)}</div>
              <div className="metric-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${dailyGainPerformance}%`}}
                  ></div>
                </div>
                <span>{Math.round(dailyGainPerformance)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Edit Cash Section */}
        {editingCash && (
          <div className="cash-edit-section" ref={cashEditRef}>
            <h3>Update Cash Balances</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Cash at Hand (₦)</label>
                <input
                  type="text"
                  value={tempCashData.cashAtHand}
                  onChange={(e) => handleCashInputChange("cashAtHand", e.target.value)}
                  className="cash-input"
                  placeholder="Enter amount"
                />
              </div>
              <div className="form-group">
                <label>Cash in Machine (₦)</label>
                <input
                  type="text"
                  value={tempCashData.cashInMachine}
                  onChange={(e) => handleCashInputChange("cashInMachine", e.target.value)}
                  className="cash-input"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="cash-actions">
              <button className="tran-btn-primary" onClick={handleSaveCash}>
                Save Changes
              </button>
              <button className="btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="performance-section">
        <h3>Today's Performance</h3>
        <div className="performance-grid">
          <div className="performance-card">
            <div className="performance-icon">
              <Zap size={18} />
            </div>
            <div className="performance-info">
              <h4>Transactions</h4>
              <div className="performance-value">
                {stats.transactionCount} / {dailyTargets.transactionCount}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${transactionPerformance}%`}}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="performance-card">
            <div className="performance-icon">
               <DollarSign size={18} />
            </div>
            <div className="performance-info">
              <h4>Cash Flow</h4>
              <div className="performance-value">
                {formatCurrency(stats.totalDeposits + stats.totalWithdrawals)} / {formatCurrency(dailyTargets.cashFlow)}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${cashFlowPerformance}%`}}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="performance-card">
            <div className="performance-icon">
              <Clock size={18} />
            </div>
            <div className="performance-info">
              <h4>Peak Hour</h4>
              <div className="performance-value">{stats.peakHour}</div>
              <div className="performance-note">Busiest time today</div>
            </div>
          </div>
          
          <div className="performance-card">
            <div className="performance-icon">
              <UserCheck size={18} />
            </div>
            <div className="performance-info">
              <h4>Regular Customers</h4>
              <div className="performance-value">{stats.regularCustomers}</div>
              <div className="performance-note">Returning customers today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <h3>{stats.transactionCount}</h3>
            <p>Today's Transactions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon withdrawal">
            <ArrowUpRight size={20} />
          </div>
          <div className="stat-info1">
            <h3>{formatCurrency(stats.totalWithdrawals)}</h3>
            <p>Total Withdrawals</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon deposit">
            <ArrowDownLeft size={20} />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalDeposits)}</h3>
            <p>Total Deposits</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon daily-gain">
            <Wallet size={20} />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.dailyGain)}</h3>
            <p>Daily Gain</p>
            <small>(Charges - Bank Fees)</small>
          </div>
        </div>
      </div>

      {/* Detailed Earnings Card */}
      <div className="earnings-breakdown">
        <h3>Earnings Breakdown</h3>
        <div className="earnings-grid">
          <div className="earnings-item">
            <div className="earnings-label">Transaction Charges</div>
            <div className="earnings-value">{formatCurrency(stats.totalTransactionCharges)}</div>
          </div>
          <div className="earnings-item">
            <div className="earnings-label">Bank Charges</div>
            <div className="earnings-value">-{formatCurrency(stats.totalBankCharges)}</div>
          </div>
          <div className="earnings-item total">
            <div className="earnings-label">Daily Gain</div>
            <div className="earnings-value">{formatCurrency(stats.dailyGain)}</div>
          </div>
        </div>
      </div>

      {/* Transaction Tabs */}
      <div className="transaction-tabs">
        <button 
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
        >
          All Transactions
        </button>
        <button 
          className={activeTab === 'withdrawal' ? 'active' : ''}
          onClick={() => { setActiveTab('withdrawal'); setCurrentPage(1); }}
        >
          Withdrawals
        </button>
        <button 
          className={activeTab === 'deposit' ? 'active' : ''}
          onClick={() => { setActiveTab('deposit'); setCurrentPage(1); }}
        >
          Deposits
        </button>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        <div className="list-header">
          <h3>Recent Transactions ({filteredTransactions.length} total)</h3>
          <div className="search-box">
            <Search size={20} />
            <input type="text" placeholder="Search transactions..." />
          </div>
        </div>

        <div className="transaction-table">
          {currentTransactions.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={40} />
              <p>No transactions found</p>
              <button 
                className="tran-btn-primary"
                onClick={() => setShowNewTransaction(true)}
              >
                Record Your First Transaction
              </button>
            </div>
          ) : (
            currentTransactions.map(transaction => (
              <div key={transaction.id || transaction.localId} className="transaction-item">
                <div className="transaction-icon">
                  {transaction.type === 'withdrawal' ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownLeft size={16} />
                  )}
                </div>
                
                <div className="transaction-details">
                  <div className="customer-info">
                    <h4>{transaction.customer_name || 'Customer'}</h4>
                    <p>{transaction.customer_phone || 'No phone number'}</p>
                  </div>
                  
                  <div className="transaction-meta">
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type}
                    </span>
                    <span className="transaction-time">
                      {formatDate(transaction.created_at)}
                    </span>
                    {!transaction.id && (
                      <span className="offline-badge">Offline</span>
                    )}
                  </div>
                </div>
                
                <div className="transaction-amount">
                  <div className="amount">{formatCurrency(transaction.amount)}</div>
                  <div className="transaction-charge">+{formatCurrency(transaction.transaction_charge)}</div>
                  <div className="bank-charge">-{formatCurrency(transaction.bank_charge)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
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
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showNewTransaction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>New Transaction</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewTransaction(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitTransaction}>
              <div className="form-group">
                <label>Transaction Type</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={newTransaction.type === 'withdrawal' ? 'active' : ''}
                    onClick={() => handleInputChange('type', 'withdrawal')}
                  >
                    <ArrowUpRight size={16} />
                    Withdrawal
                  </button>
                  <button
                    type="button"
                    className={newTransaction.type === 'deposit' ? 'active' : ''}
                    onClick={() => handleInputChange('type', 'deposit')}
                  >
                    <ArrowDownLeft size={16} />
                    Deposit
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Amount (₦)</label>
                <input
                  type="text"
                  placeholder="Enter amount (e.g., 1,000)"
                  value={newTransaction.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
                <div className="quick-amounts">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      className="quick-amount-btn"
                      onClick={() => handleInputChange('amount', formatNumber(amount))}
                    >
                      {formatNumber(amount)}
                    </button>
                  ))}
                </div>
                <div className="charges-preview">
                  {newTransaction.amount && (
                    <>
                      <span>Transaction Charge: {formatCurrency(newTransaction.transaction_charge)}</span>
                      <span>Bank Charge: {formatCurrency(newTransaction.bank_charge)}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Customer Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g., 08012345678"
                  value={newTransaction.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={newTransaction.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                />
              </div>
              
              <div className="transaction-summary">
                <div className="summary-item">
                  <span>Amount:</span>
                  <span>{newTransaction.amount ? `₦${newTransaction.amount}` : '₦0'}</span>
                </div>
                <div className="summary-item transaction-charge">
                  <span>Transaction Charge:</span>
                  <span>+{formatCurrency(newTransaction.transaction_charge)}</span>
                </div>
                <div className="summary-item bank-charge">
                  <span>Bank Charge:</span>
                  <span>-{formatCurrency(newTransaction.bank_charge)}</span>
                </div>
                <div className="summary-item net-gain">
                  <span>Net Gain:</span>
                  <span>{formatCurrency(newTransaction.transaction_charge - newTransaction.bank_charge)}</span>
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewTransaction(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tran-btn-primary"
                  disabled={!newTransaction.amount}
                >
                  {isOnline ? 'Record Transaction' : 'Save Offline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}