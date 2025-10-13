import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/debtors.css";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";

export default function Debtors() {
  const { shop } = useShopStore();
  const [debtors, setDebtors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    amount: "",
    due_date: ""
  });

  // pagination state
  const [page, setPage] = useState(1);
  const [totalDebtors, setTotalDebtors] = useState(0);
  const limit = 5; // show 5 debtors per page

  // Currency formatter with K / M shorthand
  const formatCurrency = (num) => {
    if (!num && num !== 0) return "";
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return Number(num).toLocaleString();
  };

  const totalDebt = debtors
  .filter((d) => !d.is_paid)
  .reduce((sum, d) => sum + (d.amount || 0), 0);


  const fetchDebtors = async () => {
    // get total count
    const { count } = await supabase
      .from("debtors")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shop?.id);

    setTotalDebtors(count || 0);

    // fetch paginated debtors
    const { data, error } = await supabase
      .from("debtors")
      .select("*")
      .eq("shop_id", shop?.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) toast.error("Failed to load debtors");
    else setDebtors(data);
  };

  useEffect(() => {
    if (shop?.id) fetchDebtors();
  }, [shop, page]);

  // Helper to check if date is today
  const isToday = (dateStr) => {
    const today = new Date();
    const d = new Date(dateStr);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Sum today's debtors (only unpaid ones if needed)
  const todaysTotal = debtors
    .filter((d) => isToday(d.created_at) && !d.is_paid)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const addDebtor = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("debtors").insert([
        {
          ...formData,
          amount: parseFloat(formData.amount.replace(/,/g, "")), // store raw number
          shop_id: shop.id,
        },
      ]);

      if (error) {
        toast.error("Failed to add debtor: " + error.message);
      } else {
        toast.success("Debtor added");
        setFormData({ customer_name: "", phone: "", amount: "", due_date: "" });
        fetchDebtors();
      }
    } catch (err) {
      toast.error("Unexpected error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markAsPaid = async (id) => {
    const { error } = await supabase
      .from("debtors")
      .update({ is_paid: true })
      .eq("id", id);
    if (error) toast.error("Failed to mark as paid");
    else {
      toast.success("Marked as paid");
      fetchDebtors();
    }
  };

  const deleteDebtor = async (id) => {
    const { error } = await supabase.from("debtors").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Debtor removed");
      fetchDebtors();
    }
  };

  return (
    <div className="shopstack-wrapper">
      <div className="debtors-page">
        <div className="debtors-info">

          <div className="stock-summary">
            <div className="summary-card">
            <strong>Today’s Debtors:</strong> ₦{todaysTotal.toLocaleString()}
          </div>
          <div className="summary-card">
      <strong>Total Debt:</strong> ₦{totalDebt.toLocaleString()}
    </div>
        </div>
      </div>
     
<div className="debtor-form-container">
    <h1>Add a new Debtors</h1>
      <form onSubmit={addDebtor} className="debtor-form">
        <input
          type="text"
          placeholder="Customer Name"
          value={formData.customer_name}
          onChange={(e) =>
            setFormData({ ...formData, customer_name: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input
          type="text"
          placeholder="Amount (₦)"
          value={formData.amount}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/,/g, "");
            if (!isNaN(rawValue) && rawValue !== "") {
              setFormData({
                ...formData,
                amount: Number(rawValue).toLocaleString(),
              });
            } else {
              setFormData({ ...formData, amount: "" });
            }
          }}
          required
        />
        <input
          type="date"
          value={formData.due_date}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Debtor"}
        </button>
      </form>
      </div>

      <ul className="debtor-list">
        {debtors.map((debtor) => (
          <li key={debtor.id} className={debtor.is_paid ? "paid" : ""}>
            <div>
              {debtor.customer_name.replace(/\b\w/g, (c) => c.toUpperCase())} is
              owing ₦{formatCurrency(debtor.amount)}{" "}
              <span>since</span>
              {debtor.due_date && (
                <em>(Due: {new Date(debtor.due_date).toDateString()})</em>
              )}
            </div>
            <div className="debtor-actions">
              {!debtor.is_paid && (
                <button onClick={() => markAsPaid(debtor.id)}>
                  Mark as Paid
                </button>
              )}
              <button onClick={() => deleteDebtor(debtor.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* pagination controls */}
      {totalDebtors > limit && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(totalDebtors / limit)}
          </span>
          <button
            disabled={page >= Math.ceil(totalDebtors / limit)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
