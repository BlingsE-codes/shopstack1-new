import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import Loading from "../components/Loading";
import { 
  FaUser, FaPhone, FaEnvelope, FaHome, FaMoneyBillWave,
  FaCalendar, FaMapMarker, FaIdCard, FaUserFriends,
  FaEdit, FaTrash, FaArrowLeft, FaSpinner, FaExclamationTriangle,
  FaCheckCircle, FaHistory, FaFileContract, FaReceipt,
  FaChevronRight, FaBuilding, FaBed, FaSearch,
  FaPlus, FaDownload
} from 'react-icons/fa';
import "../styles/landlordtenantdetailspage.css";

const TenantProfile = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [allTenants, setAllTenants] = useState([]);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // Check if we have a valid tenant ID on component mount
  useEffect(() => {
    if (!tenantId) {
      setError("No tenant ID provided in URL");
      setLoading(false);
      fetchAllTenants();
    }
  }, [tenantId]);

  const fetchAllTenants = async () => {
    try {
      const shopId = user?.shop_id; // Assuming user has shop_id
      if (!shopId) return;

      const { data: tenantsData, error } = await supabase
        .from('landlord_tenants')
        .select('id, name, contact_phone, apartment_type, payment_status')
        .eq('shop_id', shopId)
        .order('name', { ascending: true });

      if (error) throw error;
      setAllTenants(tenantsData || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchTenantData = useCallback(async (id = tenantId) => {
    if (!id) {
      setError("No tenant ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from('landlord_tenants')
        .select('*')
        .eq('id', id)
        .single();

      if (tenantError) {
        if (tenantError.code === 'PGRST116') {
          throw new Error('Tenant not found');
        }
        throw tenantError;
      }

      if (!tenantData) {
        throw new Error('Tenant not found');
      }

      setTenant(tenantData);

      // Fetch payment history
      const { data: payments, error: paymentsError } = await supabase
        .from('landlord_payments')
        .select('*')
        .eq('tenant_id', id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (!paymentsError) {
        setPaymentHistory(payments || []);
      }

      // Fetch maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!maintenanceError) {
        setMaintenanceRequests(maintenance || []);
      }

    } catch (error) {
      console.error('Error fetching tenant data:', error);
      setError(error.message);
      toast.error('Error loading tenant profile');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
    }
  }, [fetchTenantData, tenantId]);

  const handleTenantSelect = (selectedTenantId) => {
    navigate(`/landlordtenantdetailspage/${selectedTenantId}`);
    setShowTenantSelector(false);
    setSearchTerm('');
  };

  const handleDeleteTenant = async () => {
    if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('landlord_tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      toast.success('Tenant deleted successfully');
      navigate('/tenants');
    } catch (error) {
      toast.error('Error deleting tenant: ' + error.message);
      console.error('Supabase error:', error);
    }
  };

  const handleEditTenant = () => {
    navigate(`/edit-tenant/${tenantId}`);
  };

  const handleRecordPayment = () => {
    toast.success('Payment recording feature would open here');
    // Navigate to payment recording page or open modal
  };

  const handleNewMaintenance = () => {
    toast.success('Maintenance request feature would open here');
    // Navigate to maintenance request page or open modal
  };

  const handleUploadDocument = () => {
    toast.success('Document upload feature would open here');
    // Implement document upload functionality
  };

  const handleExportData = () => {
    if (!tenant) return;

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Field,Value\n"
      + `Name,${tenant.name}\n`
      + `Phone,${tenant.contact_phone || ''}\n`
      + `Email,${tenant.contact_email || ''}\n`
      + `Apartment Type,${tenant.apartment_type}\n`
      + `Rent Amount,${tenant.rent_amount || ''}\n`
      + `Payment Status,${tenant.payment_status}\n`
      + `Lease Start,${tenant.lease_start_date || ''}\n`
      + `Lease End,${tenant.lease_end_date || ''}\n`
      + `Next of Kin,${tenant.next_of_kin_name || ''}\n`
      + `Guarantor,${tenant.guarantor_name || ''}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tenant_${tenant.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Tenant data exported successfully');
  };

  // Filter tenants based on search
  const filteredTenants = allTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.contact_phone && tenant.contact_phone.includes(searchTerm)) ||
    (tenant.apartment_type && tenant.apartment_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Render tenant selector if no tenant ID is provided
  if (!tenantId) {
    return (
      <div className="tenant-profile">
        <div className="profile-header">
          <div className="header-actions">
            <Link to="/landlordtenantmanagement" className="btn btn-secondary">
              <FaArrowLeft /> Back to Tenants
            </Link>
          </div>
          
          <div className="tenant-selector-section">
            <div className="selector-header">
              <h1><FaUser /> Select a Tenant</h1>
              <p>Choose a tenant to view their profile</p>
            </div>
            
            <div className="tenant-selector">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search tenants by name, phone, or apartment type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowTenantSelector(true)}
                />
              </div>
              
              {showTenantSelector && (
                <div className="tenant-dropdown">
                  <div className="dropdown-header">
                    <h4>Select Tenant ({filteredTenants.length})</h4>
                    <button 
                      className="close-btn"
                      onClick={() => setShowTenantSelector(false)}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="tenant-list">
                    {filteredTenants.length === 0 ? (
                      <div className="empty-dropdown">
                        <FaUser size={24} />
                        <p>No tenants found matching your search</p>
                      </div>
                    ) : (
                      filteredTenants.map(tenant => (
                        <div 
                          key={tenant.id}
                          className="tenant-option"
                          onClick={() => handleTenantSelect(tenant.id)}
                        >
                          <div className="tenant-option-avatar">
                            {tenant.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="tenant-option-info">
                            <div className="tenant-option-name">{tenant.name}</div>
                            <div className="tenant-option-details">
                              <span className="apartment-type">{tenant.apartment_type}</span>
                              <span className="phone">{tenant.contact_phone}</span>
                            </div>
                            <span className={`status-badge small ${tenant.payment_status}`}>
                              {tenant.payment_status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-number">{allTenants.length}</span>
                <span className="stat-label">Total Tenants</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {allTenants.filter(t => t.payment_status === 'paid').length}
                </span>
                <span className="stat-label">Paid</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {allTenants.filter(t => t.payment_status === 'pending').length}
                </span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // if (loading) {
  //   return (
  //     <div className="loading-container">
  //       <FaSpinner className="spinner" />
  //       <p>Loading tenant profile...</p>
  //     </div>
  //   );
  // }

  if (loading) return <Loading />;

  if (error || !tenant) {
    return (
      <div className="error-container">
        <div className="error-content">
          <FaExclamationTriangle className="error-icon" />
          <h3>Error Loading Tenant Profile</h3>
          <p>{error || 'Tenant not found'}</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={() => fetchTenantData()}>
              <FaSpinner className="spinner" /> Try Again
            </button>
            <Link to="/landlordtenantmanagement" className="btn btn-secondary">
              <FaArrowLeft /> Back to Tenants
            </Link>
            <button 
              className="btn btn-info" 
              onClick={() => navigate('/landlordtenantmanagement')}
            >
              View All Tenants
            </button>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue(tenant.lease_end_date);
  const isLeaseActive = tenant.lease_end_date && new Date(tenant.lease_end_date) > new Date();

  return (
    <div className="tenant-profile">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
  <FaArrowLeft /> Back
</button>
          <div className="action-buttons">
            <button className="btn btn-info" onClick={handleExportData}>
              <FaDownload /> Export
            </button>
            {/* <button className="btn btn-warning" onClick={handleEditTenant}>
              <FaEdit /> Edit Tenant
            </button> */}
            <button className="btn btn-danger" onClick={handleDeleteTenant}>
              <FaTrash /> Delete Tenant
            </button>
          </div>
        </div>

        <div className="tenant-basic-info">
          <div className="tenant-avatar">
            {tenant.name?.charAt(0).toUpperCase()}
          </div>
          <div className="tenant-details">
            <h1>{tenant.name}</h1>
            <div className="tenant-meta">
              <span className={`status-badge ${tenant.payment_status}`}>
                {tenant.payment_status === 'paid' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                {tenant.payment_status?.charAt(0).toUpperCase() + tenant.payment_status?.slice(1)}
              </span>
              <span className="apartment-type">
                <FaBuilding /> {tenant.apartment_type}
              </span>
              <span className={`lease-status ${isLeaseActive ? 'active' : 'inactive'}`}>
                <FaCalendar /> {isLeaseActive ? 'Active Lease' : 'Lease Ended'}
              </span>
              {daysUntilDue !== null && isLeaseActive && (
                <span className={`due-indicator ${daysUntilDue <= 0 ? 'overdue' : daysUntilDue <= 7 ? 'warning' : 'normal'}`}>
                  <FaCalendar /> {daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue} days until due`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaUser /> Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <FaReceipt /> Payment History
        </button>
        <button 
          className={`tab-button ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <FaHistory /> Maintenance
        </button>
        <button 
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FaFileContract /> Documents
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-grid">
              {/* Personal Information */}
              <div className="info-card">
                <h3><FaUser /> Personal Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Full Name</label>
                    <span>{tenant.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    <span>
                      <FaPhone /> {tenant.contact_phone || 'Not provided'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Email Address</label>
                    <span>
                      <FaEnvelope /> {tenant.contact_email || 'Not provided'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Date Added</label>
                    <span>{formatDate(tenant.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Residence Information */}
              <div className="info-card">
                <h3><FaHome /> Residence Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Apartment Type</label>
                    <span>{tenant.apartment_type}</span>
                  </div>
                  <div className="info-item">
                    <label>Rooms Occupied</label>
                    <span><FaBed /> {tenant.rooms_occupied}</span>
                  </div>
                  <div className="info-item">
                    <label>Rent Amount</label>
                    <span className="rent-amount">{formatNaira(tenant.rent_amount)}</span>
                  </div>
                  <div className="info-item">
                    <label>Payment Status</label>
                    <span className={`status-text ${tenant.payment_status}`}>
                      {tenant.payment_status?.charAt(0).toUpperCase() + tenant.payment_status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lease Information */}
              <div className="info-card">
                <h3><FaCalendar /> Lease Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Lease Start Date</label>
                    <span>{formatDate(tenant.lease_start_date)}</span>
                  </div>
                  <div className="info-item">
                    <label>Lease End Date</label>
                    <span>{formatDate(tenant.lease_end_date)}</span>
                  </div>
                  <div className="info-item">
                    <label>Lease Status</label>
                    <span className={isLeaseActive ? 'text-success' : 'text-danger'}>
                      {isLeaseActive ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Days Remaining</label>
                    <span className={daysUntilDue <= 0 ? 'text-danger' : daysUntilDue <= 30 ? 'text-warning' : 'text-success'}>
                      {daysUntilDue !== null ? `${Math.abs(daysUntilDue)} days` : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next of Kin */}
              <div className="info-card">
                <h3><FaUserFriends /> Next of Kin</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Name</label>
                    <span>{tenant.next_of_kin_name || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Relationship</label>
                    <span>{tenant.next_of_kin_relationship || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    <span>{tenant.next_of_kin_phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Guarantor */}
              <div className="info-card">
                <h3><FaUser /> Guarantor</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Name</label>
                    <span>{tenant.guarantor_name || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    <span>{tenant.guarantor_phone || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Relationship</label>
                    <span>{tenant.guarantor_relationship || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="info-card full-width">
                <h3><FaFileContract /> Additional Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Last Updated</label>
                    <span>{formatDate(tenant.updated_at)}</span>
                  </div>
                  {/* <div className="info-item">
                    <label>Shop ID</label>
                    <span>{tenant.shop_id}</span>
                  </div> */}
                  {tenant.notes && (
                    <div className="info-item">
                      <label>Notes</label>
                      <span>{tenant.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-tab">
            <div className="section-header">
              <h3>Payment History</h3>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={handleRecordPayment}>
                  <FaPlus /> Record Payment
                </button>
                <button className="btn btn-secondary" onClick={handleExportData}>
                  <FaDownload /> Export
                </button>
              </div>
            </div>
            
            {paymentHistory.length === 0 ? (
              <div className="empty-state">
                <FaReceipt size={48} />
                <h4>No Payment History</h4>
                <p>No payment records found for this tenant.</p>
                <button className="btn btn-primary" onClick={handleRecordPayment}>
                  <FaPlus /> Record First Payment
                </button>
              </div>
            ) : (
              <div className="payments-list">
                <div className="payments-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Paid</span>
                    <span className="summary-value">
                      {formatNaira(paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Last Payment</span>
                    <span className="summary-value">
                      {formatDate(paymentHistory[0]?.payment_date)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Payments</span>
                    <span className="summary-value">{paymentHistory.length}</span>
                  </div>
                </div>

                {paymentHistory.map(payment => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-info">
                      <div className="payment-amount">{formatNaira(payment.amount)}</div>
                      <div className="payment-details">
                        <div className="payment-date">{formatDate(payment.payment_date)}</div>
                        <div className="payment-method">{payment.payment_method || 'Cash'}</div>
                        {payment.notes && <div className="payment-notes">{payment.notes}</div>}
                      </div>
                    </div>
                    <div className="payment-actions">
                      <span className={`status-badge ${payment.status || 'completed'}`}>
                        {payment.status || 'Completed'}
                      </span>
                      <button className="icon-btn" title="View receipt">
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-tab">
            <div className="section-header">
              <h3>Maintenance Requests</h3>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={handleNewMaintenance}>
                  <FaPlus /> New Request
                </button>
              </div>
            </div>
            
            {maintenanceRequests.length === 0 ? (
              <div className="empty-state">
                <FaHistory size={48} />
                <h4>No Maintenance Requests</h4>
                <p>No maintenance requests found for this tenant.</p>
                <button className="btn btn-primary" onClick={handleNewMaintenance}>
                  <FaPlus /> Create First Request
                </button>
              </div>
            ) : (
              <div className="maintenance-list">
                {maintenanceRequests.map(request => (
                  <div key={request.id} className="maintenance-item">
                    <div className="request-info">
                      <div className="request-header">
                        <div className="request-title">{request.title || 'Maintenance Request'}</div>
                        <span className={`priority-badge ${request.priority || 'medium'}`}>
                          {request.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="request-description">{request.description}</div>
                      <div className="request-meta">
                        <span className="request-date">{formatDate(request.created_at)}</span>
                        <span className="request-category">{request.category}</span>
                      </div>
                    </div>
                    <div className="request-actions">
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                      <button className="icon-btn" title="View details">
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-tab">
            <div className="section-header">
              <h3>Documents & Contracts</h3>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={handleUploadDocument}>
                  <FaPlus /> Upload Document
                </button>
              </div>
            </div>
            
            <div className="empty-state">
              <FaFileContract size={48} />
              <h4>No Documents</h4>
              <p>No documents uploaded for this tenant yet.</p>
              <button className="btn btn-primary" onClick={handleUploadDocument}>
                <FaPlus /> Upload First Document
              </button>
            </div>

            <div className="documents-guide">
              <h4>Suggested Documents:</h4>
              <ul>
                <li>Lease Agreement</li>
                <li>Identification Document</li>
                <li>Payment Receipts</li>
                <li>Maintenance Records</li>
                <li>Communication Records</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantProfile;