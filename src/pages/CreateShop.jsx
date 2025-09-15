import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "../styles/createshop.css";

const shopTypes = [
  "Retail Store",
  "Grocery Store",
  "POS Agent",
  "Supermarket",
  "Warehouse",
  "Wholesaler",
  "E-commerce",
  "Service Provider",
  "Logistics",
  "Other",
];

export default function CreateShop() {
  const { user } = useAuthStore();
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopType, setShopType] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopName || !shopAddress || !shopType) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data, error } = await supabase
      .from("shops")
      .insert({
        name: shopName,
        address: shopAddress,
        owner_id: user.id,
        type: shopType,
      })
      .select()
      .single(); // fetch inserted shop back

    if (error) {
      toast.error("Failed to create shop: " + error.message);
      return;
    }

    toast.success("Shop created successfully! 🚀");
    setShopName("");
    setShopAddress("");
    setShopType("");

    // Route based on shop type
    setTimeout(() => {
      if (data?.type === "POS Agent") {
        navigate(`/Pospage`); // 👉 go to your new POS page
      } else {
        navigate("/shops"); // 👉 fallback to old existing page
      }
    }, 1000);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create New Shop</h2>

        <input
          type="text"
          name="shop-name"
          placeholder="Enter Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
        />

        <input
          type="text"
          name="shop-address"
          placeholder="Enter Shop Address"
          value={shopAddress}
          onChange={(e) => setShopAddress(e.target.value)}
          required
        />

        <select
          name="shop-type"
          value={shopType}
          onChange={(e) => setShopType(e.target.value)}
          required
        >
          <option value="">Select Shop Type</option>
          {shopTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <button type="submit">Create Shop</button>
      </form>
    </div>
  );
}
