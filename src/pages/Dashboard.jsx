import { useEffect, useState, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/dashboard.css";
import { useShopStore } from "../store/shop-store";
import SalesChart from "../components/SalesChart";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import ProfitPieChart from "../components/ProfitPieChart";
import { motion } from "framer-motion";

const timeframes = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export default function Dashboard() {
  const { shop } = useShopStore();
  const { user } = useAuthStore();
  const [sales, setSales] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [profitLabels, setProfitLabels] = useState([]);
  const [profitValues, setProfitValues] = useState([]);
  const [filter, setFilter] = useState("weekly");
  const [expenses, setExpenses] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [realProfits, setRealProfits] = useState(0);
  const [showSalesChart, setShowSalesChart] = useState(true);
  const [showProfitChart, setShowProfitChart] = useState(true);
  const [debtorFilter, setDebtorFilter] = useState("weekly");
  const [debtorsList, setDebtorsList] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [realProfitStats, setRealProfitStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  const [debtorStats, setDebtorStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });

  const [realProfitLabels, setRealProfitLabels] = useState([]);
  const [realProfitValues, setRealProfitValues] = useState([]);
  const [products, setProducts] = useState([]);

  const navigate = useNavigate();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Check if user has an active subscription or is still in trial
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!user?.id) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("trial_start, is_paid")
        .eq("auth_id", user.id)
        .single();

      if (error || !profile) return;

      const now = dayjs();
      const trialStart = dayjs(profile.trial_start);
      const trialExpired = now.diff(trialStart, "day") >= 30;

      if (!profile.is_paid && trialExpired) {
        navigate("/subscribe");
      }
    };

    checkTrialStatus();
  }, [user?.id]);

  useEffect(() => {
    if (!shop.id) return;
    fetchDashboardStats();
    fetchLowStockItems();
    fetchTopProducts();
    fetchExpenses();
  }, [filter, shop.id]);

  // Fetch dashboard stats and calculate both sales and profit
  const fetchDashboardStats = async () => {
    let fromDate, toDate;
    const today = new Date();

    if (filter === "daily") {
      fromDate = today.toISOString().split("T")[0];
      toDate = fromDate;
    } else if (filter === "weekly") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      fromDate = start.toISOString().split("T")[0];
      toDate = today.toISOString().split("T")[0];
    } else {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      fromDate = start.toISOString().split("T")[0];
      toDate = today.toISOString().split("T")[0];
    }

    const { data: salesData, error } = await supabase
      .from("sales")
      .select("amount, created_at, product_id, quantity, products(cost_price)")
      .eq("shop_id", shop.id)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

    if (error) {
      console.error("Error fetching sales:", error.message);
      return;
    }

    setSales(salesData);

    // Group sales by date and calculate profit for each day
    const dailySales = {};
    const dailyProfit = {};
    
    salesData?.forEach((sale) => {
      const dateKey = new Date(sale.created_at).toLocaleDateString();
      
      // Initialize if not exists
      if (!dailySales[dateKey]) dailySales[dateKey] = 0;
      if (!dailyProfit[dateKey]) dailyProfit[dateKey] = 0;
      
      // Add to sales total
      dailySales[dateKey] += sale.amount;
      
      // Calculate profit (sales amount - cost)
      const costPrice = sale.products?.cost_price || 0;
      const profit = sale.amount - (costPrice * sale.quantity);
      dailyProfit[dateKey] += profit;
    });
    
    // Sort dates and create arrays for the chart
    const sortedDates = Object.keys(dailySales).sort();
    const salesDataValues = sortedDates.map(date => dailySales[date]);
    const profitDataValues = sortedDates.map(date => dailyProfit[date]);
    
    setChartLabels(sortedDates);
    setChartValues(salesDataValues);
    setProfitLabels(sortedDates);
    setProfitValues(profitDataValues);
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, created_at")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load expenses");
      return;
    }

    setExpenses(data);
    const totalAmount = data.reduce(
      (acc, e) => acc + parseFloat(e.amount || 0),
      0
    );
    setTotal(totalAmount.toFixed(2));
    setLoading(false);
  };

  const fetchLowStockItems = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, form, quantity")
      .eq("shop_id", shop.id)
      .lt("quantity", 5);

    if (error) {
      console.error("Failed to fetch low stock items:", error);
    } else {
      setLowStock(data);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, cost_price")
        .eq("shop_id", shop.id);

      if (error) {
        console.error("Failed to fetch products:", error);
      } else {
        setProducts(data);
      }
    };
    fetchProducts();
  }, [shop.id]);

  useEffect(() => {
    const fetchAndCalculateRealProfits = async () => {
      if (!shop.id || products.length === 0) return;

      let fromDate, toDate;
      const today = new Date();

      if (filter === "daily") {
        fromDate = today.toISOString().split("T")[0];
        toDate = fromDate;
      } else if (filter === "weekly") {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        fromDate = start.toISOString().split("T")[0];
        toDate = today.toISOString().split("T")[0];
      } else {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        fromDate = start.toISOString().split("T")[0];
        toDate = today.toISOString().split("T")[0];
      }

      const { data: sales, error } = await supabase
        .from("sales")
        .select("amount, created_at, product_id, quantity")
        .eq("shop_id", shop.id)
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`);

      if (error) {
        console.error("Error fetching sales for real profits:", error.message);
        setRealProfits(0);
        return;
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      let totalRealProfit = 0;
      sales?.forEach((sale) => {
        const product = productMap.get(sale.product_id);
        if (product) {
          const realProfitPerItem =
            sale.amount - product.cost_price * sale.quantity;
          totalRealProfit += realProfitPerItem;
        }
      });

      const filteredExpenses = expenses.filter((expense) => {
        const expDate = new Date(expense.created_at)
          .toISOString()
          .split("T")[0];
        return expDate >= fromDate && expDate <= toDate;
      });
      const expensesSum = filteredExpenses.reduce(
        (acc, e) => acc + parseFloat(e.amount || 0),
        0
      );

      const finalProfit = totalRealProfit - expensesSum;
      setRealProfits(finalProfit.toFixed(2));
    };

    fetchAndCalculateRealProfits();
  }, [shop.id, products, filter, expenses]);

  useEffect(() => {
    const fetchRealProfitStats = async () => {
      if (!shop.id || products.length === 0) return;

      const timeframes = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        yearly: 365,
      };

      const productMap = new Map(products.map((p) => [p.id, p]));
      const results = {};

      for (const [key, days] of Object.entries(timeframes)) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - (days - 1));
        const fromISO = fromDate.toISOString().split("T")[0];
        const toISO = new Date().toISOString().split("T")[0];

        const { data: sales, error } = await supabase
          .from("sales")
          .select("amount, created_at, product_id, quantity")
          .eq("shop_id", shop.id)
          .gte("created_at", `${fromISO}T00:00:00`)
          .lte("created_at", `${toISO}T23:59:59`);

        if (error) {
          console.error(`Error fetching ${key} sales:`, error.message);
          results[key] = 0;
          continue;
        }

        let totalRealProfit = 0;
        sales?.forEach((sale) => {
          const product = productMap.get(sale.product_id);
          if (product) {
            const realProfitPerItem =
              sale.amount - product.cost_price * sale.quantity;
            totalRealProfit += realProfitPerItem;
          }
        });

        const filteredExpenses = expenses.filter((expense) => {
          const expDate = new Date(expense.created_at)
            .toISOString()
            .split("T")[0];
          return expDate >= fromISO && expDate <= toISO;
        });
        const expensesSum = filteredExpenses.reduce(
          (acc, e) => acc + parseFloat(e.amount || 0),
          0
        );

        const finalProfit = totalRealProfit - expensesSum;
        results[key] = finalProfit.toFixed(2);
      }

      setRealProfitStats(results);
      setRealProfitLabels(["Daily", "Weekly", "Monthly", "Yearly"]);
      setRealProfitValues([
        parseFloat(results.daily),
        parseFloat(results.weekly),
        parseFloat(results.monthly),
        parseFloat(results.yearly),
      ]);
    };

    fetchRealProfitStats();
  }, [shop.id, products, filter, expenses]);

  const fetchTopProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
        product_id,
        quantity,
        products (
          name,
          form
        )
      `
        )
        .eq("shop_id", shop.id);

      if (error) throw error;

      // group totals by product_id
      const salesMap = {};
      data.forEach((sale) => {
        const id = sale.product_id;
        if (!salesMap[id]) {
          salesMap[id] = {
            name: sale.products?.name || "Unknown",
            form: sale.products?.form || "",
            total: 0,
          };
        }
        salesMap[id].total += sale.quantity;
      });

      const sorted = Object.values(salesMap).sort((a, b) => b.total - a.total);
      setTopProducts(sorted.slice(0, 5)); // top 5
    } catch (err) {
      console.error("Error fetching top products:", err.message);
    }
  };

  useEffect(() => {
    const fetchDebtorsStats = async () => {
      if (!shop.id) return;

      const results = {};
      const today = new Date();

      for (const [key, days] of Object.entries(timeframes)) {
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - (days - 1));
        const fromISO = fromDate.toISOString().split("T")[0];
        const toISO = today.toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("debtors")
          .select("amount, created_at")
          .eq("shop_id", shop.id)
          .gte("created_at", `${fromISO}T00:00:00`)
          .lte("created_at", `${toISO}T23:59:59`);

        if (error) {
          console.error(`Error fetching ${key} debtors:`, error.message);
          results[key] = 0;
          continue;
        }

        const totalAmount = data.reduce(
          (sum, d) => sum + parseFloat(d.amount || 0),
          0
        );
        results[key] = totalAmount.toFixed(2);
      }

      setDebtorStats(results);
    };

    fetchDebtorsStats();
  }, [shop.id]);

  useEffect(() => {
    fetchDebtorsList(debtorFilter);
  }, [debtorFilter, shop.id]);

  const fetchDebtorsList = async (filter) => {
    if (!shop.id) return;

    const today = new Date();
    let fromDate;

    if (filter === "daily") {
      fromDate = new Date(today);
    } else if (filter === "weekly") {
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 6);
    } else if (filter === "monthly") {
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 29);
    }

    const fromISO = fromDate.toISOString().split("T")[0];
    const toISO = today.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("debtors")
      .select("id, customer_name, amount, due_date, created_at")
      .eq("shop_id", shop.id)
      .gte("created_at", `${fromISO}T00:00:00`)
      .lte("created_at", `${toISO}T23:59:59`)
      .order("due_date", { ascending: true });

    if (error) {
      console.error(`Failed to fetch ${filter} debtors:`, error.message);
      setDebtorsList([]);
      return;
    }

    setDebtorsList(data || []);
  };

  const { labels, values } = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) =>
      dayjs()
        .subtract(6 - i, "day")
        .format("MMM D")
    );

    const profitByDate = {};
    last7Days.forEach((date) => (profitByDate[date] = 0));

    sales.forEach((s) => {
      const day = dayjs(s.created_at).format("MMM D");
      if (profitByDate[day] !== undefined) {
        const costPrice = s.products?.cost_price ?? 0;
        const profit = (s.amount ?? 0) - costPrice * (s.quantity ?? 1);
        profitByDate[day] += profit;
      }
    });

    return {
      labels: last7Days,
      values: last7Days.map((d) => profitByDate[d]),
    };
  }, [sales]);

  return (
    <div className="shopstack-wrapper">
      <div className="dashboard-page">
        {/* Modern Header Implementation */}


        
        
        <div className="charts-row">
          {showSalesChart && (
            <div className="chart-card">
              <div className="chart-header">
                <span className="margin">Sales & Profit Overview (₦)</span>
                <div className="chart-toggle">
                  <button 
                    onClick={() => setChartType('bar')} 
                    className={chartType === 'bar' ? 'active' : ''}
                  >
                    Bar Chart
                  </button>
                  <button 
                    onClick={() => setChartType('line')} 
                    className={chartType === 'line' ? 'active' : ''}
                  >
                    Line Chart
                  </button>
                </div>
              </div>
              <div style={{ height: "400px" }}>
                <SalesChart
                  salesLabels={chartLabels}
                  salesValues={chartValues}
                  profitLabels={profitLabels}
                  profitValues={profitValues}
                  chartType={chartType}
                />
              </div>

              <div className="filters">
                {["daily", "weekly", "monthly"].map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={filter === key ? "active" : ""}
                  >
                    {key[0].toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showProfitChart && (
            <div className="chart-card">
              <span className="margin">Profit Distribution (Last 7 Days)</span>
              <div style={{ height: "500px" }}>
                <ProfitPieChart labels={labels} values={values} />
              </div>
            </div>
          )}
        </div>
     

        <div className="summary-cards">
          <div className="card sales">
            <h4>Total Sales</h4>
            <p>₦{chartValues.reduce((a, b) => a + b, 0).toLocaleString()}</p>
          </div>

          <div className="card expenses">
            <h4>Expenses</h4>
            <p>₦{parseFloat(total).toLocaleString()}</p>
          </div>

          <div className="card profits">
            <h4>Daily Profit</h4>
            <p>₦{parseFloat(realProfitStats.daily).toLocaleString()}</p>
          </div>

          <div className="card profits">
            <h4>Weekly Profit</h4>
            <p>₦{parseFloat(realProfitStats.weekly).toLocaleString()}</p>
          </div>

          <div className="card profits">
            <h4>Monthly Profit</h4>
            <p>₦{parseFloat(realProfitStats.monthly).toLocaleString()}</p>
          </div>

          <div className="card profits">
            <h4>Yearly Profit</h4>
            <p>₦{parseFloat(realProfitStats.yearly).toLocaleString()}</p>
          </div>
        </div>


        {lowStock.length > 0 && (
          <div className="dashboard-card low-stock-card">
            <h4 className="card-title">
              ⚠️ Low Stock Items
            </h4>
            <ul className="card-list">
              {lowStock.map((item) => (
                <li key={item.id} className="list-item warning">
                  <span className="item-name">{item.name}</span>
                  <span className="item-details">
                    {item.quantity} {item.form} left
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topProducts.length > 0 && (
          <div className="dashboard-card top-products-card">
            <h4 className="card-title">
              🔥 Top 5 Selling Products
            </h4>
            <ul className="card-list">
              {topProducts.map((p, i) => (
                <li key={i} className="list-item success">
                  <span className="item-name">{p.name}</span>
                  <span className="item-details">
                    {p.total} {p.form} sold
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="debtor-filter-buttons1">
          {["daily", "weekly", "monthly"].map((key) => (
            <button
              key={key}
              onClick={() => setDebtorFilter(key)}
              className={`debtor-btn1 ${debtorFilter === key ? "active" : ""}`}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <div className="debtors-table-section">
          <h5>
            {debtorFilter[0].toUpperCase() + debtorFilter.slice(1)} Debtor
            Details
          </h5>
          {debtorsList.length === 0 ? (
            <p>No debtors for {debtorFilter}.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount (₦)</th>
                  <th>Time Due</th>
                </tr>
              </thead>
              <tbody>
                {debtorsList.map((debtor) => (
                  <tr key={debtor.id}>
                    <td>{debtor.customer_name}</td>
                    <td>₦{parseFloat(debtor.amount).toLocaleString()}</td>
                    <td>{debtor.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}