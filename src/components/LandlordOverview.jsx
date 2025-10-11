import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import Loading from "../components/Loading";
import {
  Users,
  Home,
  Calendar,
  AlertTriangle,
  DollarSign,
  Mail,
  Phone,
  Search,
  Plus,
  FileText,
  TrendingUp,
  Bell,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "../styles/landlordoverview.css";

const Landlordoverview = () => {
  const { shopId } = useParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [property, setProperty] = useState(null);
  const [upcomingRentDue, setUpcomingRentDue] = useState([]);
  const [rentIncrementsDue, setRentIncrementsDue] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTenant, setExpandedTenant] = useState(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState(3);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tenants for this shop
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("landlord_tenants")
        .select("*")
        .eq("shop_id", shopId)
        .order("name", { ascending: true });

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Fetch shop details
      const { data: propertyData, error: propertyError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData || null);

      // Rent due within 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999);

      const upcomingDue = (tenantsData || []).filter((tenant) => {
        if (!tenant.lease_end_date) return false;
        const dueDate = new Date(tenant.lease_end_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= nextWeek;
      });
      setUpcomingRentDue(upcomingDue);

      // Rent increment after 3 years
      const incrementsDue = (tenantsData || []).filter((tenant) => {
        if (!tenant.lease_start_date) return false;
        const startDate = new Date(tenant.lease_start_date);
        const threeYearsLater = new Date(startDate);
        threeYearsLater.setFullYear(startDate.getFullYear() + 3);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        return threeYearsLater >= today && threeYearsLater <= thirtyDaysFromNow;
      });
      setRentIncrementsDue(incrementsDue);

      // Generate recent activities
      generateRecentActivities(tenantsData || []);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (tenants) => {
    const activities = [];
    const activityTypes = ["payment", "maintenance", "document", "note"];
    const verbs = ["paid", "submitted", "signed", "added"];

    tenants.slice(0, 5).forEach((tenant) => {
      const type =
        activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const verb = verbs[activityTypes.indexOf(type)];

      let description = "";
      switch (type) {
        case "payment":
          description = `<strong>${
            tenant.name
          }</strong> ${verb} rent for ${new Date().toLocaleString("default", {
            month: "long",
          })}`;
          break;
        case "maintenance":
          description = `New maintenance request for <strong>${
            tenant.property || "Apartment"
          }</strong>`;
          break;
        case "document":
          description = `Lease agreement ${verb} by <strong>${tenant.name}</strong>`;
          break;
        default:
          description = `New note added for <strong>${tenant.name}</strong>`;
      }

      activities.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        description,
        time: `${Math.floor(Math.random() * 24)} hours ago`,
      });
    });

    setRecentActivities(activities);
  };

  // Safer filtering
  const filteredTenants = tenants
    .filter((tenant) => {
      if (activeTab === "all") return true;
      if (activeTab === "rentDue") {
        if (!tenant.lease_end_date) return false;
        const dueDate = new Date(tenant.lease_end_date);
        const today = new Date();
        return dueDate <= today;
      }
      return true;
    })
    .filter((tenant) => {
      const name = (tenant.name || "").toLowerCase();
      const propertyName = (tenant.property || "").toLowerCase();
      return (
        name.includes(searchTerm.toLowerCase()) ||
        propertyName.includes(searchTerm.toLowerCase())
      );
    });

  // Occupancy rate
  const occupancyRate =
    property && property.total_units
      ? Math.round((tenants.length / property.total_units) * 100)
      : tenants.length > 0
      ? 100
      : 0;

  // Currency formatter
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const toggleTenantExpansion = (tenantId) => {
    if (expandedTenant === tenantId) {
      setExpandedTenant(null);
    } else {
      setExpandedTenant(tenantId);
    }
  };

  const handleExportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Property,Rent Amount,Rent Due Date,Phone,Email\n" +
      tenants
        .map(
          (tenant) =>
            `"${tenant.name}","${tenant.property || ""}",${
              tenant.rent_amount || ""
            },"${tenant.lease_end_date || ""}","${
              tenant.contact_phone || ""
            }","${tenant.contact_email || ""}"`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `tenants_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // if (loading) {
  //   return (
  //     <div className="loading-container">
  //       <div className="loading-spinner"></div>
  //       <p>Loading overview...</p>
  //     </div>
  //   );
  // }
if (loading) return <Loading />;
  return (
    <div className="landlord-overview">
      {/* Header */}
      <div className="overview-header">
        <div className="header-left">
          <h1>
            <Home size={24} /> Property Overview
          </h1>
          <p>Manage your properties and tenants</p>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="alert-section">
        {upcomingRentDue.length > 0 && (
          <div className="alert-card rent-due">
            <div className="alert-icon">
              <DollarSign size={20} />
            </div>
            <div className="alert-content">
              <h3>Rent Due Soon</h3>
              <p>{upcomingRentDue.length} tenant(s) due in next 7 days</p>
            </div>
            <button
              className="alert-action"
              onClick={() => setActiveTab("rentDue")}
            >
              View Details
            </button>
          </div>
        )}

        {rentIncrementsDue.length > 0 && (
          <div className="alert-card increment-due">
            <div className="alert-icon">
              <TrendingUp size={20} />
            </div>
            <div className="alert-content">
              <h3>Rent Increase Due</h3>
              <p>{rentIncrementsDue.length} tenant(s) eligible for increment</p>
            </div>
            <button className="alert-action">Review</button>
          </div>
        )}

        <div className="alert-card general">
          <div className="alert-icon">
            <Bell size={20} />
          </div>
          <div className="alert-content">
            <h3>Maintenance Requests</h3>
            <p>You have {maintenanceRequests} pending maintenance requests</p>
          </div>
          <button className="alert-action">Check</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon tenants">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <h3>{tenants.length}</h3>
            <p>Total Tenants</p>
          </div>
          <div className="stat-trend positive">+5%</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon properties">
            <Home size={20} />
          </div>
          <div className="stat-info">
            <h3>{property ? 1 : 0}</h3>
            <p>Properties</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <h3>
              {formatCurrency(
                tenants.reduce(
                  (sum, tenant) => sum + (parseInt(tenant.rent_amount) || 0),
                  0
                )
              )}
            </h3>
            <p>Yearly Revenue</p>
          </div>
          <div className="stat-trend positive">+12%</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon occupancy">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <h3>{occupancyRate}%</h3>
            <p>Occupancy Rate</p>
          </div>
          <div className="stat-trend positive">+3%</div>
        </div>
      </div>

      {/* Tenants */}
      <div className="tenants-section">
        <div className="section-header">
          <h2>Tenant Management</h2>
          <div className="header-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              <button
                className={activeTab === "all" ? "active" : ""}
                onClick={() => setActiveTab("all")}
              >
                All Tenants
              </button>
              <button
                className={activeTab === "rentDue" ? "active" : ""}
                onClick={() => setActiveTab("rentDue")}
              >
                Rent Due (
                {
                  tenants.filter(
                    (t) =>
                      t.lease_end_date &&
                      new Date(t.lease_end_date) <= new Date()
                  ).length
                }
                )
              </button>
            </div>
            <button className="btn btn-secondary" onClick={handleExportData}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="tenants-list">
          {filteredTenants.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No tenants found</h3>
              <p>Add your first tenant to get started</p>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <div
                key={tenant.id}
                className={`tenant-card ${
                  expandedTenant === tenant.id ? "expanded" : ""
                }`}
              >
                <div className="tenant-info">
                  <div className="tenant-avatar">{tenant.name?.charAt(0)}</div>
                  <div className="tenant-details">
                    <h3>{tenant.name}</h3>
                    <p>{tenant.property}</p>
                    <div className="tenant-meta">
                      <span className="rent-amount">
                        {formatCurrency(tenant.rent_amount)}/year
                      </span>
                      <span
                        className={`due-date ${
                          tenant.lease_end_date &&
                          new Date(tenant.lease_end_date) < new Date()
                            ? "overdue"
                            : ""
                        }`}
                      >
                        <Calendar size={14} />{" "}
                        {tenant.lease_end_date
                          ? `Due on ${new Date(
                              tenant.lease_end_date
                            ).toLocaleDateString()}`
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="tenant-actions">
                  {/* <button className="icon-btn" title="Message">
                    <Mail size={18} />
                  </button>
                  <button className="icon-btn" title="Call">
                    <Phone size={18} />
                  </button> */}
                  <a
                    href={`https://wa.me/234${tenant.contact_phone.replace(
                      /^0/,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-btn"
                    title="Message"
                  >
                    <Mail size={18} />
                  </a>

                  <a
                    href={`tel:+234${tenant.contact_phone.replace(/^0/, "")}`}
                    className="icon-btn"
                    title="Call"
                  >
                    <Phone size={18} />
                  </a>

                  {/* <button 
                    className="icon-btn" 
                    onClick={() => toggleTenantExpansion(tenant.id)}
                    title={expandedTenant === tenant.id ? "Show less" : "Show more"}
                  >
                    {expandedTenant === tenant.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button> */}
                </div>

                {expandedTenant === tenant.id && (
                  <div className="tenant-expanded-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">Contact Phone:</span>
                        <span className="detail-value">
                          {tenant.contact_phone || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Contact Email:</span>
                        <span className="detail-value">
                          {tenant.contact_email || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">Lease Start:</span>
                        <span className="detail-value">
                          {tenant.lease_start_date
                            ? new Date(
                                tenant.lease_start_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lease End:</span>
                        <span className="detail-value">
                          {tenant.lease_end_date
                            ? new Date(
                                tenant.lease_end_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <button className="btn btn-secondary">View All</button>
        </div>
        <div className="activity-list">
          {recentActivities.length === 0 ? (
            <div className="empty-state small">
              <FileText size={32} />
              <p>No recent activities</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === "payment" && <DollarSign size={16} />}
                  {activity.type === "maintenance" && (
                    <AlertTriangle size={16} />
                  )}
                  {activity.type === "document" && <FileText size={16} />}
                  {activity.type === "note" && <TrendingUp size={16} />}
                </div>
                <div className="activity-content">
                  <p
                    dangerouslySetInnerHTML={{ __html: activity.description }}
                  />
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Landlordoverview;
