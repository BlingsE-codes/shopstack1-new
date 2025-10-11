import React, { useEffect, useState } from "react";
import "../styles/shops.css";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";

import NetworkErrorFallback from "../components/NetworkErrorFallback";
import Loading from "../components/Loading";

import {
  ShoppingCart,
  Settings,
  Truck,
  Users,
  Store,
  HandCoins,
  BarChart3,
  Plus,
  Edit3,
  Trash2,
  LogIn,
  MapPin,
  Phone,
  CreditCard,
  Home,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

export default function Shops() {
  const { user } = useAuthStore();
  const { setShop } = useShopStore();
  const [shops, setShops] = useState([]);
  const [editingShopId, setEditingShopId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    setError(false);

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", user.id);

    if (error) {
      setError(true);
      toast.error("Check your network and try again");
    } else {
      setShops(data || []);
    }

    setLoading(false);
  };

  const handleShopEntry = async (shop) => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shop.id)
      .single();

    if (error || !data) {
      toast.error("Failed to enter shop");
      navigate("/landing");
      return;
    }

    localStorage.setItem("shop_id", data.id);
    localStorage.setItem("shop_name", data.name);
    if (data.logo_url) localStorage.setItem("logo_url", data.logo_url);

    setShop(data);

    // Navigate based on shop type
    if (data.type === "POS Agent") {
      navigate(`/pospage/${data.id}`);

      } else if (data.type === "House Owner") {
        navigate(`/landlordoverview/${data.id}`);

    } else {
      navigate(`/shops/${data.id}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shop?")) return;

    const { error } = await supabase.from("shops").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete shop");
    } else {
      toast.success("Shop deleted successfully");
      fetchShops();
    }
  };

  const startEdit = (shop) => {
    setEditingShopId(shop.id);
    setFormValues({
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
    });
  };

  const cancelEdit = () => {
    setEditingShopId(null);
    setFormValues({ name: "", address: "", phone: "" });
  };

  const saveEdit = async () => {
    const { name, address, phone } = formValues;

    if (!name || !address || !phone) {
      toast.error("All fields are required");
      return;
    }

    const { error } = await supabase
      .from("shops")
      .update({ name, address, phone })
      .eq("id", editingShopId)
      .eq("owner_id", user.id);

    if (error) {
      toast.error("Failed to update shop");
    } else {
      toast.success("Shop updated successfully");
      setEditingShopId(null);
      fetchShops();
    }
  };

  if (loading) return <Loading />;
  if (error) return <NetworkErrorFallback retry={fetchShops} />;

  if (shops.length === 0) {
    return (
      <div className="shops-empty-state">
        {/* Background Elements */}
        <div className="empty-state-bg-elements">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>

        {/* Main Content */}
        <div className="empty-state-content">
          {/* Icon with Animation */}
          <div className="empty-icon-container">
            <div className="icon-glow"></div>
            <Store size={80} className="empty-icon" />
          </div>

          {/* Text Content */}
          <div className="empty-state-text">
            <h2>Welcome to Your Business Hub! 🚀</h2>
            <p className="empty-state-description">
              Create your first shop and unlock powerful tools to manage inventory, 
              track sales, and grow your business effortlessly.
            </p>
          </div>

          {/* Features Grid */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp size={24} />
              </div>
              <h4>Sales Tracking</h4>
              <p>Monitor your business performance in real-time</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={24} />
              </div>
              <h4>Customer Management</h4>
              <p>Keep track of your customers and their preferences</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h4>Secure & Reliable</h4>
              <p>Your data is safe with enterprise-grade security</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="empty-state-cta">
            <button 
              className="btn-primary create-shop-btn"
              onClick={() => navigate("/create-shop")}
            >
              <Plus size={20} />
              Create Your First Shop
              <Zap size={16} className="btn-sparkle" />
            </button>
            
            <p className="cta-subtext">
              Join thousands of businesses growing with ShopStack
            </p>
          </div>

          {/* Quick Tips */}
          <div className="quick-tips">
            <div className="tips-header">
              <Zap size={16} />
              <span>Get Started in Minutes</span>
            </div>
            <div className="tips-grid">
              <div className="tip-item">
                <div className="tip-number">1</div>
                <span>Add your shop details</span>
              </div>
              <div className="tip-item">
                <div className="tip-number">2</div>
                <span>Set up your inventory</span>
              </div>
              <div className="tip-item">
                <div className="tip-number">3</div>
                <span>Start managing sales</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    
    <div className="shops-container">
      {/* Navbar with Shopstack Logo */}

      {/* Header */}
      <div className="shops-header">
        <div className="shops-topbar">
          <h1 className="shops-title">My Shops</h1>
          <button
            className="btn-primary add-shop-btn"
            onClick={() => navigate("/create-shop")}
          >
            <Plus size={16} /> Add New Shop
          </button>
        </div>
        <p className="subtitle">Manage all your business locations easily</p>
      </div>

      {/* Grid */}
      <div className="shops-grid">
        {shops.map((shop) => (
          <div className="shop-card" key={shop.id}>
            {editingShopId === shop.id ? (
              <div className="shop-edit-form">
                <h3>Edit Shop</h3>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      name: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Shop name"
                />
                <input
                  type="text"
                  value={formValues.address}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      address: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Address"
                />
                <input
                  type="text"
                  value={formValues.phone}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Phone"
                />
                <div className="form-actions">
                  <button className="btn-primary" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
               <div className="shop-header">
  <Store className="shop-icon" />
  <div className="shop-title">
    <h3 className="output-text">{shop.name}</h3>

    {/* Dynamic badges for different shop types */}
    {shop.type === "POS Agent" && (
      <span className="pos-badge">
        <CreditCard size={12} /> POS
      </span>
    )}

    {shop.type === "Retail Store" && (
      <span className="retail-badge">
        🛍️ Retail
      </span>
    )}

    {shop.type === "Grocery Store" && (
      <span className="grocery-badge">
        🥦 Grocery
      </span>
    )}
     {shop.type === "House Owner" && (
      <span className="retail-badge">
        🛍️ Home
      </span>
    )}


    {shop.type === "Supermarket" && (
      <span className="supermarket-badge">
        🏬 Supermarket
      </span>
    )}

    {shop.type === "Warehouse" && (
      <span className="warehouse-badge">
        📦 Warehouse
      </span>
    )}

    {shop.type === "Wholesaler" && (
      <span className="wholesaler-badge">
        💼 Wholesale
      </span>
    )}

    {shop.type === "E-commerce" && (
      <span className="ecommerce-badge">
        🌐 E-commerce
      </span>
    )}

    {shop.type === "Service Provider" && (
      <span className="service-badge">
        🛠️ Service
      </span>
    )}

    {shop.type === "Logistics" && (
      <span className="logistics-badge">
        🚚 Logistics
      </span>
    )}

    {shop.type === "Other" && (
      <span className="other-badge">
        🏷️ Other
      </span>
    )}
  </div>
</div>

                <div className="shop-details">
                  <p  className="output-text">
                    <MapPin size={14} /> {shop.address}
                  </p>
                  {shop.phone && (
                    <p>
                      <Phone size={14} /> {shop.phone}
                    </p>
                  )}
                  <p className="shop-type">{shop.type}</p>
                </div>

                <div className="shop-features">
                  <ShoppingCart size={16} title="Sales" />
                  <Truck size={16} title="Inventory" />
                  <BarChart3 size={16} title="Reports" />
                  <Users size={16} title="Customers" />
                  <HandCoins size={16} title="Debtors" />
                  <Settings size={16} title="Settings" />
                </div>

                <div className="shop-actions">
                  <button
                    className="shops-btn-primary"
                    onClick={() => handleShopEntry(shop)}
                    title={`Enter ${shop.name}`}
                  >
                    <LogIn size={14} /> Enter
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => startEdit(shop)}
                    title="Edit shop details"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(shop.id)}
                    title="Delete shop"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}