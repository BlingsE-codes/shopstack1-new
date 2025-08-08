import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/Debtors.css";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";

export default function Debtors() {
  const { shop } = useShopStore();
  const [debtors, setDebtors] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    amount: "",
    due_date: ""
  });

  const fetchDebtors = async () => {
    const { data, error } = await supabase
      .from("debtors")
      .select("*")
      .eq("shop_id", shop?.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load debtors");
    else setDebtors(data);
  };

  useEffect(() => {
    if (shop?.id) fetchDebtors();
  }, [shop]);

  const addDebtor = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from("debtors").insert([
      { ...formData, amount: parseFloat(formData.amount), shop_id: shop.id }
    ]);
    if (error) toast.error("Failed to add debtor, Confirm if you filled the Due date");
    else {
      toast.success("Debtor added");
      setFormData({ customer_name: "", phone: "", amount: "", due_date: "" });
      fetchDebtors();
    }
  };

  const markAsPaid = async (id) => {
    const { error } = await supabase.from("debtors").update({ is_paid: true }).eq("id", id);
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
    <div className="debtors-container">
      <h2>Debtors List</h2>
      <form onSubmit={addDebtor} className="debtor-form">
        <input
          type="text"
          placeholder="Customer Name"
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <input
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        />
        <button type="submit">Add Debtor</button>
      </form>

      <ul className="debtor-list">
        {debtors.map((debtor) => (
          <li key={debtor.id} className={debtor.is_paid ? "paid" : ""}>
            <div>
              <strong>{debtor.customer_name}</strong> owes ₦{debtor.amount}{" "}
              {debtor.due_date && <em>(Due: {new Date(debtor.due_date).toDateString()})</em>}
            </div>
            <div className="debtor-actions">
              {!debtor.is_paid && (
                <button onClick={() => markAsPaid(debtor.id)}>Mark as Paid</button>
              )}
              <button onClick={() => deleteDebtor(debtor.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
