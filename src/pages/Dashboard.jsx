import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/Dashboard.css";
import { useShopStore } from "../store/shop-store";
import SalesChart from "../components/SalesChart";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";

export default function Dashboard() {
  const { shop } = useShopStore();
  const { user } = useAuthStore();

  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [expenses, setExpenses] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [realProfits, setRealProfits] = useState(0);
  const [showSalesChart, setShowSalesChart] = useState(true);
  const [showProfitChart, setShowProfitChart] = useState(true);

  const [realProfitStats, setRealProfitStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [realProfitLabels, setRealProfitLabels] = useState([]);
  const [realProfitValues, setRealProfitValues] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!shop.id) return;
    fetchDashboardStats();
    fetchLowStockItems();
    fetchTopProducts();
    fetchExpenses();
  }, [filter, shop.id]);

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

    const { data: sales, error } = await supabase
      .from("sales")
      .select("amount, created_at")
      .eq("shop_id", shop.id)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

    if (error) {
      console.error("Error fetching sales:", error.message);
      return;
    }

    const grouped = {};
    sales?.forEach((sale) => {
      const dateKey = new Date(sale.created_at).toLocaleDateString();
      if (!grouped[dateKey]) grouped[dateKey] = 0;
      grouped[dateKey] += sale.amount;
    });

    const labels = Object.keys(grouped).sort();
    const values = labels.map((label) => grouped[label]);

    setChartLabels(labels);
    setChartValues(values);
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
    const totalAmount = data.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    setTotal(totalAmount.toFixed(2));
    setLoading(false);
  };

  const fetchLowStockItems = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("name, quantity")
      .eq("shop_id", shop.id)
      .lt("quantity", 5);

    if (data) {
      setLowStock(data);
    } else {
      console.error("Failed to fetch low stock items:", error);
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
          const realProfitPerItem = sale.amount - (product.cost_price * sale.quantity);
          totalRealProfit += realProfitPerItem;
        }
      });

      // Filter Expenses within date range
      const filteredExpenses = expenses.filter((expense) => {
        const expDate = new Date(expense.created_at).toISOString().split("T")[0];
        return expDate >= fromDate && expDate <= toDate;
      });
      const expensesSum = filteredExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

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
            const realProfitPerItem = sale.amount - (product.cost_price * sale.quantity);
            totalRealProfit += realProfitPerItem;
          }
        });

        // Filter Expenses within date range
        const filteredExpenses = expenses.filter((expense) => {
          const expDate = new Date(expense.created_at).toISOString().split("T")[0];
          return expDate >= fromISO && expDate <= toISO;
        });
        const expensesSum = filteredExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

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
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("sales")
      .select("quantity, products(name)")
      .eq("shop_id", shop.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (data) {
      const grouped = {};
      data.forEach(({ products, quantity }) => {
        const productName = products?.name || "Unknown";
        if (!grouped[productName]) grouped[productName] = 0;
        grouped[productName] += quantity;
      });

      const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
      setTopProducts(sorted.slice(0, 5));
    } else {
      console.error("Failed to fetch top products:", error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-info">
        {shop.logo_url && <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />}
        <h2>{shop.name || "Shop"}</h2>
        <p>Welcome to your dashboard!</p>
      </div>

      <div className="filters">
        {["daily", "weekly", "monthly"].map((key) => (
          <button key={key} onClick={() => setFilter(key)} className={filter === key ? "active" : ""}>
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div className="chart-toggles">
        <button onClick={() => setShowSalesChart((prev) => !prev)}>
          {showSalesChart ? "Hide Sales Chart" : "Show Sales Chart"}
        </button>
        <button onClick={() => setShowProfitChart((prev) => !prev)}>
          {showProfitChart ? "Hide Profit Histogram" : "Show Profit Histogram"}
        </button>
      </div>
      <span className="margin">Sales Margin (₦)</span>
      {showSalesChart && <SalesChart labels={chartLabels} values={chartValues} chartType="line" />}<br></br>
      <span className="margin">Profit Margin (₦)</span>
      {showProfitChart && <SalesChart labels={realProfitLabels} values={realProfitValues} chartType="bar" />}

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
        <div className="low-stock-section">
          <h4>⚠️ Low Stock Items</h4>
          <ul>
            {lowStock.map((item) => (
              <li key={item.name}>{item.name} — {item.quantity} left</li>
            ))}
          </ul>
        </div>
      )}

      {topProducts.length > 0 && (
        <div className="top-products-section">
          <h4>🔥 Top Selling Products Today</h4>
          <ul>
            {topProducts.map(([name, qty]) => (
              <li key={name}>{name}: {qty} sold</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
