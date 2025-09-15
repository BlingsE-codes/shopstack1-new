import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";
import dayjs from "dayjs";
import "../styles/sales.css";
import BarcodeScanner from "../components/BarcodeScanner";
import { offlineDB } from "../services/offlineDB";
import { NetworkStatus } from "../utils/networkStatus";

export default function Sales() {
  const { shop } = useShopStore();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [form, setForm] = useState({ product_id: "", quantity: 1 });
  const [loading, setLoading] = useState(false);
  const [totalDailySales, setTotalDailySales] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [quantityInput, setQuantityInput] = useState("1");
  const [page, setPage] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isReceiptOffline, setIsReceiptOffline] = useState(false);
  const [autoPrint, setAutoPrint] = useState(() => {
    const saved = localStorage.getItem('autoPrintReceipt');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Create ref for cart section
  const cartSectionRef = useRef(null);

  const pageSize = 10;

  useEffect(() => {
    setIsOnline(NetworkStatus.isOnline());
    
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingSales();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Sales will be saved locally and synced when connection is restored.");
    };
    
    NetworkStatus.addOnlineListener(handleOnline);
    NetworkStatus.addOfflineListener(handleOffline);
    
    offlineDB.init().then(() => {
      checkPendingSales();
    });
    
    // Close search dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      NetworkStatus.removeOnlineListener(handleOnline);
      NetworkStatus.removeOfflineListener(handleOffline);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (shop.id) {
      fetchProducts();
      fetchSales();
      fetchTransactions();
      fetchDailySales();
    }
  }, [shop.id]);

  useEffect(() => {
    const numericValue = parseInt(quantityInput.replace(/,/g, ""));
    if (!isNaN(numericValue)) {
      setForm((f) => ({ ...f, quantity: numericValue }));
    }
  }, [quantityInput]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.name.toLowerCase().replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
        calculateSimilarity(product.name.toLowerCase(), query) > 0.6
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Auto-scroll to cart when items are added
  useEffect(() => {
    if (cart.length > 0 && cartSectionRef.current) {
      setTimeout(() => {
        cartSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }, 100);
    }
  }, [cart]);

  // Calculate similarity between two strings (0 to 1)
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Check for exact match
    if (longer === shorter) return 1.0;
    
    // Check for contains
    if (longer.includes(shorter)) return 0.8;
    
    // Simple Levenshtein distance-based similarity
    const distance = levenshteinDistance(longer, shorter);
    return 1 - (distance / longer.length);
  };

  // Levenshtein distance implementation
  const levenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    return track[str2.length][str1.length];
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  const handleProductSelect = (product) => {
    setForm({ ...form, product_id: product.id });
    setSearchQuery(product.name);
    setShowSearchResults(false);
  };

  const handleAutoPrintChange = (e) => {
    const isChecked = e.target.checked;
    setAutoPrint(isChecked);
    localStorage.setItem('autoPrintReceipt', JSON.stringify(isChecked));
  };

  const checkPendingSales = async () => {
    try {
      const pendingTransactions = await offlineDB.getPendingTransactions();
      setPendingSyncCount(pendingTransactions.length);
      
      if (isOnline && pendingTransactions.length > 0) {
        syncPendingSales();
      }
    } catch (error) {
      console.error("Error checking pending sales:", error);
    }
  };

  const syncPendingSales = async () => {
    try {
      const pendingTransactions = await offlineDB.getPendingTransactions();
      
      for (const transaction of pendingTransactions) {
        try {
          const { data: transactionData, error: transactionError } = await supabase
            .from("transactions")
            .insert([{ 
              shop_id: transaction.shop_id, 
              total_amount: transaction.total_amount 
            }])
            .select()
            .single();

          if (transactionError) throw transactionError;

          const transactionItems = await offlineDB.getPendingTransactionItems(transaction.id);
          
          const { error: itemsError } = await supabase
            .from("transaction_items")
            .insert(
              transactionItems.map(item => ({
                transaction_id: transactionData.id,
                product_id: item.product_id,
                name: item.name,
                form: item.form,
                quantity: item.quantity,
                price: item.price,
                amount: item.amount,
              }))
            );

          if (itemsError) throw itemsError;

          const { error: salesError } = await supabase.from("sales").insert(
            transactionItems.map(item => ({
              shop_id: transaction.shop_id,
              product_id: item.product_id,
              name: item.name,
              form: item.form,
              quantity: item.quantity,
              amount: item.amount,
            }))
          );

          if (salesError) throw salesError;

          for (const item of transactionItems) {
            const product = products.find((p) => p.id === item.product_id);
            if (product) {
              const newQty = product.quantity - item.quantity;
              await supabase
                .from("products")
                .update({ quantity: newQty })
                .eq("id", product.id);
            }
          }

          await offlineDB.removePendingTransaction(transaction.id);
          await offlineDB.removePendingTransactionItems(transaction.id);
          
        } catch (error) {
          console.error("Error syncing transaction:", error);
        }
      }
      
      fetchProducts();
      fetchTransactions();
      fetchSales();
      fetchDailySales();
      
      const updatedPending = await offlineDB.getPendingTransactions();
      setPendingSyncCount(updatedPending.length);
      
      if (updatedPending.length === 0) {
        toast.success("All pending sales have been synced!");
      }
    } catch (error) {
      console.error("Error syncing pending sales:", error);
    }
  };

  const formatWithCommas = (value) => {
    if (!value) return "";
    const onlyNums = value.replace(/\D/g, "");
    return onlyNums.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleQuantityInputChange = (e) => {
    const rawValue = e.target.value;
    if (/^[\d,]*$/.test(rawValue)) {
      setQuantityInput(formatWithCommas(rawValue));
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, selling_price, quantity, form")
        .eq("shop_id", shop.id);
      
      if (error) {
        console.error("Failed to load products:", error);
        return;
      }
      
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error("Error in fetchProducts:", error);
    }
  };

  const fetchSales = async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("sales")
      .select("*", { count: "exact" })
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to load sales", error);
      return;
    }
    
    setSales(data || []);
    if (count !== null) setTotalSales(count);
  };

  useEffect(() => {
    if (shop.id) {
      fetchSales();
    }
  }, [page, shop.id]);

  const fetchDailySales = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("sales")
      .select("amount")
      .eq("shop_id", shop.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (error) {
      console.error("Failed to fetch daily sales");
      return;
    }
    
    const total = data.reduce((sum, sale) => sum + sale.amount, 0);
    setTotalDailySales(total);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, total_amount, created_at, transaction_items(name, quantity, price, amount, form)"
      )
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });
    
    if (!error) setTransactions(data || []);
  };

  const handleAddToCart = () => {
    const product = products.find((p) => p.id === form.product_id);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    const existingQtyInCart = cart
      .filter((item) => item.product_id === form.product_id)
      .reduce((sum, item) => sum + item.quantity, 0);
    const totalRequestedQty = existingQtyInCart + form.quantity;

    if (product.quantity < totalRequestedQty) {
      toast.error(
       `Insufficient stock. You can't add that number of ${product.name} in cart, only ${product.quantity} ${product.form} left in stock.`
      );
      return;
    }

    const amount = form.quantity * product.selling_price;

    setCart((prev) => [
      ...prev,
      {
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        form: product.form,
        quantity: form.quantity,
        price: product.selling_price,
        priceInput: product.selling_price.toLocaleString(),
        amount,
      },
    ]);

    setForm({ product_id: "", quantity: 1 });
    setSearchQuery("");
    setQuantityInput("1");
  };

  const handlePriceChange = (id, rawValue) => {
    const onlyNums = rawValue.replace(/\D/g, "");
    if (onlyNums === "") return;

    const formatted = onlyNums.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              price: Number(onlyNums),
              priceInput: formatted,
              amount: item.quantity * Number(onlyNums),
            }
          : item
      )
    );
  };

  const handleDeleteCartItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setLoading(true);

    const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);

    if (isOnline) {
      try {
        const { data: transactionData, error: transactionError } = await supabase
          .from("transactions")
          .insert([{ shop_id: shop.id, total_amount: totalAmount }])
          .select()
          .single();

        if (transactionError) {
          toast.error("Failed to create transaction");
          setLoading(false);
          return;
        }

        const { error: itemsError } = await supabase
          .from("transaction_items")
          .insert(
            cart.map((item) => ({
              transaction_id: transactionData.id,
              product_id: item.product_id,
              name: item.name,
              form: item.form,
              quantity: item.quantity,
              price: item.price,
              amount: item.amount,
            }))
          );

        if (itemsError) {
          toast.error("Failed to save transaction items");
          setLoading(false);
          return;
        }

        const { error: salesError } = await supabase.from("sales").insert(
          cart.map((item) => ({
            shop_id: shop.id,
            product_id: item.product_id,
            name: item.name,
            form: item.form,
            quantity: item.quantity,
            amount: item.amount,
          }))
        );

        if (salesError) {
          toast.error("Failed to save sales records");
        }

        // Update product quantities
        for (const item of cart) {
          const product = products.find((p) => p.id === item.product_id);
          if (product) {
            const newQty = product.quantity - item.quantity;
            await supabase
              .from("products")
              .update({ quantity: newQty })
              .eq("id", product.id);
          }
        }

        // Show receipt before clearing cart and refreshing data
        showReceiptPopup(cart, false);
        
        // Clear cart
        setCart([]);
        
        // Refresh data but don't show error toasts
        fetchProducts().catch(console.error);
        fetchTransactions().catch(console.error);
        fetchSales().catch(console.error);
        fetchDailySales().catch(console.error);
        
        toast.success("Transaction completed successfully!");
      } catch (error) {
        toast.error("Error processing transaction");
        console.error(error);
      }
    } else {
      try {
        // Save transaction to offline storage
        const transactionId = await offlineDB.addPendingTransaction({
          shop_id: shop.id,
          total_amount: totalAmount,
        });

        // Save transaction items to offline storage
        await offlineDB.addPendingTransactionItems(
          cart.map(item => ({
            transaction_id: transactionId,
            product_id: item.product_id,
            name: item.name,
            form: item.form,
            quantity: item.quantity,
            price: item.price,
            amount: item.amount,
          }))
        );

        // Save sales to offline storage
        for (const item of cart) {
          await offlineDB.addPendingSale({
            shop_id: shop.id,
            product_id: item.product_id,
            name: item.name,
            form: item.form,
            quantity: item.quantity,
            amount: item.amount,
          });
        }

        // Show receipt
        showReceiptPopup(cart, true);
        
        // Clear cart
        setCart([]);
        
        setPendingSyncCount(prev => prev + 1);
        toast.success("Transaction saved offline! Will sync when connection is restored.");
      } catch (error) {
        toast.error("Error saving offline transaction");
        console.error(error);
      }
    }

    setLoading(false);
  };

  const handleBarcodeDetected = async (barcode) => {
    setScannerOpen(false);
    
    if (!isOnline) {
      toast.error("Cannot scan barcode while offline");
      return;
    }
    
    const { data, error } = await supabase
      .from("products")
      .select("id, name, selling_price, quantity, form")
      .eq("shop_id", shop.id)
      .eq("barcode", barcode)
      .single();
      
    if (error || !data) {
      toast.error("Product not found for scanned barcode");
      return;
    }
    
    setForm({ product_id: data.id, quantity: 1 });
    setSearchQuery(data.name);
    toast.success(`Scanned product: ${data.name}`);
  };

  const showReceiptPopup = (cartItems, offline = false) => {
    const receiptData = {
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + item.amount, 0),
      date: new Date(),
      receiptNumber: Date.now().toString().slice(-6),
      offline
    };
    
    setCurrentReceipt(receiptData);
    setIsReceiptOffline(offline);
    setShowReceipt(true);
    
    // Auto print if enabled
    if (autoPrint) {
      setTimeout(() => {
        printReceipt();
      }, 500);
    }
  };

  const viewTransactionReceipt = (transaction) => {
    const receiptData = {
      items: transaction.transaction_items,
      total: transaction.total_amount,
      date: transaction.created_at,
      receiptNumber: transaction.id.slice(-6),
      offline: false
    };
    
    setCurrentReceipt(receiptData);
    setIsReceiptOffline(false);
    setShowReceipt(true);
  };

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 80mm; 
                margin: 0 auto; 
                padding: 15px;
                font-size: 14px;
              }
              .receipt-header { 
                text-align: center; 
                border-bottom: 1px dashed #000; 
                margin-bottom: 15px; 
                padding-bottom: 10px;
              }
              .receipt-info { 
                font-size: 12px; 
                margin-bottom: 15px; 
                display: flex; 
                justify-content: space-between; 
              }
              table { 
                width: 100%; 
                font-size: 12px; 
                border-collapse: collapse; 
                margin-bottom: 15px; 
              }
              th, td { 
                padding: 4px 0; 
                text-align: left;
              }
              th { 
                border-bottom: 1px solid #000; 
              }
              .item-name { 
                text-align: left; 
              }
              .receipt-total { 
                border-top: 1px dashed #000; 
                padding-top: 10px; 
                margin-top: 10px; 
              }
              .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 5px; 
              }
              .grand-total { 
                font-weight: bold; 
                font-size: 16px;
              }
              .receipt-footer { 
                text-align: center; 
                font-size: 11px; 
                margin-top: 15px; 
                padding-top: 10px; 
                border-top: 1px dashed #ddd; 
              }
              .offline-notice { 
                color: #e74c3c; 
                font-weight: bold; 
                text-align: center; 
                margin: 10px 0; 
                padding: 5px; 
                background: #ffeaea; 
                border-radius: 3px; 
              }
              @media print {
                body { 
                  width: 80mm; 
                  margin: 0; 
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const downloadReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt_${currentReceipt.receiptNumber}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 80mm; 
                margin: 0 auto; 
                padding: 15px;
                font-size: 14px;
              }
              .receipt-header { 
                text-align: center; 
                border-bottom: 1px dashed #000; 
                margin-bottom: 15px; 
                padding-bottom: 10px;
              }
              .receipt-info { 
                font-size: 12px; 
                margin-bottom: 15px; 
                display: flex; 
                justify-content: space-between; 
              }
              table { 
                width: 100%; 
                font-size: 12px; 
                border-collapse: collapse; 
                margin-bottom: 15px; 
              }
              th, td { 
                padding: 4px 0; 
                text-align: left;
              }
              th { 
                border-bottom: 1px solid #000; 
              }
              .item-name { 
                text-align: left; 
              }
              .receipt-total { 
                border-top: 1px dashed #000; 
                padding-top: 10px; 
                margin-top: 10px; 
              }
              .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 5px; 
              }
              .grand-total { 
                font-weight: bold; 
                font-size: 16px;
              }
              .receipt-footer { 
                text-align: center; 
                font-size: 11px; 
                margin-top: 15px; 
                padding-top: 10px; 
                border-top: 1px dashed #ddd; 
              }
              .offline-notice { 
                color: #e74c3c; 
                font-weight: bold; 
                text-align: center; 
                margin: 10px 0; 
                padding: 5px; 
                background: #ffeaea; 
                border-radius: 3px; 
              }
            </style>
          </head>
          <body>
            ${receiptContent.innerHTML}
          </body>
        </html>
      `;
      
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${currentReceipt.receiptNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const shareReceipt = async () => {
    if (navigator.share) {
      try {
        const textContent = `Receipt from ${shop.name || "My Shop"}
        
Date: ${dayjs(currentReceipt.date).format("DD MMM YYYY, HH:mm")}
Receipt #: ${currentReceipt.receiptNumber}

${currentReceipt.items.map(item => 
  `${item.name} - ${item.quantity} x ₦${item.price.toLocaleString()} = ₦${item.amount.toLocaleString()}`
).join('\n')}

Total: ₦${currentReceipt.total.toLocaleString()}

Thank you for your purchase!`;

        await navigator.share({
          title: `Receipt from ${shop.name || "My Shop"}`,
          text: textContent,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing receipt:', error);
        toast.error('Sharing failed. Please try again.');
      }
    } else {
      toast.info('Web Share API not supported in your browser');
    }
  };

  return (
    <div className="sales-page">
      {/* Header Section */}
      <div className="sales-header">
        <h1>Sales Management</h1>
        <div className="header-actions">
          <div className="search-box">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Search products..."
              onChange={(e) => {
                // Add search functionality if needed
              }}
            />
          </div>
          {isOnline && (
            <button onClick={() => setScannerOpen(true)} className="scan-btn">
              Scan Barcode
            </button>
          )}
        </div>
      </div>

      {/* Quick Sale Form */}
      <div className="quick-sale-form">
        <h2>Quick Sale</h2>
        <div className="form-grid">
          <div className="form-group" ref={searchRef}>
            <label>Select Product</label>
            <div className="searchable-select">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search products by name..."
                className="product-search-input"
              />
              {showSearchResults && filteredProducts.length > 0 && (
                <div className="search-results-dropdown">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="search-result-item"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="product-name">{product.name}</div>
                      <div className="product-details">
                        ₦{parseFloat(product.selling_price).toLocaleString()} • {product.quantity} in stock • {product.form || "unit"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showSearchResults && filteredProducts.length === 0 && searchQuery && (
                <div className="search-results-dropdown">
                  <div className="no-results">No products found</div>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="text"
              value={quantityInput}
              onChange={handleQuantityInputChange}
              placeholder="Enter quantity"
            />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button onClick={handleAddToCart} className="add-to-cart-btn">
              Add to Cart
            </button>
          </div>
        </div>

        {/* Auto Print Option */}
        <div className="auto-print-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={handleAutoPrintChange}
            />
            <span className="checkmark"></span>
            Auto print receipt after sale
          </label>
        </div>
      </div>

      {/* Cart Section with ref for auto-scroll */}
      <div className="cart-section" ref={cartSectionRef}>
        <h3>Shopping Cart ({cart.length} items)</h3>
        {cart.length > 0 ? (
          <div className="cart-table-container">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.name.replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                    <td>{item.quantity}</td>
                    <td>{item.form || "-"}</td>
                    <td>
                      <input
                        type="text"
                        value={item.priceInput || item.price.toLocaleString()}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="price-input"
                      />
                    </td>
                    <td>₦{item.amount.toLocaleString()}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteCartItem(item.id)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="cart-total">
              Total: ₦{cart.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
            </div>
            
            <div className="cart-actions">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="checkout-btn"
              >
                {loading ? "Processing..." : "Process Payment"}
                {!isOnline && " (Offline)"}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-cart">
            Your cart is empty. Add products to get started.
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">₦{totalDailySales.toLocaleString()}</span>
            <span className="stat-label">Today's Sales</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <span className="stat-value">{pendingSyncCount}</span>
            <span className="stat-label">Pending Sync</span>
          </div>
        </div>
        {!isOnline && (
          <div className="offline-indicator">
            ⚠️ Offline Mode
          </div>
        )}
        {isOnline && pendingSyncCount > 0 && (
          <button onClick={syncPendingSales} className="sync-btn">
            Sync Now
          </button>
        )}
      </div>

      {/* Sales History */}
      <div className="sales-history-section">
        <div className="section-header">
          <h3>Recent Sales</h3>
          <button
            className="toggle-history-btn"
            onClick={() => setShowTransactionHistory((prev) => !prev)}
          >
            {showTransactionHistory ? "Hide" : "Show"} Full History
          </button>
        </div>
        
        <div className="sales-table-container">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Amount</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s, index) => (
                <tr key={s.id}>
                  <td>{((s.name || "-").replace(/\b\w/g, (char) => char.toUpperCase()))}</td>
                  <td>{s.quantity}</td>
                  <td>{s.form || "-"}</td>
                  <td>₦{parseFloat(s.amount).toLocaleString()}</td>
                  <td>{dayjs(s.created_at).format("HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showTransactionHistory && (
          <div className="transaction-history">
            <h4>Transaction History</h4>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{dayjs(t.created_at).format("DD MMM, HH:mm")}</td>
                    <td>₦{t.total_amount.toLocaleString()}</td>
                    <td>
                      <button 
                        onClick={() => viewTransactionReceipt(t)}
                        className="view-receipt-btn"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(totalSales / pageSize) || 1}
          </span>
          <button
            disabled={page * pageSize >= totalSales}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Receipt Popup Modal */}
      {showReceipt && currentReceipt && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal">
            <div className="receipt-modal-header">
              <h2>Sales Receipt</h2>
              <button 
                className="receipt-close-btn"
                onClick={() => setShowReceipt(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="receipt-content" id="receipt-content">
              <div className="receipt-header">
                {shop.logo_url && (
                  <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />
                )}
                <h3>{shop.name || "My Shop"}</h3>
                <p>{shop.address || ""}</p>
                <small>{shop.phone || ""}</small>
              </div>
              
              {isReceiptOffline && (
                <div className="offline-notice">
                  OFFLINE SALE - PENDING SYNC
                </div>
              )}
              
              <div className="receipt-info">
                <span>Date: {dayjs(currentReceipt.date).format("DD MMM YYYY, HH:mm")}</span>
                <span>Receipt #: {currentReceipt.receiptNumber}</span>
              </div>
              
              <table className="receipt-items">
                <thead>
                  <tr>
                    <th className="item-name">Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReceipt.items.map((item, index) => (
                    <tr key={index}>
                      <td className="item-name">
                        <div>{item.name}</div>
                        {item.form && <div className="item-unit">{item.form}</div>}
                      </td>
                      <td>{item.quantity}</td>
                      <td>₦{item.price.toLocaleString()}</td>
                      <td>₦{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="receipt-total">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₦{currentReceipt.total.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Tax:</span>
                  <span>₦0.00</span>
                </div>
                <div className="total-row grand-total">
                  <span>TOTAL:</span>
                  <span>₦{currentReceipt.total.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="receipt-footer">
                <p>Thank you for your purchase!</p>
                <div className="payment-info">
                  <div>Payment Method: Cash</div>
                  <div>Status: {isReceiptOffline ? 'Pending Sync' : 'Completed'}</div>
                </div>
                <small>Powered by ShopStack</small>
              </div>
            </div>
            
            <div className="receipt-actions">
              <button onClick={printReceipt} className="receipt-action-btn receipt-print-btn">
                <i className="icon">🖨️</i> Print
              </button>
              <button onClick={downloadReceipt} className="receipt-action-btn receipt-download-btn">
                <i className="icon">📥</i> Download
              </button>
              <button onClick={shareReceipt} className="receipt-action-btn receipt-share-btn">
                <i className="icon">📤</i> Share
              </button>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="receipt-action-btn receipt-close-btn"
              >
                <i className="icon">✕</i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}