import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";
import dayjs from "dayjs";
import "../styles/Sales.css";

export default function Sales() {
  const { shop } = useShopStore();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: "", quantity: 1 });
  const [loading, setLoading] = useState(false);
  const [totalDailySales, setTotalDailySales] = useState(0);

  useEffect(() => {
    if (shop.id) {
      fetchProducts();
      fetchSales();
      fetchDailySales(); // ⬅️ Added this to calculate daily sales on load
    }
  }, [shop.id]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, selling_price, quantity")
      .eq("shop_id", shop.id);

    if (error) toast.error("Failed to load products");
    else setProducts(data);
  };

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*, products(name)")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load sales");
    else setSales(data);
  };

  const fetchDailySales = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("sales")
      .select("amount")
      .eq("shop_id", shop.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (error) {
      toast.error("Failed to fetch daily sales");
      return;
    }

    const total = data.reduce((sum, sale) => sum + sale.amount, 0);
    setTotalDailySales(total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const product = products.find((p) => p.id === form.product_id);
    if (!product || product.quantity < form.quantity) {
      toast.error("Insufficient stock");
      setLoading(false);
      return;
    }

    const amount = form.quantity * product.selling_price;
    const name = product.name;

    const { error: saleError } = await supabase.from("sales").insert([
      {
        product_id: form.product_id,
        quantity: form.quantity,
        amount,
        name,
        shop_id: shop.id,
      },
    ]);

    if (!saleError) {
      const newQty = product.quantity - form.quantity;
      await supabase.from("products").update({ quantity: newQty }).eq("id", product.id);
      toast.success("Sale recorded");
      fetchSales();
      fetchProducts();
      fetchDailySales(); // ⬅️ Recalculate today's sales after new sale
      setForm({ product_id: "", quantity: 1 });
    } else {
      toast.error("Failed to record sale");
    }

    setLoading(false);
  };

  return (
    <div className="sales-page">
      <div className="shop-info">
        <h2>{shop.name || "My Shop"}</h2>
        <p>Manage your sales here</p>
        <strong>Today’s Sales:</strong> ₦{parseFloat(totalDailySales).toLocaleString()}
      </div>

      <h2>Record a Sale</h2>
      <form onSubmit={handleSubmit} className="sale-form">
        <select
          name="product_id"
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (₦{parseFloat(p.selling_price).toLocaleString()}) - Stock: {p.quantity}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
          placeholder="Quantity"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Recording..." : "Add Sale"}
        </button>
      </form>

      <h3>Sales History</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{s.products?.name}</td>
              <td>{s.quantity}</td>
              <td>₦{parseFloat(s.amount).toLocaleString()}</td>
              <td>{dayjs(s.created_at).format("DD MMM, HH:mm")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
