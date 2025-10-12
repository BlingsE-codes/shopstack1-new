import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { useShopStore } from "../store/shop-store";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import Barcode from "react-barcode";
import { NetworkStatus } from "../utils/networkStatus";
import { offlineDB } from "../services/offlineDB";
import CsvImporter from '../components/CsvImporter';
import "../styles/products.css";

export default function Products() {
  const { shop } = useShopStore();
  const [products, setProducts] = useState([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalCostValue, setTotalCostValue] = useState(0);
  const [importLoading, setImportLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    form: "",
    cost_price: "",
    selling_price: "",
    low_stock_alert: "5",
    barcode: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDailySales, setTotalDailySales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [scanningStatus, setScanningStatus] = useState("idle"); // 'idle', 'scanning', 'success', 'error'
  const [cameraPermission, setCameraPermission] = useState(null); // 'granted', 'denied', 'prompt'
  const [torchOn, setTorchOn] = useState(false);
  const formRef = useRef(null);
  const scannerRef = useRef(null);
  const limit = 10;

  useEffect(() => {
    setIsOnline(NetworkStatus.isOnline());
    
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingProductUpdates();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Changes will be saved locally.");
    };
    
    NetworkStatus.addOnlineListener(handleOnline);
    NetworkStatus.addOfflineListener(handleOffline);
    
    offlineDB.init().then(() => {
      checkPendingProductUpdates();
    });
    
    return () => {
      NetworkStatus.removeOnlineListener(handleOnline);
      NetworkStatus.removeOfflineListener(handleOffline);
    };
  }, []);

  // Check camera permissions when scanner opens
  useEffect(() => {
    if (scannerOpen) {
      checkCameraPermissions();
    }
  }, [scannerOpen]);

  const checkCameraPermissions = async () => {
    try {
      // Modern browsers support the Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(permissionStatus.state);
        
        permissionStatus.onchange = () => {
          setCameraPermission(permissionStatus.state);
        };
      } else {
        // Fallback for browsers that don't support Permissions API
        setCameraPermission('prompt');
      }
    } catch (error) {
      console.error("Error checking camera permissions:", error);
      setCameraPermission('prompt');
    }
  };

  const checkPendingProductUpdates = async () => {
    try {
      const pendingUpdates = await offlineDB.getPendingProductUpdates();
      setPendingSyncCount(pendingUpdates.length);
      
      if (isOnline && pendingUpdates.length > 0) {
        syncPendingProductUpdates();
      }
    } catch (error) {
      console.error("Error checking pending product updates:", error);
    }
  };

  const syncPendingProductUpdates = async () => {
    try {
      const pendingUpdates = await offlineDB.getPendingProductUpdates();
      
      for (const update of pendingUpdates) {
        try {
          const { error } = await supabase
            .from("products")
            .update(update.updates)
            .eq("id", update.product_id);
            
          if (error) throw error;
          
          await offlineDB.removePendingProductUpdate(update.id);
        } catch (error) {
          console.error("Error syncing product update:", error);
        }
      }
      
      fetchProducts();
      
      const updatedPending = await offlineDB.getPendingProductUpdates();
      setPendingSyncCount(updatedPending.length);
      
      if (updatedPending.length === 0) {
        toast.success("All pending product updates have been synced!");
      }
    } catch (error) {
      console.error("Error syncing pending product updates:", error);
    }
  };

  const fetchProducts = async () => {
    if (!isOnline) {
      const cachedProducts = localStorage.getItem('cachedProducts');
      if (cachedProducts) {
        setProducts(JSON.parse(cachedProducts));
        calculateStockValues(JSON.parse(cachedProducts));
        return;
      }
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Error fetching products");
      return;
    }

    setProducts(data || []);
    localStorage.setItem('cachedProducts', JSON.stringify(data || []));
    calculateStockValues(data || []);
    setTotalPages(Math.ceil((count || 0) / limit));
  };

  const calculateStockValues = (data) => {
    const totalValue = (data || []).reduce((sum, p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.selling_price) || 0;
      return sum + qty * price;
    }, 0);

    const totalCost = (data || []).reduce((sum, p) => {
      return sum + (Number(p.quantity) || 0) * (Number(p.cost_price) || 0);
    }, 0);

    setTotalStockValue(totalValue);
    setTotalCostValue(totalCost);
  };

  const fetchDailySales = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("sales")
      .select("amount")
      .eq("shop_id", shop.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (!error) {
      const total = data.reduce((sum, sale) => sum + sale.amount, 0);
      setTotalDailySales(total);
    }
  };

  useEffect(() => {
    if (shop.id) {
      fetchProducts();
      fetchDailySales();
    }
  }, [shop.id, page]);

  const formatWithCommas = (value) => {
    if (!value) return "";
    const onlyNums = value.replace(/\D/g, "");
    return onlyNums.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["quantity", "cost_price", "selling_price"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: formatWithCommas(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      quantity: "",
      form: "",
      cost_price: "",
      selling_price: "",
      low_stock_alert: "5",
      barcode: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline && !editingId) {
      toast.error("Cannot add new products while offline");
      return;
    }
    
    setLoading(true);

    const payload = {
      category: form.category.toLowerCase(),
      name: form.name.toLowerCase(),
      quantity: Number(form.quantity.replace(/,/g, "")),
      form: form.form,
      cost_price: Number(form.cost_price.replace(/,/g, "")),
      selling_price: Number(form.selling_price.replace(/,/g, "")),
      low_stock_alert: Number(form.low_stock_alert),
      shop_id: shop.id,
    };

    if (form.barcode && form.barcode.trim() !== "") {
      payload.barcode = form.barcode.trim();
    }

    let error;
    if (editingId) {
      if (isOnline) {
        ({ error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId));
      } else {
        await offlineDB.addPendingProductUpdate(editingId, payload);
        error = null;
      }
    } else {
      ({ error } = await supabase.from("products").insert([payload]));
    }

    setLoading(false);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    } else {
      if (isOnline || editingId) {
        toast.success(editingId ? "Product updated" : "Product added");
        resetForm();
        fetchProducts();
        fetchDailySales();
      } else {
        toast.success("Update saved offline. Will sync when connection is restored.");
        setPendingSyncCount(prev => prev + 1);
      }
    }
  };

  const handleEdit = (product) => {
    setForm({
      ...product,
      quantity: formatWithCommas(String(product.quantity)),
      cost_price: formatWithCommas(String(product.cost_price)),
      selling_price: formatWithCommas(String(product.selling_price)),
    });
    setEditingId(product.id);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Delete failed: " + error.message);
      }
    }
  };

  const handleQuantityChange = async (id, newQty) => {
    const qty = parseInt(newQty.replace(/,/g, ""));
    if (!isNaN(qty)) {
      if (isOnline) {
        await supabase.from("products").update({ quantity: qty }).eq("id", id);
        fetchProducts();
      } else {
        await offlineDB.addPendingProductUpdate(id, { quantity: qty });
        
        const updatedProducts = products.map(p => 
          p.id === id ? { ...p, quantity: qty } : p
        );
        setProducts(updatedProducts);
        calculateStockValues(updatedProducts);
        localStorage.setItem('cachedProducts', JSON.stringify(updatedProducts));
        
        setPendingSyncCount(prev => prev + 1);
        toast.success("Quantity updated offline. Will sync when connection is restored.");
      }
    }
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "shopstack_products.csv");
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBarcodeDetected = (error, result) => {
    if (error) {
      console.error("Barcode scan error:", error);
      setScanningStatus("error");
      toast.error("Scanning failed: " + error.message);
      return;
    }
    
    if (result && result.text) {
      const code = result.text;
      setForm((prev) => ({ ...prev, barcode: code }));
      setScanningStatus("success");
      toast.success("Barcode scanned: " + code);
      
      // Close scanner after successful scan
      setTimeout(() => {
        setScannerOpen(false);
        setScanningStatus("idle");
      }, 1500);
    }
  };

  const printBarcode = (barcodeValue, productName) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${productName}</title>
        </head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
          <h2>${productName}</h2>
          <svg id="barcode"></svg>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${barcodeValue}", {
              format: "EAN13",
              lineColor: "#000",
              width: 2,
              height: 60,
              displayValue: true
            });
            window.print();
            window.onafterprint = () => window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Function to manually trigger a scan retry
  const retryScan = () => {
    setScanningStatus("scanning");
    // Additional logic to reset the scanner if needed
  };

  // Toggle torch (simulated in this example)
  const toggleTorch = () => {
    setTorchOn(!torchOn);
    toast.info(torchOn ? "Torch deactivated" : "Torch activated");
  };

  return (
    <div className="shopstack-wrapper">
    <div className="products-page">
      {/* Quick Add Form */}
      <div className="quick-add-form" ref={formRef}>
        <h1>Product Management</h1>
        <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Enter category"
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="text"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input
                type="text"
                name="form"
                value={form.form}
                onChange={handleChange}
                list="unit-options"
                className="unit-select"
                placeholder="Select or type unit"
              />
              <datalist id="unit-options">
                <option value="Bag(s)" />
                <option value="Carton(s)" />
                <option value="Unit(s)" />
                <option value="Sachet(s)" />
                <option value="Pack(s)" />
                <option value="Crate(s)" />
                <option value="Piece(s)" />
                <option value="Litre(s)" />
                <option value="Box(es)" />
                <option value="Kilogram(s)" />
                <option value="Gram(s)" />
                <option value="Bottle(s)" />
                <option value="Cup(s)" />
                <option value="Pair(s)" />
                <option value="Can(s)" />
                <option value="Roll(s)" />
              </datalist>
            </div>

            <div className="form-group">
              <label>Cost Price (₦)</label>
              <input
                type="text"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Selling Price (₦)</label>
              <input
                type="text"
                name="selling_price"
                value={form.selling_price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Low Stock Alert</label>
              <input
                type="text"
                name="low_stock_alert"
                value={form.low_stock_alert}
                onChange={handleChange}
                placeholder="5"
              />
            </div>
            <div className="form-group">
              <label>Barcode</label>
              <div className="barcode-input-group">
                <input
                  type="text"
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder="Enter barcode"
                />
                <button 
                  type="button" 
                  className="barcode-btn"
                  onClick={() => setScannerOpen(true)}
                >
                  Scan
                </button>
                <button 
                  type="button" 
                  className="barcode-btn"
                  onClick={() => {
                    const randomBarcode = Math.floor(
                      100000000000 + Math.random() * 900000000000
                    ).toString();
                    setForm({ ...form, barcode: randomBarcode });
                    toast.success("Barcode generated: " + randomBarcode);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="products-header">
        <div className="header-actions">
          <div className="search-box">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={exportToCSV} className="export-btn" disabled={importLoading}>
            {importLoading ? '⏳ Processing...' : '📥 Export CSV'}
          </button>
          <CsvImporter 
            onImportComplete={fetchProducts}
            onLoadingChange={setImportLoading}
          />
          {!isOnline && (
            <div className="offline-indicator">
              ⚠️ Offline ({pendingSyncCount} pending)
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">₦{totalCostValue.toLocaleString()}</span>
            <span className="stat-label">Total Cost Value</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">₦{totalStockValue.toLocaleString()}</span>
            <span className="stat-label">Total Selling Value</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <span className="stat-value">{pendingSyncCount}</span>
            <span className="stat-label">Pending Sync</span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-section">
        <div className="table-header">
          <h2>Products List</h2>
          <div className="table-info">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
        <div className="table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Stock Alert</th>
                <th>Barcode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className={prod.quantity <= prod.low_stock_alert ? "low-stock" : ""}>
                  <td>
                    <div className="product-name">
                      {prod.name.charAt(0).toUpperCase() + prod.name.slice(1)}
                    </div>
                  </td>
                  <td>
                    <div className="quantity-cell">
                      <input
                        type="text"
                        className="qty-input"
                        value={formatWithCommas(String(prod.quantity))}
                        onChange={(e) => handleQuantityChange(prod.id, e.target.value)}
                      />
                      <span className="unit-label">{prod.form}</span>
                    </div>
                  </td>
                  <td>{prod.category}</td>
                  <td>₦{parseFloat(prod.cost_price).toLocaleString()}</td>
                  <td>₦{parseFloat(prod.selling_price).toLocaleString()}</td>
                  <td>
                    <div className={`stock-alert ${prod.quantity <= prod.low_stock_alert ? "alert-active" : ""}`}>
                      {prod.low_stock_alert}
                    </div>
                  </td>
                  <td>
                    {prod.barcode ? (
                      <div className="barcode-cell">
                        <Barcode 
                          value={prod.barcode} 
                          width={1} 
                          height={30} 
                          displayValue={false} 
                        />
                        <button
                          className="print-btn"
                          onClick={() => printBarcode(prod.barcode, prod.name)}
                        >
                          Print
                        </button>
                      </div>
                    ) : (
                      "No Barcode"
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(prod)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(prod.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <div className="scanner-modal">
          <div className="scanner-content">
            <div className="scanner-header">
              <h3>Scan Barcode</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setScannerOpen(false);
                  setScanningStatus("idle");
                }}
              >
                &times;
              </button>
            </div>
            
            {/* Camera permission status */}
            {cameraPermission === 'denied' && (
              <div className="camera-permission-denied">
                <p>Camera access is denied. Please enable camera permissions in your browser settings.</p>
              </div>
            )}
            
            {/* Scanner status feedback */}
            {scanningStatus === "error" && (
              <div className="scanner-error">
                <p>Scanning failed. Please try again.</p>
                <button onClick={retryScan} className="retry-btn">
                  Retry
                </button>
              </div>
            )}
            
            {scanningStatus === "success" && (
              <div className="scanner-success">
                <p>Barcode successfully scanned!</p>
              </div>
            )}
            
            {/* Scanner component with visual guidance */}
            <div className={`scanner-view ${scanningStatus !== 'idle' ? 'scanner-hidden' : ''}`}>
              <div className="scanner-guide">
                <div className="focus-box">
                  <div className="focus-text">Align barcode within this box</div>
                </div>
                <div className="scan-line"></div>
              </div>
              <BarcodeScannerComponent
                ref={scannerRef}
                width={400}
                height={300}
                onUpdate={handleBarcodeDetected}
                facingMode="environment" // Use back camera by default
              />
            </div>
            
            <div className="scanner-controls">
              <button 
                onClick={toggleTorch} 
                className="secondary-btn"
              >
                {torchOn ? 'Turn Torch Off' : 'Turn Torch On'}
              </button>
            </div>
            
            <p className="scanner-help">
              {scanningStatus === "idle" 
                ? "Position barcode in front of camera" 
                : scanningStatus === "scanning" 
                ? "Scanning..." 
                : ""}
            </p>
            
            <div className="troubleshooting-tips">
              <h4>Scanning Tips:</h4>
              <ul>
                <li>Ensure good lighting</li>
                <li>Hold the barcode steady within the viewfinder</li>
                <li>Keep the barcode flat and avoid reflections</li>
                <li>Try moving closer or further if not scanning</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}