import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";
import "../styles/expenses.css";
import { useShopStore } from "../store/shop-store";
import { useAuthStore } from "../store/auth-store";

export default function Expenses() {
  const { shop } = useShopStore();
  const { user } = useAuthStore();

  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [total, setTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Create ref for form section
  const formSectionRef = useRef(null);

  // Utility: add commas to numbers
  const formatWithCommas = (value) => {
    if (!value) return "";
    const onlyNums = value.replace(/\D/g, "");
    return onlyNums.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Utility: display nicely with ₦ and commas
  const formatCurrency = (num) => {
    if (!num) return "₦0";
    return "₦" + parseFloat(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (shop?.id) fetchExpenses();
  }, [shop?.id, page]);

  useEffect(() => {
    if (user?.id) fetchAdminStatus();
  }, [user?.id]);

  // Auto-scroll to form when expenses are added
  useEffect(() => {
    if (expenses.length > 0 && formSectionRef.current) {
      setTimeout(() => {
        formSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }, 100);
    }
  }, [expenses]);

  const fetchExpenses = async () => {
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Failed to load expenses");
    } else {
      setExpenses(data);
      setTotalExpenses(count || 0);
      calculateTotal(data);
    }
    setLoading(false);
  };

  const fetchAdminStatus = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single();

    if (data && !error) setIsAdmin(data.is_admin);
  };

  const fetchExpensesToday = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const { data, error, count } = await supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("shop_id", shop.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: false })
      .range(0, pageSize - 1);

    if (error) {
      toast.error("Error fetching today's expenses");
    } else {
      setExpenses(data);
      setTotalExpenses(count || 0);
      calculateTotal(data);
    }
    setLoading(false);
  };

  const calculateTotal = (data) => {
    const totalAmount = data.reduce(
      (acc, e) => acc + parseFloat(e.amount || 0),
      0
    );
    setTotal(totalAmount);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      setNewExpense({ ...newExpense, amount: formatWithCommas(value) });
    } else {
      setNewExpense({ ...newExpense, [name]: value });
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    const insertData = {
      title: newExpense.title,
      amount: Number(newExpense.amount.replace(/,/g, "")),
      shop_id: shop.id,
      user_id: user.id,
      is_admin: isAdmin,
    };

    const { error } = await supabase.from("expenses").insert([insertData]);

    if (error) {
      toast.error("Failed to add expense");
    } else {
      toast.success("Expense added!");
      setNewExpense({ title: "", amount: "" });
      fetchExpenses();
    }
    setSubmitting(false);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    // Update UI instantly
    setExpenses((prev) => {
      const updated = prev.filter((exp) => exp.id !== id);
      calculateTotal(updated);
      return updated;
    });

    // Then sync with DB
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete expense");
      // Rollback if delete failed
      await fetchExpenses();
    } else {
      toast.success("Expense deleted");
    }
  };

  const handleFilter = async () => {
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("shop_id", shop.id);

    if (fromDate && toDate) {
      if (new Date(fromDate) > new Date(toDate)) {
        toast.error("Start date must be before end date");
        setLoading(false);
        return;
      }
      query = query
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`);
    }

    if (search.trim() !== "") {
      query = query.ilike("title", `%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      toast.error("Error filtering expenses");
    } else {
      setExpenses(data);
      setTotalExpenses(count || 0);
      calculateTotal(data);
    }

    setLoading(false);
  };

  return (
    <div className="expenses-page">
      {/* Header Section */}
      <div className="expenses-header">
        <h1>Expense Management</h1>
        <div className="header-actions">
          <div className="search-box">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handleFilter} className="filter-btn">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(total)}</span>
            <span className="stat-label">Total Expenses</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{expenses.length}</span>
            <span className="stat-label">Number of Expenses</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">
              {fromDate && toDate ? `${fromDate} to ${toDate}` : "All Dates"}
            </span>
            <span className="stat-label">Date Range</span>
          </div>
        </div>
      </div>

      {/* Quick Expense Form */}
      <div className="quick-expense-form" ref={formSectionRef}>
        <h2>Add New Expense</h2>
        <form onSubmit={handleAddExpense}>
          <div className="form-grid">
            <div className="form-group">
              <label>Expense Title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter expense title"
                value={newExpense.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Amount (₦)</label>
              <input
                type="text"
                name="amount"
                placeholder="Enter amount"
                value={newExpense.amount}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <button type="submit" disabled={submitting} className="add-expense-btn">
                {submitting ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Date Filters */}
      <div className="filters-section">
        <h3>Filter Expenses</h3>
        <div className="filter-grid">
          <div className="form-group">
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button onClick={handleFilter} className="apply-filters-btn">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-section">
        <div className="section-header">
          <h3>Expenses List</h3>
          <div className="total-display">
            Total: {formatCurrency(total)}
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading expenses...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Date</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="no-data">
                        No expenses found.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id}>
                        <td>
                          {e.title.replace(/\b\w/g, (char) => char.toUpperCase())}
                        </td>
                        <td>{formatCurrency(e.amount)}</td>
                        <td>{new Date(e.created_at).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td>
                            <button 
                              onClick={() => handleDeleteExpense(e.id)}
                              className="delete-btn"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(totalExpenses / pageSize) || 1}
              </span>
              <button
                disabled={page * pageSize >= totalExpenses}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}