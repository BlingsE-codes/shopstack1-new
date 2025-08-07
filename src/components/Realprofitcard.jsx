import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";

export default function RealProfitCard({ filter }) {
  const { shop } = useShopStore();
  const [realProfit, setRealProfit] = useState(0);

  useEffect(() => {
    if (!shop.id) return;
    fetchRealProfit();
  }, [shop.id, filter]);

  const fetchRealProfit = async () => {
    let fromDate, toDate;
    const today = new Date();

    if (filter === "daily") {
      fromDate = new Date().toISOString().split("T")[0];
      toDate = fromDate;
    } else if (filter === "weekly") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      fromDate = start.toISOString().split("T")[0];
      toDate = new Date().toISOString().split("T")[0];
    } else {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      fromDate = start.toISOString().split("T")[0];
      toDate = new Date().toISOString().split("T")[0];
    }

    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("amount, product_id, quantity")
      .eq("shop_id", shop.id)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

    if (salesError) {
      console.error("Failed to fetch sales:", salesError.message);
      toast.error("Failed to load sales data");
      return;
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, cost_price")
      .eq("shop_id", shop.id);

    if (productsError) {
      console.error("Failed to fetch products:", productsError.message);
      toast.error("Failed to load product data");
      return;
    }

    let totalRealProfit = 0;

    sales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.product_id);
      if (product) {
        const realProfitPerItem = sale.amount - (product.cost_price * sale.quantity);
        totalRealProfit += realProfitPerItem;
      }
    });

    setRealProfit(totalRealProfit.toFixed(2));
  };

  return (
    <div className="card real-profit">
      <h4>Real Profit</h4>
      <p>₦{parseFloat(realProfit).toLocaleString()}</p>
    </div>
  );
}
