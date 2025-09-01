import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import "../styles/settings.css";

export default function Settings() {
  const { user } = useAuthStore();
  const shop_id = localStorage.getItem("shop_id");

  const [profile, setProfile] = useState(null);
  const [shop, setShop] = useState({ name: "", address: "" });
  const [newPassword, setNewPassword] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Profile Data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, logo_url, is_admin")
          .eq("auth_id", user.id)
          .eq("shop_id", shop_id)
          .single();

        // Fetch Shop Data
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("name, address")
          .eq("id", shop_id)
          .single();

        // Fetch All Users for this Shop
        const { data: userData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, is_admin")
          .eq("shop_id", shop_id);

        if (profileError || shopError || usersError) {
          console.error(profileError || shopError || usersError);
          toast.error("Failed to load settings data");
          return;
        }

        setProfile(profileData);
        setShop({ name: shopData.name || "", address: shopData.address || "" });
        setUsers(userData || []);
      } catch (err) {
        console.error(err);
        toast.error("Unexpected error occurred");
      }
    };

    fetchData();
  }, [user, shop_id]);

  const handleUpdateShop = async () => {
    const { error } = await supabase
      .from("shops")
      .update({ name: shop.name, address: shop.address })
      .eq("id", shop_id);

    if (error) {
      toast.error("Failed to update shop info");
    } else {
      toast.success("Shop info updated!");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setNewPassword("");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error("Please select a logo first.");
      return;
    }

    setUploading(true);

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `shop-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("shop-logos").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ logo_url: publicUrl })
      .eq("auth_id", user.id)
      .eq("shop_id", shop_id);

    if (updateError) {
      toast.error("Failed to save logo URL");
    } else {
      toast.success("Logo updated!");
      setProfile((prev) => ({ ...prev, logo_url: publicUrl }));
      setLogoFile(null);
      setPreviewURL(null);
    }

    setUploading(false);
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !isAdmin })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update user role");
    } else {
      toast.success("User role updated!");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_admin: !isAdmin } : u
        )
      );
    }
  };

  const handleRemoveUser = async (userId) => {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) {
      toast.error("Failed to remove user");
    } else {
      toast.success("User removed!");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* Shop Info */}
      <div className="settings-section">
        <h3>Shop Info</h3>
        <input
          type="text"
          placeholder="Shop Name"
          value={shop.name}
          onChange={(e) => setShop((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Shop Address"
          value={shop.address}
          onChange={(e) => setShop((prev) => ({ ...prev, address: e.target.value }))}
        />
        <button onClick={handleUpdateShop}>Update Shop Info</button>
      </div>

      {/* Change Logo */}
      <div className="settings-section">
        <h3>Shop Logo</h3>
        {profile?.logo_url && (
          <div className="logo-preview">
            <img src={profile.logo_url} alt="Current Logo" />
          </div>
        )}
        {previewURL && (
          <div className="logo-preview">
            <img src={previewURL} alt="New Logo Preview" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleLogoChange} />
        <button onClick={handleLogoUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Logo"}
        </button>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleChangePassword}>Update Password</button>
      </div>

      {/* Manage Users */}
      <div className="settings-section">
        <h3>Manage Users</h3>
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.id}>
              {u.full_name} - {u.is_admin ? "Admin" : "User"}
              <div>
                <button
                  onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                >
                  {u.is_admin ? "Revoke Admin" : "Make Admin"}
                </button>
                <button onClick={() => handleRemoveUser(u.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
