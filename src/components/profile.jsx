import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import "../styles/profile.css";
import * as XLSX from "xlsx";
import Loading from "../components/Loading";
import { useShopStore } from "../store/shop-store";
import { 
  FaArrowLeft, FaEdit, FaKey, FaBuilding, FaDatabase, 
  FaMapMarkerAlt, FaPhone, FaUser, FaStore, FaCog, 
  FaBell, FaCalendar, FaUpload, FaTimes, FaDownload,
  FaEye, FaEyeSlash
} from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Profile() {
  const { user } = useAuthStore();
  const { shop, setShop } = useShopStore();

  const [profile, setProfile] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState({});
  const [tempShop, setTempShop] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const fileInputRef = useRef(null);

  // Fetch profile + shop
  useEffect(() => {
    if (!user || !shop?.id) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shop.id)
          .single();

        if (profileError) throw profileError;
        if (shopError) throw shopError;

        if (profileData) {
          setProfile(profileData);
          setTempProfile(profileData);
        }
        if (shopData) {
          setShopInfo(shopData);
          setTempShop(shopData);
        }
      } catch (error) {
        toast.error('Failed to load profile data');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, shop]);

  // Handle logo upload
  const handleLogoUpload = async (event) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(filePath);

      // Update shop with new logo URL
      const { error: updateError } = await supabase
        .from('shops')
        .update({ logo_url: publicUrl })
        .eq('id', shop.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setShopInfo(prev => ({ ...prev, logo_url: publicUrl }));
      setTempShop(prev => ({ ...prev, logo_url: publicUrl }));
      setShop({ ...shop, logo_url: publicUrl });
      
      toast.success('Logo updated successfully!');
    } catch (error) {
      toast.error('Error uploading logo: ' + error.message);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Remove logo
  const handleRemoveLogo = async () => {
    try {
      if (!shopInfo.logo_url) return;
      
      // Extract file path from URL
      const urlParts = shopInfo.logo_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('shop-logos')).join('/');
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('shop-logos')
        .remove([filePath]);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Update shop with null logo URL
      const { error: updateError } = await supabase
        .from('shops')
        .update({ logo_url: null })
        .eq('id', shop.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setShopInfo(prev => ({ ...prev, logo_url: null }));
      setTempShop(prev => ({ ...prev, logo_url: null }));
      setShop({ ...shop, logo_url: null });
      
      toast.success('Logo removed successfully!');
    } catch (error) {
      toast.error('Error removing logo: ' + error.message);
      console.error('Remove error:', error);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      toast.error("Error updating password: " + error.message);
      console.error('Password update error:', error);
    }
  };

  // Handle data export
const handleDataExport = async () => {
  setExporting(true);
  try {
    if (!shop?.id) {
      throw new Error("No active shop selected");
    }

    // Fetch shop data
    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shop.id)
      .single();
    if (shopError) throw shopError;

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shop.id);
    if (productsError) throw productsError;

    // Fetch sales
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .eq("shop_id", shop.id);
    if (salesError) throw salesError;

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("shop_id", shop.id);
    if (expensesError) throw expensesError;

    // Fetch debtors
    const { data: debtors, error: debtorsError } = await supabase
      .from("debtors")
      .select("*")
      .eq("shop_id", shop.id);
    if (debtorsError) throw debtorsError;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Add shop info (convert single object to array for sheet)
    if (shopData) {
      const shopSheet = XLSX.utils.json_to_sheet([shopData]);
      XLSX.utils.book_append_sheet(wb, shopSheet, "Shop");
    }

    // Add products
    if (products?.length) {
      const productSheet = XLSX.utils.json_to_sheet(products);
      XLSX.utils.book_append_sheet(wb, productSheet, "Products");
    }

    // Add sales
    if (sales?.length) {
      const salesSheet = XLSX.utils.json_to_sheet(sales);
      XLSX.utils.book_append_sheet(wb, salesSheet, "Sales");
    }

    // Add expenses
    if (expenses?.length) {
      const expenseSheet = XLSX.utils.json_to_sheet(expenses);
      XLSX.utils.book_append_sheet(wb, expenseSheet, "Expenses");
    }

    // Add debtors
    if (debtors?.length) {
      const debtorsSheet = XLSX.utils.json_to_sheet(debtors);
      XLSX.utils.book_append_sheet(wb, debtorsSheet, "Debtors");
    }

    // Generate safe filename
    const shopName = (shopData?.name || "shop")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const exportFileDefaultName = `shopstack_export_${shopName}_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;

    // Export the workbook
    XLSX.writeFile(wb, exportFileDefaultName);

    toast.success("Excel exported successfully!");
  } catch (error) {
    toast.error("Error exporting data: " + error.message);
    console.error("Export error:", error);
  } finally {
    setExporting(false);
  }
};
  // handle profile input
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // handle shop input
  const handleShopChange = (e) => {
    const { name, value } = e.target;
    setTempShop((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save both
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(tempProfile)
        .eq("id", user.id);

      const { error: shopError } = await supabase
        .from("shops")
        .update(tempShop)
        .eq("id", shop.id);

      if (profileError || shopError) {
        throw profileError || shopError;
      }

      toast.success("Profile updated successfully!");
      setProfile(tempProfile);
      setShopInfo(tempShop);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update. Please try again.");
      console.error('Update error:', error);
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setTempShop(shopInfo);
    setIsEditing(false);
    toast.info("Changes discarded");
  };
  if (loading) return <Loading />;
  // if (loading) return (
  //   <div className="profile-loading">
  //     <div className="loading-spinner"></div>
  //     <p>Loading profile...</p>
  //   </div>
  // );

  return (
    <div className="profile-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition:Bounce
      />
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <header className="profile-header">
        <div className="header-content">
          <a href="/shops" className="back-button">
            <FaArrowLeft /> Back to Shops
          </a>
          <div className="header-title">
            <h1>Profile Settings</h1>
            <p>Manage your account and shop information</p>
          </div>
        </div>
      </header>

      <div className="profile-content-wrapper">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-picture">
              <img
                src={shopInfo?.logo_url || "/default-logo.png"}
                alt="Shop Logo"
                onError={(e) => {
                  e.target.src = "/default-logo.png";
                }}
              />
              {isEditing && (
                <div className="logo-actions">
                  <button 
                    className="upload-btn"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : <><FaUpload /> Change</>}
                  </button>
                  {shopInfo?.logo_url && (
                    <button 
                      className="remove-btn"
                      onClick={handleRemoveLogo}
                    >
                      <FaTimes /> Remove
                    </button>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
            <div className="profile-info">
              <h2 className="output-text">{profile?.full_name || "Shop Owner"}</h2>
              <p className="role">Owner</p>
              <div className="shop-badge">
                <FaStore /> <span className="output-text">{shopInfo?.name || "ShopStack POS"}</span> 
              </div>
            </div>
          </div>

          <div className="sidebar-nav">
            <button 
              className={activeTab === "personal" ? "active" : ""}
              onClick={() => setActiveTab("personal")}
            >
              <FaUser /> Personal Info
            </button>
            <button 
              className={activeTab === "shop" ? "active" : ""}
              onClick={() => setActiveTab("shop")}
            >
              <FaStore /> Shop Info
            </button>
            <button 
              className={activeTab === "account" ? "active" : ""}
              onClick={() => setActiveTab("account")}
            >
              <FaCog /> Account Settings
            </button>
          </div>

          <div className="shop-details">
            <h3>Shop Details</h3>
            <div className="detail-item">
              <FaMapMarkerAlt /> 
              <span className="output-text">{shopInfo?.address || "No address provided"}</span>
            </div>
            <div className="detail-item">
              <FaPhone /> 
              <span>{shopInfo?.phone || "No phone number"}</span>
            </div>
            {/* <div className="shop-id">
              SHOP ID: #{shopInfo?.id || "N/A"}
            </div> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {activeTab === "personal" && (
            <div className="content-section">
              <div className="section-header">
                <h2><FaUser /> Personal Information</h2>
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <FaEdit /> Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={tempProfile.full_name || ""}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="disabled-field"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="email_notification"
                        checked={tempProfile.email_notification || false}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                      />
                      <span className="checkmark"></span>
                      Email Notifications
                    </label>
                  </div>
                  
                 <div className="form-group">
  <label>Trial Start Date</label>
  <div className="date-field">
    <FaCalendar />
    <span>
      {tempProfile.trial_start
        ? new Date(tempProfile.trial_start).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Not available"}
    </span>
  </div>
</div>

                  
                  <div className="form-group">
                    <label>Subscription End Date</label>
                    <div className="date-field">
                      <FaCalendar />
                      <span>{tempProfile.subscription_end || "Not available"}</span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="action-buttons">
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === "shop" && (
            <div className="content-section">
              <div className="section-header">
                <h2><FaStore /> Shop Information</h2>
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <FaEdit /> Edit Shop Info
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Shop Name</label>
                    <input
                      type="text"
                      name="name"
                      value={tempShop.name || ""}
                      onChange={handleShopChange}
                      disabled={!isEditing}
                      placeholder="Enter shop name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Shop Address</label>
                    <input
                      type="text"
                      name="address"
                      value={tempShop.address || ""}
                      onChange={handleShopChange}
                      disabled={!isEditing}
                      placeholder="Enter shop address"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={tempShop.phone || ""}
                      onChange={handleShopChange}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Shop Type</label>
                    <input
                      type="text"
                      name="type"
                      value={tempShop.type || ""}
                      onChange={handleShopChange}
                      disabled={!isEditing}
                      placeholder="e.g., Retail, Grocery"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Manager</label>
                    <input
                      type="text"
                      name="staff1"
                      value={tempShop.staff1 || ""}
                      onChange={handleShopChange}
                      disabled={!isEditing}
                      placeholder="Manager's name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Assistant</label>
                    <input
                      type="text"
                      name="staff2"
                      value={tempShop.staff2 || ""}
                      onChange={handleShopChange}
                      disabled={!isEditing}
                      placeholder="Assistant's name"
                    />
                  </div>
                  
                 <div className="form-group">
  <label>Date Created</label>
  <div className="date-field">
    <FaCalendar />
    <span>
      {tempShop.created_at
        ? new Date(tempShop.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Not available"}
    </span>
  </div>
</div>

                  
                 <div className="form-group">
  <label>Last Updated</label>
  <div className="date-field">
    <FaCalendar />
    <span>
      {tempShop.updated_at
        ? new Date(tempShop.updated_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Not available"}
    </span>
  </div>
</div>

                </div>

                {isEditing && (
                  <div className="action-buttons">
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === "account" && (
            <div className="content-section">
              <div className="section-header">
                <h2><FaCog /> Account Settings</h2>
              </div>

              <div className="account-cards">
                <div className="account-card">
                  <div className="card-icon">
                    <FaKey />
                  </div>
                  <h3>Change Password</h3>
                  <p>Update your account password for security</p>
                  <button 
                    className="card-btn"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Update Password
                  </button>
                </div>

                <div className="account-card">
                  <div className="card-icon">
                    <FaBuilding />
                  </div>
                  <h3>Switch Account</h3>
                  <p>Manage multiple shop accounts</p>
                  <button className="card-btn">Manage Accounts</button>
                </div>

                <div className="account-card">
                  <div className="card-icon">
                    <FaDatabase />
                  </div>
                  <h3>Export Data</h3>
                  <p>Download your shop data for backup</p>
                  <button 
                    className="card-btn"
                    onClick={handleDataExport}
                    disabled={exporting}
                  >
                    {exporting ? 'Exporting...' : <><FaDownload /> Export Data</>}
                  </button>
                </div>

                <div className="account-card">
                  <div className="card-icon">
                    <FaBell />
                  </div>
                  <h3>Notification Settings</h3>
                  <p>Customize how you receive alerts</p>
                  <button className="card-btn">Configure</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}