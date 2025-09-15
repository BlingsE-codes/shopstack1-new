import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import "../styles/posreportpage.css";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Loading from "../components/Loading";
import {
  Download,
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Receipt,
  Package,
  DollarSign,
  RefreshCw,
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  Building,
  MapPin,
  Phone,
  Mail,
  X
} from "lucide-react";

// Import chart components
import SalesChart from "../components/charts/possaleschart";
import CustomerAnalyticsChart from "../components/charts/CustomerAnalyticsChart";

export default function ReportsPage() {
  const { shop } = useShopStore();
  const shopId = shop?.id;
  const shopName = shop?.name || "Unknown Shop";

  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState({
    sales: [],
    billPayments: [],
    inventory: []
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    reportType: "all",
    sortBy: "date",
    sortOrder: "desc"
  });
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalBillPayments: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    topProducts: []
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [chartData, setChartData] = useState({
    salesData: [],
    customerData: []
  });

  // Fetch reports data
  const fetchReportsData = useCallback(async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from("postransactions")
        .select(`
          *,
          customer:shops(*),
          items:postransactionitems(*, product:products(*))
        `)
        .eq("shop_id", shopId)
        .eq("type", "sale")
        .gte("created_at", `${dateRange.start}T00:00:00`)
        .lte("created_at", `${dateRange.end}T23:59:59`);

      if (salesError) throw salesError;

      // Fetch bill payments data
      const { data: billData, error: billError } = await supabase
        .from("postransactions")
        .select(`
          *,
          customer:shops(*),
          bill:billpayments(*, biller:billers(*))
        `)
        .eq("shop_id", shopId)
        .eq("type", "bill_payment")
        .gte("created_at", `${dateRange.start}T00:00:00`)
        .lte("created_at", `${dateRange.end}T23:59:59`);

      if (billError) throw billError;

      // Calculate summary data
      const totalSales = salesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const totalBillPayments = billData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const totalTransactions = (salesData?.length || 0) + (billData?.length || 0);
      const averageTransaction = totalTransactions > 0 ? (totalSales + totalBillPayments) / totalTransactions : 0;

      // Calculate top products from sales data
      const productMap = {};
      salesData?.forEach(sale => {
        sale.items?.forEach(item => {
          const productId = item.product?.id || 'unknown';
          const productName = item.product?.name || 'Unknown Product';
          if (!productMap[productId]) {
            productMap[productId] = {
              id: productId,
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          productMap[productId].quantity += item.quantity || 0;
          productMap[productId].revenue += (item.price || 0) * (item.quantity || 0);
        });
      });

      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Prepare chart data
      const salesByDate = {};
      const customerCount = {};
      
      // Process sales data for charts
      salesData?.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString();
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += sale.amount || 0;
        
        // Count customers
        const customerId = sale.customer?.id || 'anonymous';
        if (!customerCount[customerId]) {
          customerCount[customerId] = {
            id: customerId,
            name: sale.customer?.name || 'Anonymous',
            visits: 0,
            totalSpent: 0
          };
        }
        customerCount[customerId].visits += 1;
        customerCount[customerId].totalSpent += sale.amount || 0;
      });

      // Process bill payments for charts
      billData?.forEach(bill => {
        const date = new Date(bill.created_at).toLocaleDateString();
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += bill.amount || 0;
      });

      const salesChartData = Object.keys(salesByDate).map(date => ({
        date,
        amount: salesByDate[date]
      }));

      const customerChartData = Object.values(customerCount)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      setReportsData({
        sales: salesData || [],
        billPayments: billData || [],
        inventory: [] // You would fetch inventory data here if available
      });

      setSummary({
        totalSales,
        totalBillPayments,
        totalTransactions,
        averageTransaction,
        topProducts
      });

      setChartData({
        salesData: salesChartData,
        customerData: customerChartData
      });

    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast.error("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  }, [shopId, dateRange]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleDateChange = (e, type) => {
    setDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };

  const handleSort = (column) => {
    if (filters.sortBy === column) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: column,
        sortOrder: "desc"
      }));
    }
  };

  const exportReport = async (format) => {
    try {
      // Prepare data for export
      const dataToExport = [...reportsData.sales, ...reportsData.billPayments]
        .filter(item => {
          if (filters.reportType === "sales") return item.type === "sale";
          if (filters.reportType === "bills") return item.type === "bill_payment";
          return true;
        })
        .map(item => ({
          Date: new Date(item.created_at).toLocaleDateString(),
          Time: new Date(item.created_at).toLocaleTimeString(),
          Type: item.type === "sale" ? "Sale" : "Bill Payment",
          Customer: item.customer?.name || item.customer_id || "N/A",
          Amount: item.amount || 0,
          Commission: item.commission || 0,
          Charges: item.charges || 0,
          Status: item.status || "completed"
        }));

      if (format === 'csv') {
        // Convert to CSV
        const headers = Object.keys(dataToExport[0] || {}).join(',');
        const csvData = dataToExport.map(row => 
          Object.values(row).map(value => `"${value}"`).join(',')
        ).join('\n');
        
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${csvData}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pos_report_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        // For PDF, we would typically use a library like jspdf
        toast.info("PDF export functionality would be implemented with a PDF library");
        // This would be replaced with actual PDF generation code
      }
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  const printReport = () => {
    toast.success("Printing report...");
    // Create a print-friendly version of the report
    const printContent = document.getElementById('reports-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px;">
        <h1>${shopName} - Sales Report</h1>
        <p>Period: ${dateRange.start} to ${dateRange.end}</p>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const sortedTransactions = useMemo(() => {
    const allTransactions = [...reportsData.sales, ...reportsData.billPayments]
      .filter(item => {
        if (filters.reportType === "sales") return item.type === "sale";
        if (filters.reportType === "bills") return item.type === "bill_payment";
        return true;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sortBy) {
          case "date":
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case "amount":
            aValue = a.amount || 0;
            bValue = b.amount || 0;
            break;
          case "type":
            aValue = a.type;
            bValue = b.type;
            break;
          case "customer":
            aValue = a.customer?.name || a.customer_id || "";
            bValue = b.customer?.name || b.customer_id || "";
            break;
          default:
            aValue = a.created_at;
            bValue = b.created_at;
        }
        
        if (typeof aValue === 'string') {
          return filters.sortOrder === "asc" 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        } else {
          return filters.sortOrder === "asc" 
            ? aValue - bValue 
            : bValue - aValue;
        }
      });
    
    return allTransactions;
  }, [reportsData, filters]);

  if (loading) return <Loading />;

  return (
    <div className="reports-wrapper">
      <div className="reports-page" id="reports-content">
        {/* Header */}
        <div className="reports-header">
          <div className="header-left">
            <h1>Sales Reports</h1>
            <p>Analyze your shop performance and transactions</p>
          </div>
          <div className="shop-info">
            <div className="shop-id">Shop ID: {shopId}</div>
            <div className="shop-name">{shopName}</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="reports-controls">
          <div className="control-group">
            <label htmlFor="start-date">From</label>
            <div className="date-input">
              <Calendar size={16} />
              <input
                type="date"
                id="start-date"
                value={dateRange.start}
                onChange={(e) => handleDateChange(e, "start")}
              />
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="end-date">To</label>
            <div className="date-input">
              <Calendar size={16} />
              <input
                type="date"
                id="end-date"
                value={dateRange.end}
                onChange={(e) => handleDateChange(e, "end")}
              />
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="report-type">Report Type</label>
            <div className="select-wrapper">
              <Filter size={16} />
              <select
                id="report-type"
                value={filters.reportType}
                onChange={(e) => handleFilterChange("reportType", e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="sales">Sales Only</option>
                <option value="bills">Bill Payments Only</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <button className="btn-primary" onClick={fetchReportsData}>
            <RefreshCw size={16} />
            Apply Filters
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon sales">
              <DollarSign size={20} />
            </div>
            <div className="card-content">
              <h3>₦{summary.totalSales.toLocaleString()}</h3>
              <p>Total Sales</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon bills">
              <Receipt size={20} />
            </div>
            <div className="card-content">
              <h3>₦{summary.totalBillPayments.toLocaleString()}</h3>
              <p>Bill Payments</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon transactions">
              <CreditCard size={20} />
            </div>
            <div className="card-content">
              <h3>{summary.totalTransactions}</h3>
              <p>Total Transactions</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon average">
              <BarChart3 size={20} />
            </div>
            <div className="card-content">
              <h3>₦{Math.round(summary.averageTransaction).toLocaleString()}</h3>
              <p>Average Transaction</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => exportReport('pdf')}>
            <Download size={16} />
            Export PDF
          </button>
          <button className="btn-secondary" onClick={() => exportReport('csv')}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="btn-secondary" onClick={printReport}>
            <Printer size={16} />
            Print Report
          </button>
        </div>

        {/* Transactions Table */}
        <div className="reports-section">
          <h2>Transaction Details</h2>
          <div className="transactions-table">
            <div className="table-header">
              <div className={`col sortable ${filters.sortBy === 'date' ? 'active' : ''}`} onClick={() => handleSort('date')}>
                Date & Time {filters.sortBy === 'date' && (filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </div>
              <div className={`col sortable ${filters.sortBy === 'type' ? 'active' : ''}`} onClick={() => handleSort('type')}>
                Type {filters.sortBy === 'type' && (filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </div>
              <div className={`col sortable ${filters.sortBy === 'customer' ? 'active' : ''}`} onClick={() => handleSort('customer')}>
                Customer/Account {filters.sortBy === 'customer' && (filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </div>
              <div className={`col sortable ${filters.sortBy === 'amount' ? 'active' : ''}`} onClick={() => handleSort('amount')}>
                Amount {filters.sortBy === 'amount' && (filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </div>
              <div className="col">Commission</div>
              <div className="col">Charges</div>
              <div className="col">Status</div>
              <div className="col">Actions</div>
            </div>
            
            <div className="table-body">
              {sortedTransactions.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div className="col">
                    {new Date(transaction.created_at).toLocaleDateString()} 
                    <br />
                    <small>{new Date(transaction.created_at).toLocaleTimeString()}</small>
                  </div>
                  <div className="col">
                    <span className={`type-badge ${transaction.type}`}>
                      {transaction.type === "sale" ? "Sale" : "Bill Payment"}
                    </span>
                  </div>
                  <div className="col">
                    {transaction.customer?.name || transaction.customer_id || "N/A"}
                    {transaction.bill?.biller && (
                      <small>{transaction.bill.biller.name}</small>
                    )}
                  </div>
                  <div className="col">
                    <strong>₦{parseFloat(transaction.amount || 0).toLocaleString()}</strong>
                  </div>
                  <div className="col">
                    ₦{parseFloat(transaction.commission || 0).toLocaleString()}
                  </div>
                  <div className="col">
                    ₦{parseFloat(transaction.charges || 0).toLocaleString()}
                  </div>
                  <div className="col">
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status || "completed"}
                    </span>
                  </div>
                  <div className="col">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => viewTransactionDetails(transaction)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </div>
              ))}

              {sortedTransactions.length === 0 && (
                <div className="empty-state">
                  <BarChart3 size={48} />
                  <p>No transactions found for the selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="reports-section">
          <h2>Performance Overview</h2>
          <div className="charts-container">
            <div className="chart-card">
              <h3>Sales Trend</h3>
              <SalesChart data={chartData.salesData} />
            </div>
            <div className="chart-card">
              <h3>Top Customers</h3>
              <CustomerAnalyticsChart data={chartData.customerData} />
            </div>
          </div>
        </div>

        {/* Top Products Section */}
        {summary.topProducts.length > 0 && (
          <div className="reports-section">
            <h2>Top Selling Products</h2>
            <div className="top-products">
              {summary.topProducts.map((product, index) => (
                <div key={product.id} className="product-item">
                  <div className="product-rank">{index + 1}</div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>Sold: {product.quantity} units</p>
                  </div>
                  <div className="product-revenue">
                    ₦{product.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop Information */}
        <div className="reports-section">
          <h2>Shop Information</h2>
          <div className="shop-details">
            <div className="detail-item">
              <Building size={18} />
              <span>{shopName}</span>
            </div>
            <div className="detail-item">
              <div className="shop-id-badge">ID: {shopId}</div>
            </div>
            {shop?.address && (
              <div className="detail-item">
                <MapPin size={18} />
                <span>{shop.address}</span>
              </div>
            )}
            {shop?.phone && (
              <div className="detail-item">
                <Phone size={18} />
                <span>{shop.phone}</span>
              </div>
            )}
            {shop?.email && (
              <div className="detail-item">
                <Mail size={18} />
                <span>{shop.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={() => setShowTransactionModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="transaction-details">
                <div className="detail-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{selectedTransaction.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date & Time:</span>
                  <span className="value">
                    {new Date(selectedTransaction.created_at).toLocaleDateString()}{' '}
                    {new Date(selectedTransaction.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">
                    <span className={`type-badge ${selectedTransaction.type}`}>
                      {selectedTransaction.type === "sale" ? "Sale" : "Bill Payment"}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">₦{parseFloat(selectedTransaction.amount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">
                    <span className={`status-badge ${selectedTransaction.status}`}>
                      {selectedTransaction.status || "completed"}
                    </span>
                  </span>
                </div>
                
                {selectedTransaction.customer && (
                  <>
                    <h3>Customer Information</h3>
                    <div className="detail-row">
                      <span className="label">Name:</span>
                      <span className="value">{selectedTransaction.customer.name || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span className="value">{selectedTransaction.customer.phone || "N/A"}</span>
                    </div>
                  </>
                )}
                
                {selectedTransaction.type === "sale" && selectedTransaction.items && (
                  <>
                    <h3>Items</h3>
                    {selectedTransaction.items.map(item => (
                      <div key={item.id} className="item-row">
                        <div className="item-name">{item.product?.name || "Unknown Product"}</div>
                        <div className="item-quantity">Qty: {item.quantity}</div>
                        <div className="item-price">₦{parseFloat(item.price || 0).toLocaleString()}</div>
                        <div className="item-total">₦{parseFloat((item.price || 0) * (item.quantity || 0)).toLocaleString()}</div>
                      </div>
                    ))}
                  </>
                )}
                
                {selectedTransaction.type === "bill_payment" && selectedTransaction.bill && (
                  <>
                    <h3>Bill Payment Details</h3>
                    <div className="detail-row">
                      <span className="label">Biller:</span>
                      <span className="value">{selectedTransaction.bill.biller?.name || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Account:</span>
                      <span className="value">{selectedTransaction.bill.account_number || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Reference:</span>
                      <span className="value">{selectedTransaction.bill.reference || "N/A"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowTransactionModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}