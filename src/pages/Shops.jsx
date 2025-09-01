import React, { useEffect, useState } from "react";
import "../styles/shops.css";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { supabase } from "../services/supabaseClient";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ShoppingCart,
  Settings,
  Truck,
  Users,
  Store,
  HandCoins,
  BarChart3,
  Power,
  Plus,
  Edit3,
  Trash2,
  LogIn,
  MapPin,
  Phone
} from "lucide-react";
import Loading from "../components/Loading";

export default function Shops() {
  const { user } = useAuthStore();
  const { setShop } = useShopStore();
  const [shops, setShops] = useState([]);
  const [editingShopId, setEditingShopId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", user.id);

    if (error) toast.error("Failed to fetch shops");
    else setShops(data);

    setLoading(false);
  };

  const handleShopEntry = async (shopId) => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
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
    navigate(`/shops/${shopId}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shop?")) return;

    const { error } = await supabase.from("shops").delete().eq("id", id);
    if (error) toast.error("Failed to delete shop");
    else {
      toast.success("Shop deleted successfully");
      fetchShops();
    }
  };

  const startEdit = (shop) => {
    setEditingShopId(shop.id);
    setEditName(shop.name);
    setEditAddress(shop.address);
    setEditPhoneNumber(shop.phone);
  };

  const cancelEdit = () => {
    setEditingShopId(null);
    setEditName("");
    setEditAddress("");
    setEditPhoneNumber("");
  };

  const saveEdit = async () => {
    if (!editName || !editAddress || !editPhoneNumber) {
      toast.error("All fields are required");
      return;
    }

    const { error } = await supabase
      .from("shops")
      .update({ name: editName, address: editAddress, phone: editPhoneNumber })
      .eq("id", editingShopId)
      .eq("owner_id", user.id);

    if (error) toast.error("Failed to update shop");
    else {
      toast.success("Shop updated successfully");
      setEditingShopId(null);
      fetchShops();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  if (loading) return <Loading />;
   // not logged in → go to landing
  // if (!user) {
  //   return <Navigate to="/landing" replace />;
  // }


  if (shops.length === 0) {
    return (
      <div className="shops-empty-state">
        <Store size={60} className="empty-icon" />
        <h2>No Shops Yet</h2>
        <p>Create your first shop to start managing your business</p>
        <button className="btn-primary" onClick={() => navigate("/create-shop")}>
          <Plus size={18} /> Create Your First Shop
        </button>
      </div>
    );
  }

  return (
    <div className="shops-container">
      {/* Header */}
      <div className="shops-header">
        <div className="top-shop">
        <div>
          <h1>My Shops</h1>
          <p className="subtitle">Manage all your business locations easily</p>
        </div>
      
     

      {/* Actions */}
      <div className="shops-actions">
        <button className="btn-primary" onClick={() => navigate("/create-shop")}>
          <Plus size={18} /> Add New Shop
        </button>
      </div>
      </div>
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Shop name"
                />
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Address"
                />
                <input
                  type="text"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  placeholder="Phone"
                />
                <div className="form-actions">
                  <button className="btn-primary" onClick={saveEdit}>Save</button>
                  <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="shop-header">
                  <Store className="shop-icon" />
                  <h3>{shop.name}</h3>
                </div>

                <div className="shop-details">
                  <p><MapPin size={14} /> {shop.address}</p>
                  {shop.phone && <p><Phone size={14} /> {shop.phone}</p>}
                </div>

                <div className="shop-features">
                  <ShoppingCart size={16} /> 
                  <Truck size={16} /> 
                  <BarChart3 size={16} /> 
                  <Users size={16} /> 
                  <HandCoins size={16} /> 
                  <Settings size={16} />
                </div>

                <div className="shop-actions">
                  <button className="btn-primary" onClick={() => handleShopEntry(shop.id)}>
                    <LogIn size={14} /> Enter
                  </button>
                  <button className="btn-secondary" onClick={() => startEdit(shop)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(shop.id)}>
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
