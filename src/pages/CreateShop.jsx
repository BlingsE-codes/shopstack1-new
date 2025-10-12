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
  "House or Property Owner",
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
      .single();

    if (error) {
      toast.error("Failed to create shop: " + error.message);
      return;
    }

    toast.success("Shop created successfully! 🚀");
    setShopName("");
    setShopAddress("");
    setShopType("");

    setTimeout(() => {
      navigate("/shops");
    }, 1000);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create New Shop or Property</h2>

        {/* General Instructions */}
        <div className="instruction-box">
          <h4>📋 Setup Instructions:</h4>
          <ul>
            <li>
              Fill in all fields to create your business profile (or Property
              Profile)
            </li>
            <li>
              Choose the option that best matches your business (Property) type
            </li>
            <li>
              You can create multiple shops or properties for different
              locations
            </li>
          </ul>
        </div>

        <input
          type="text"
          name="shop-name"
          placeholder="Enter Shop Name/Property Name (e.g., My Store, Wale House, Family Business)"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
        />

        <input
          type="text"
          name="shop-address"
          placeholder="Enter Physical Address or Location"
          value={shopAddress}
          onChange={(e) => setShopAddress(e.target.value)}
          required
        />

        <div className="select-container">
          <select
            name="shop-type"
            value={shopType}
            onChange={(e) => setShopType(e.target.value)}
            required
          >
            <option value="">Select Business Type</option>
            {shopTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Dynamic Instructions based on selection */}
          {shopType === "House or Property Owner" && (
            <div className="type-instruction">
              <strong>🏠 For House or Property Owners:</strong>
              <p>
                {" "}
                Perfect for managing residential properties, estates, and
                rentals. You'll be able to:
              </p>
              <ul>
                <li>Track rent payments and due dates</li>
                <li>Print and document lease agreements and receipts</li>
                <li>Manage tenant information and lease agreements</li>
                <li>Record maintenance requests and expenses</li>
                <li>Generate financial reports for your properties</li>
                <li>Keep all property-related data organized in one place</li>
              </ul>
            </div>
          )}

          {shopType === "POS Agent" && (
            <div className="type-instruction">
              <strong>💸 For POS Agents:</strong>
              <p>
                Optimized for cash-based transactions and liquidity management.
              </p>
            </div>
          )}

          {shopType === "Retail Store" && (
            <div className="type-instruction">
              <strong>🛍️ For Retail Stores:</strong>
              <p>
                Ideal for small to medium retail businesses with physical
                storefronts.
              </p>
            </div>
          )}

          {shopType === "E-commerce" && (
            <div className="type-instruction">
              <strong>🛒 For E-commerce:</strong>
              <p>
                Designed for online businesses with digital inventory
                management.
              </p>
            </div>
          )}

          {/* General type selection guidance */}
          {!shopType && (
            <div className="type-instruction">
              <strong>💡 Not sure which to choose?</strong>
              <ul>
                <li>
                  <strong>Retail Store:</strong> Physical store selling directly
                  to consumers
                </li>
                <li>
                  <strong>POS Agent:</strong> Mobile money or cash transaction
                  services
                </li>
                <li>
                  <strong>House Owner:</strong> Management of residential
                  properties
                </li>
                <li>
                  <strong>Wholesaler:</strong> Bulk selling to retailers
                </li>
                <li>
                  <strong>Service Provider:</strong> Service-based businesses
                </li>
                <li>
                  <strong>Other:</strong> Doesn't fit the categories? Choose
                  this
                </li>
              </ul>
            </div>
          )}
        </div>

        <button type="submit">Create Shop (or Property)</button>

        {/* Additional helpful tips */}
        <div className="help-tips">
          <p>
            <strong>Pro Tip:</strong> You can always edit these details later
            from your shop settings.
          </p>
        </div>
      </form>
    </div>
  );
}
