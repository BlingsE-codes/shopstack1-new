import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Loading from "../components/Loading";
import { 
  FaSearch, FaFilter, FaDownload, FaUser, 
  FaPhone, FaEnvelope, FaHome, FaMoneyBillWave,
  FaExclamationTriangle, FaCheckCircle, FaHistory,
  FaEye, FaEdit, FaTrash, FaPlus, FaSpinner, FaSync,
  FaIdCard, FaCopy
} from 'react-icons/fa';
import "../styles/landlordtenantmanagement.css";

const TenantManagement = () => {
  const { shopId } = useParams();
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [apartmentFilter, setApartmentFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Generate unique tenant ID
  const generateTenantId = useCallback(async (shopId, tenantName) => {
    try {
      // Get current year and month for the prefix
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Create base from tenant name initials
      const initials = tenantName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 3);
      
      const baseId = `Tnt-${shopId.slice(-4)}-${initials}-${year}${month}`;
      
      // Check if this base ID already exists and find the next sequence
      const { data: existingTenants } = await supabase
        .from('landlord_tenants')
        .select('tenant_id')
        .ilike('tenant_id', `${baseId}%`);
      
      let sequence = 1;
      if (existingTenants && existingTenants.length > 0) {
        const existingSequences = existingTenants.map(t => {
          const match = t.tenant_id?.match(/-(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
        sequence = Math.max(...existingSequences) + 1;
      }
      
      return `${baseId}-${sequence.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating tenant ID:', error);
      // Fallback ID generation
      const timestamp = Date.now().toString(36).slice(-6).toUpperCase();
      const random = Math.random().toString(36).slice(-3).toUpperCase();
      return `Tnt-${timestamp}-${random}`;
    }
  }, []);

  // Alternative simpler ID generation (uncomment if you prefer this)
  const generateSimpleTenantId = (shopId, tenantName) => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const initials = tenantName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
    const random = Math.random().toString(36).slice(-4).toUpperCase();
    
    return `T${shopId.slice(-3)}${initials}${timestamp.slice(-4)}${random}`;
  };

  const formatNaira = (value) => {
    const amount = Number(value);
    if (isNaN(amount)) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number input with commas
  const formatNumberInput = (value) => {
    // Remove all non-digit characters
    const numbersOnly = value.replace(/\D/g, '');
    // Format with commas
    return numbersOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted number back to raw number
  const parseFormattedNumber = (formattedValue) => {
    return formattedValue.replace(/,/g, '');
  };

  // Capitalize first letter of each word
  const capitalizeFirstLetters = (text) => {
    if (!text) return '';
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  // Fetch tenants from Supabase
  const fetchTenants = useCallback(async () => {
    if (!shopId) {
      setError("No Shop Id Provided");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching Tenants For Shop:", shopId);
      
      const { data, error } = await supabase
        .from('landlord_tenants')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error Details:", error);
        throw error;
      }

      console.log("Tenants Data Received:", data);
      setTenants(data || []);
      setFilteredTenants(data || []);
    } catch (error) {
      console.error('Full Error:', error);
      setError('Error Fetching Tenants: ' + error.message);
      toast.error('Error Fetching Tenants: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Filter tenants based on search and filters
  useEffect(() => {
    let results = tenants;
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(tenant => 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.tenant_id && tenant.tenant_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tenant.contact_phone && tenant.contact_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tenant.contact_email && tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tenant.next_of_kin_name && tenant.next_of_kin_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tenant.guarantor_name && tenant.guarantor_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(tenant => tenant.payment_status === statusFilter);
    }
    
    // Apply apartment type filter
    if (apartmentFilter !== 'all') {
      results = results.filter(tenant => tenant.apartment_type === apartmentFilter);
    }
    
    setFilteredTenants(results);
  }, [searchTerm, statusFilter, apartmentFilter, tenants]);

  const handleViewTenant = (tenant) => {
    setSelectedTenant(tenant);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTenant(null);
  };

  const handleExportData = () => {
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = [
      'Tenant Id', 'Name', 'Phone', 'Email', 'Apartment Type', 'Rooms', 
      'Payment Status', 'Rent Amount', 'Next Of Kin', 'Guarantor'
    ].map(escapeCsvValue).join(',');

    const rows = filteredTenants.map(tenant => [
      tenant.tenant_id || 'N/A',
      capitalizeFirstLetters(tenant.name),
      tenant.contact_phone || '',
      tenant.contact_email || '',
      capitalizeFirstLetters(tenant.apartment_type),
      tenant.rooms_occupied,
      capitalizeFirstLetters(tenant.payment_status),
      tenant.rent_amount,
      tenant.next_of_kin_name ? `${capitalizeFirstLetters(tenant.next_of_kin_name)} (${capitalizeFirstLetters(tenant.next_of_kin_relationship || '')})` : '',
      tenant.guarantor_name ? `${capitalizeFirstLetters(tenant.guarantor_name)} (${tenant.guarantor_phone || ''})` : ''
    ].map(escapeCsvValue).join(','));

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tenants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Tenant Data Exported Successfully');
  };

  const handleSaveTenant = async (tenantData) => {
    setIsSaving(true);
    try {
      let finalTenantData = { ...tenantData };

      // Capitalize first letters of text fields
      finalTenantData.name = capitalizeFirstLetters(finalTenantData.name);
      finalTenantData.next_of_kin_name = capitalizeFirstLetters(finalTenantData.next_of_kin_name);
      finalTenantData.next_of_kin_relationship = capitalizeFirstLetters(finalTenantData.next_of_kin_relationship);
      finalTenantData.guarantor_name = capitalizeFirstLetters(finalTenantData.guarantor_name);
      finalTenantData.guarantor_relationship = capitalizeFirstLetters(finalTenantData.guarantor_relationship);
      finalTenantData.apartment_type = capitalizeFirstLetters(finalTenantData.apartment_type);
      finalTenantData.payment_status = capitalizeFirstLetters(finalTenantData.payment_status);

      // Parse formatted rent amount
      if (finalTenantData.rent_amount) {
        finalTenantData.rent_amount = parseFormattedNumber(finalTenantData.rent_amount);
      }

      // Generate tenant ID only for new tenants
      if (!tenantData.id) {
        const tenantId = await generateTenantId(shopId, finalTenantData.name);
        finalTenantData.tenant_id = tenantId;
        finalTenantData.created_at = new Date().toISOString();
      }

      finalTenantData.shop_id = shopId;
      finalTenantData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('landlord_tenants')
        .upsert(finalTenantData)
        .select();

      if (error) {
        throw error;
      }

      if (tenantData.id) {
        // Update existing tenant
        setTenants(tenants.map(t => t.id === tenantData.id ? data[0] : t));
        toast.success('Tenant Updated Successfully');
      } else {
        // Add new tenant
        setTenants([data[0], ...tenants]);
        toast.success(`Tenant Added Successfully! Tenant Id: ${finalTenantData.tenant_id}`);
      }

      setShowModal(false);
    } catch (error) {
      toast.error('Error Saving Tenant: ' + error.message);
      console.error('Supabase Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are You Sure You Want To Delete This Tenant?')) return;

    try {
      const { error } = await supabase
        .from('landlord_tenants')
        .delete()
        .eq('id', tenantId);

      if (error) {
        throw error;
      }

      setTenants(tenants.filter(t => t.id !== tenantId));
      toast.success('Tenant Deleted Successfully');
    } catch (error) {
      toast.error('Error Deleting Tenant: ' + error.message);
      console.error('Supabase Error:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Tenant Id Copied To Clipboard!');
    }).catch(() => {
      toast.error('Failed To Copy To Clipboard');
    });
  };

  // if (loading) {
  //   return (
  //     <div className="loading-container">
  //       <FaSpinner className="spinner" />
  //       <p>Loading Tenant Data...</p>
  //     </div>
  //   );
  // }

    if (loading) return <Loading />;
    
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <FaExclamationTriangle className="error-icon" />
          <h3>Error Loading Tenants</h3>
          <p>{error}</p>
          <button className="btn landlord-btn-primary" onClick={fetchTenants}>
            <FaSync /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-management">
      <div className="tenant-header">
        <h1><FaUser /> Tenant Management</h1>
        <p>Manage All Tenants For Your Property</p>
      </div>

      <div className="search-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search Tenants By Id, Name, Phone, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label><FaMoneyBillWave /> Payment Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="filter-item">
            <label><FaHome /> Apartment Type</label>
            <select value={apartmentFilter} onChange={(e) => setApartmentFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="studio">Studio</option>
              <option value="1-bedroom">1-Bedroom</option>
              <option value="2-bedroom">2-Bedroom</option>
              <option value="3-bedroom">3-Bedroom</option>
            </select>
          </div>

          <button className="btn landlord-btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Tenant
          </button>

          <button 
            className="btn btn-success" 
            onClick={handleExportData}
            disabled={filteredTenants.length === 0}
          >
            <FaDownload /> Export
          </button>
        </div>
      </div>

      <div className="tenant-table-container">
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Apartment Type</th>
              <th>Rent Amount</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  {tenants.length === 0 
                    ? 'No Tenants Found. Add Your First Tenant Using The "Add Tenant" Button.'
                    : 'No Tenants Found Matching Your Criteria'
                  }
                </td>
              </tr>
            ) : (
              filteredTenants.map(tenant => (
                <tr key={tenant.id}>
                  <td>
                    <div className="tenant-name">
                      <FaUser /> {capitalizeFirstLetters(tenant.name)}
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      {tenant.contact_phone && <div><FaPhone /> {tenant.contact_phone}</div>}
                      {tenant.contact_email && <div><FaEnvelope /> {tenant.contact_email}</div>}
                    </div>
                  </td>
                  <td>{capitalizeFirstLetters(tenant.apartment_type)}</td>
                  <td>{formatNaira(tenant.rent_amount)}</td>
                  <td>
                    <span className={`status-badge ${tenant.payment_status}`}>
                      {tenant.payment_status === 'paid' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                      {capitalizeFirstLetters(tenant.payment_status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/landlordtenantdetailspage/${tenant.id}`} 
                        className="btn btn-info"
                      >
                        <FaEye /> View
                      </Link>
                      <button 
                        className="btn btn-warning"
                        onClick={() => handleViewTenant(tenant)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteTenant(tenant.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <TenantModal 
          tenant={selectedTenant} 
          onClose={handleCloseModal}
          onSave={handleSaveTenant}
          isSaving={isSaving}
          shopId={shopId}
          generateTenantId={generateTenantId}
          formatNumberInput={formatNumberInput}
          capitalizeFirstLetters={capitalizeFirstLetters}
        />
      )}
    </div>
  );
};

// Tenant Modal Component
const TenantModal = ({ tenant, onClose, onSave, isSaving, shopId, generateTenantId, formatNumberInput, capitalizeFirstLetters }) => {
  const [formData, setFormData] = useState(
    tenant || {
      name: '',
      contact_phone: '',
      contact_email: '',
      apartment_type: '',
      rooms_occupied: 1,
      rent_amount: "",
      payment_status: 'pending',
      next_of_kin_name: '',
      next_of_kin_relationship: '',
      next_of_kin_phone: '',
      guarantor_name: '',
      guarantor_phone: '',
      guarantor_relationship: '',
      lease_start_date: '',
      lease_end_date: '',
      tenant_id: '' // Will be generated on save
    }
  );

  const [generatedId, setGeneratedId] = useState('');

  // Generate preview ID when name changes for new tenants
  useEffect(() => {
    if (!tenant && formData.name.trim().length > 0) {
      const generatePreviewId = async () => {
        const previewId = await generateTenantId(shopId, formData.name);
        setGeneratedId(previewId);
      };
      generatePreviewId();
    }
  }, [formData.name, tenant, shopId, generateTenantId]);

  const handleInputChange = (field, value) => {
    if (field === 'rent_amount') {
      // Format number input with commas
      setFormData(prev => ({
        ...prev,
        [field]: formatNumberInput(value)
      }));
    } else if (['name', 'next_of_kin_name', 'next_of_kin_relationship', 'guarantor_name', 'guarantor_relationship', 'apartment_type'].includes(field)) {
      // Capitalize first letters of text inputs
      setFormData(prev => ({
        ...prev,
        [field]: capitalizeFirstLetters(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tenant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tenant ? 'Edit Tenant' : 'Add New Tenant'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body scrollable">
            {/* Tenant ID Display */}
            {tenant ? (
              <div className="form-section">
                <h3><FaIdCard /> Tenant Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tenant Id</label>
                    <div className="tenant-id-display">
                      <span>{tenant.tenant_id || 'Not Assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-section">
                <h3><FaIdCard /> Tenant Id</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Generated Tenant Id</label>
                    <div className="tenant-id-preview">
                      <span>{generatedId || 'Enter Tenant Name To Generate Id'}</span>
                    </div>
                    <small className="help-text">
                      This Id Will Be Automatically Generated And Assigned When You Save The Tenant.
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className="form-section">
              <h3><FaUser /> Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Enter Full Name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><FaHome /> Residence Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Apartment Type *</label>
                  <select
                    value={formData.apartment_type}
                    onChange={(e) => handleInputChange('apartment_type', e.target.value)}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="studio">Studio</option>
                    <option value="1-bedroom">1-Bedroom</option>
                    <option value="2-bedroom">2-Bedroom</option>
                    <option value="3-bedroom">3-Bedroom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Rooms Occupied *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.rooms_occupied}
                    onChange={(e) => handleInputChange('rooms_occupied', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Rent Amount (₦)</label>
                  <input
                    type="text"
                    value={formData.rent_amount}
                    onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Lease Start Date</label>
                  <input
                    type="date"
                    value={formData.lease_start_date}
                    onChange={(e) => handleInputChange('lease_start_date', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Lease End Date</label>
                  <input
                    type="date"
                    value={formData.lease_end_date}
                    onChange={(e) => handleInputChange('lease_end_date', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><FaUser /> Next Of Kin</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.next_of_kin_name}
                    onChange={(e) => handleInputChange('next_of_kin_name', e.target.value)}
                    placeholder="Next Of Kin Full Name"
                  />
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    value={formData.next_of_kin_relationship}
                    onChange={(e) => handleInputChange('next_of_kin_relationship', e.target.value)}
                    placeholder="E.G., Spouse, Parent, Sibling"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.next_of_kin_phone}
                    onChange={(e) => handleInputChange('next_of_kin_phone', e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><FaUser /> Guarantor</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.guarantor_name}
                    onChange={(e) => handleInputChange('guarantor_name', e.target.value)}
                    placeholder="Guarantor Full Name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.guarantor_phone}
                    onChange={(e) => handleInputChange('guarantor_phone', e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    value={formData.guarantor_relationship}
                    onChange={(e) => handleInputChange('guarantor_relationship', e.target.value)}
                    placeholder="E.G., Employer, Relative, Friend"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn landlord-btn-primary" disabled={isSaving || !formData.name.trim()}>
              {isSaving ? <FaSpinner className="spinner" /> : (tenant ? 'Update Tenant' : 'Create Tenant')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantManagement;