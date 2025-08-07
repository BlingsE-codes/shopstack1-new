import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";
import "../styles/profile.css";

export default function Profile() {
  const { user } = useAuthStore();
  const { shop, setShop } = useShopStore();

  const [currentShop, setCurrentShop] = useState(shop);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

  useEffect(() => {
    if (shop?.id) {
      setCurrentShop(shop);
    }
  }, [shop]);

  useEffect(() => {
    if (previewURL) {
      console.log("Preview URL Updated:", previewURL);
    }
  }, [previewURL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentShop((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const uploadLogoToSupabase = async () => {
    if (!logoFile || !shop?.id) return null;

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${shop.id}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (uploadError) {
      toast.error("Logo upload failed: " + uploadError.message);
      return null;
    }

    const { data, error: urlError } = supabase.storage
      .from("shop-logos")
      .getPublicUrl(filePath);

    if (urlError || !data?.publicUrl) {
      toast.error("Failed to get logo URL");
      return null;
    }

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!shop?.id) {
      toast.error("Shop ID not found!");
      return;
    }

    setSaving(true);

    try {
      let logoUrl = currentShop.logo_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogoToSupabase();
        if (uploadedUrl) {
          logoUrl = `${uploadedUrl}?t=${Date.now()}`; // Cache busting
        }
      }

      const { data, error } = await supabase
        .from("shops")
        .update({
          name: currentShop.name,
          address: currentShop.address,
          phone: currentShop.phone,
          staff1: currentShop.staff1,
          staff2: currentShop.staff2,
          logo_url: logoUrl || null,
          updated_at: new Date(),
        })
        .eq("id", shop.id)
        .select()
        .single();

      if (error) {
        toast.error("Failed to save changes");
        console.error("Update error:", error);
        return;
      }

      setShop(data);
      toast.success("Profile updated successfully!");
      setEditing(false);
      setLogoFile(null);
      setPreviewURL(null);
    } catch (err) {
      console.error("Unexpected save error:", err);
      toast.error("Unexpected error during save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentShop(shop);
    setEditing(false);
    setLogoFile(null);
    setPreviewURL(null);
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      {[
        { label: "Shop Name", name: "name" },
        { label: "Shop Address", name: "address" },
        { label: "Phone", name: "phone" },
        { label: "Staff 1", name: "staff1" },
        { label: "Staff 2", name: "staff2" },
      ].map((field) => (
        <div className="detail-row" key={field.name}>
          <label>{field.label}:</label>
          {editing ? (
            <input
              type="text"
              name={field.name}
              value={currentShop?.[field.name] || ""}
              onChange={handleChange}
            />
          ) : (
            <span>{currentShop?.[field.name]}</span>
          )}
        </div>
      ))}

      <div className="detail-row">
        <label>Shop Logo:</label>
        {editing ? (
          <>
            {previewURL ? (
              <img src={previewURL} alt="Preview" className="logo-preview" />
            ) : currentShop?.logo_url ? (
              <img
                src={currentShop.logo_url}
                alt="Current Logo"
                className="logo-preview"
              />
            ) : (
              <span>No logo uploaded</span>
            )}
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </>
        ) : currentShop?.logo_url ? (
          <img
            src={currentShop.logo_url}
            alt="Shop Logo"
            className="logo-preview"
          />
        ) : (
          <span>No logo uploaded</span>
        )}
      </div>

      <div className="btn-group">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}
