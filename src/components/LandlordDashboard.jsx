import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate, NavLink } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import { Tooltip } from 'react-tooltip';
import Loading from "../components/Loading";
import {
  FaPrint,
  FaDownload,
  FaHome,
  FaFileContract,
  FaReceipt,
  FaSignOutAlt,
  FaClipboardList,
  FaUser,
  FaUsers,
  FaCalendarAlt,
  FaArrowLeft,
  FaSpinner,
  FaHistory,
  FaSearch,
  FaRedo,
  FaBars,
  FaChevronDown,
  FaChartLine,
  FaMoneyBillWave,
  FaShare,
  FaFilePdf,
} from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/landlorddashboard.css";

const LandlordDashboard = () => {
  const { shopId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("receipt");
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedReceipts, setSavedReceipts] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tenants, setTenants] = useState([]); // New state for tenants
  const printRef = useRef();
  const dropdownRef = useRef();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const tabFromUrl = queryParams.get("tab");
  const [typedSignature, setTypedSignature] = useState('');


  // Add this state with the other form data states
const [applicationData, setApplicationData] = useState({
  fullName: "",
  phoneNumber: "",
  emailAddress: "",
  apartmentType: "",
  roomsOccupied: "",
  nextOfKinFullName: "",
  nextOfKinRelationship: "",
  nextOfKinPhoneNumber: "",
  guarantorFullName: "",
  guarantorRelationship: "",
  guarantorPhoneNumber: "",
  applicationDate: new Date(),
  emergencyContact: "",
  currentAddress: "",
  employmentStatus: "",
  monthlyIncome: "",
  previousLandlord: "",
  previousLandlordPhone: "",
  reasonForMoving: "",
  references: "",
  specialRequirements: ""
});
  

  // Enhanced tenant data with proper Date objects
  const [tenantData, setTenantData] = useState({
    name: "",
    property: "",
    amount: "",
    startDate: null,
    endDate: null,
    paymentDate: new Date(),
    address: "",
    paymentMethod: "Bank Transfer",
    receiptNumber: generateReceiptNumber(),
  });

  const [agreementData, setAgreementData] = useState({
    landlordName: "",
    landlordAddress: "",
    tenantName: "",
    tenantAddress: "Same as above",
    propertyAddress: "",
    rentAmount: `${tenantData.amount || ""}`,
    rentDueDate: "1st of each month",
    duration: "12 months",
    commencementDate: new Date(),
    securityDeposit: "",
    utilities: "electricity, water, and security services or as agreed by the parties",
  });

  // Quit Notice form data
  const [noticeData, setNoticeData] = useState({
    
    tenantName: "",
    propertyAddress: "",
    noticePeriod: "30",
    noticeDate: new Date(),
    vacateDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    reason: "Expiry of tenancy",
    additionalNotes: "",
  });

  // Rent Reminder form data
const [reminderData, setReminderData] = useState({
  tenantName: "",
  propertyAddress: "",
  dueDate: new Date(),
  amountDue: "",
  lateFee: "",
  gracePeriod: "5",
  reminderDate: new Date(),
  message: "This is a kind reminder that your rent payment is due soon (or due already). Please ensure payment is made by the due date to avoid late fees.",
  reminderType: "friendly", // friendly, due_date, late, final
});

  // Rent Increase form data
  const [increaseData, setIncreaseData] = useState({
    tenantName: "",
    propertyAddress: "",
    currentRent: "",
    newRent: "",
    increaseAmount: "",
    increasePercentage: "",
    effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    noticeDate: new Date(),
    reason: "Market adjustment",
    additionalNotes: "",
  });

  useEffect(() => {
    if (
      tabFromUrl &&
      [
        "receipt",
        "reprint",
        "agreement",
        "notice",
        "rules",
        "increase",
        "application",
         "reminder"
      ].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate a unique receipt number
  function generateReceiptNumber() {
    return "RCPT-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }

  // Generate a unique increase notice number
  function generateIncreaseNumber() {
    return "INC-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }

  // Fetch tenants from Supabase
  const fetchTenants = useCallback(async () => {
    if (!shopId) return;

    try {
      const { data, error } = await supabase
        .from("landlord_tenants")
        .select("id, name, apartment_type, rent_amount, contact_phone")
        .eq("shop_id", shopId)
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Error fetching tenants: " + error.message);
    }
  }, [shopId]);

  // Capitalize input values
  const capitalizeInput = (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Format number as currency
  const formatCurrency = (value) => {
    // Remove all non-digit characters except decimal point
    const num = value.replace(/[^\d.]/g, "");

    if (!num) return "";

    // Format with commas
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return "₦" + parts.join(".");
  };

  // Parse currency back to number
  const parseCurrency = (value) => {
    return value.replace(/[^\d.]/g, "");
  };

  // Handle currency input changes
  const handleCurrencyChange = (section, field, value) => {
    const formattedValue = formatCurrency(value);

    if (section === "tenant") {
      setTenantData({ ...tenantData, [field]: formattedValue });
    } else if (section === "agreement") {
      setAgreementData({ ...agreementData, [field]: formattedValue });
    } else if (section === "increase") {
      handleIncreaseChange(field, value);

      
    
    } else if (section === "application") {
  setApplicationData({ ...applicationData, [field]: formattedValue });
}
  };

  // Handle notice data changes
  const handleNoticeChange = (field, value) => {
    setNoticeData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate vacate date when notice period or notice date changes
      if (field === "noticePeriod" || field === "noticeDate") {
        const noticeDate =
          field === "noticeDate"
            ? new Date(value)
            : new Date(newData.noticeDate);
        const period =
          field === "noticePeriod"
            ? parseInt(value)
            : parseInt(newData.noticePeriod);

        const vacateDate = new Date(noticeDate);
        vacateDate.setDate(vacateDate.getDate() + period);

        newData.vacateDate = vacateDate;
      }

      return newData;
    });
  };

  // Handle rent increase data changes
  const handleIncreaseChange = (field, value) => {
    setIncreaseData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate increase amount and percentage when current or new rent changes
      if (field === "currentRent" || field === "newRent") {
        const current = parseCurrency(
          field === "currentRent" ? value : newData.currentRent
        );
        const newRent = parseCurrency(
          field === "newRent" ? value : newData.newRent
        );

        if (current && newRent && parseFloat(current) > 0) {
          const currentNum = parseFloat(current);
          const newNum = parseFloat(newRent);
          const increaseAmount = newNum - currentNum;
          const increasePercentage = (
            (increaseAmount / currentNum) *
            100
          ).toFixed(1);
          newData.newRent = formatCurrency(newRent.toString());
          newData.increaseAmount = formatCurrency(increaseAmount.toString());
          newData.increasePercentage = increasePercentage + "%";
        }
      }

      return newData;
    });
  };

  useEffect(() => {
  if (agreementData.commencementDate) {
    const paymentDate = new Date(agreementData.commencementDate);
    const dueDate = new Date(paymentDate);
    dueDate.setFullYear(paymentDate.getFullYear() + 1); // Add 12 months (1 year)

    // Format nicely e.g. "9 October 2026"
    const formattedDueDate = dueDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    setAgreementData(prev => ({
      ...prev,
      rentDueDate: formattedDueDate,
    }));
  }
}, [agreementData.commencementDate]);


  // Fetch shop data if shopId is provided
  useEffect(() => {
    const fetchShop = async () => {
      if (shopId) {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .single();

        if (error) {
          toast.error("Error fetching shop: " + error.message);
        } else {
          setShop(data);
          // Pre-fill form data with shop information
          setTenantData((prev) => ({
            ...prev,
            property: capitalizeInput(data.address),
            address: capitalizeInput(data.address),
            receiptNumber: generateReceiptNumber(),
          }));
          setAgreementData((prev) => ({
            ...prev,
            landlordName: capitalizeInput(user?.full_name || ""),
            landlordAddress: capitalizeInput(data.address),
            propertyAddress: capitalizeInput(data.address),
          }));
          setNoticeData((prev) => ({
            ...prev,
            propertyAddress: capitalizeInput(data.address),
          }));
          setIncreaseData((prev) => ({
            ...prev,
            propertyAddress: capitalizeInput(data.address),
          }));
          setReminderData((prev) => ({
  ...prev,
  propertyAddress: capitalizeInput(data.address),
}));
        }
      } else if (location.state?.shop) {
        // Use shop data passed via state
        setShop(location.state.shop);
        setTenantData((prev) => ({
          ...prev,
          property: capitalizeInput(location.state.shop.address),
          address: capitalizeInput(location.state.shop.address),
          receiptNumber: generateReceiptNumber(),
        }));
        setAgreementData((prev) => ({
          ...prev,
          landlordName: capitalizeInput(user?.full_name || ""),
          landlordAddress: capitalizeInput(location.state.shop.address),
          propertyAddress: capitalizeInput(location.state.shop.address),
        }));
        setNoticeData((prev) => ({
          ...prev,
          propertyAddress: capitalizeInput(location.state.shop.address),
        }));
        setIncreaseData((prev) => ({
          ...prev,
          propertyAddress: capitalizeInput(location.state.shop.address),
        }));
      }
      setLoading(false);
    };

    fetchShop();
  }, [shopId, location.state, user]);

  // Fetch saved receipts and tenants when component mounts
  useEffect(() => {
    if (shopId) {
      fetchSavedReceipts();
      fetchTenants();
    }
  }, [shopId]);

  // Fetch saved receipts from Supabase
  const fetchSavedReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from("landlord_documents")
        .select("*")
        .eq("shop_id", shopId)
        .eq("document_type", "rent_receipt")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching receipts:", error);
        return;
      }

      setSavedReceipts(data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  // Save document to Supabase
 // Save document to Supabase with print tracking
const saveDocumentToSupabase = async (documentType, documentData) => {
  setSaveLoading(true);
  try {
    const { data, error } = await supabase
      .from("landlord_documents")
      .insert({
        shop_id: shopId,
        document_type: documentType,
        document_data: {
          ...documentData,
          lastPrinted: new Date().toISOString(),
          totalPrints: (documentData.totalPrints || 0) + 1
        },
        created_by: user.id,
        created_at: new Date().toISOString(),
        print_count: (documentData.printCount || 1),
        last_printed_at: new Date().toISOString()
      })
      .select();

    if (error) {
      throw error;
    }

    toast.success(`${getDocumentTypeName(documentType)} saved successfully!`);

    // Refresh receipts list if it's a receipt
    if (documentType === "rent_receipt") {
      fetchSavedReceipts();
    }

    return data;
  } catch (error) {
    toast.error(`Failed to save document: ${error.message}`);
    console.error("Supabase error:", error);
    throw error; // Re-throw to handle in print function
  } finally {
    setSaveLoading(false);
  }
};

// Helper function to get document type name
const getDocumentTypeName = (documentType) => {
  const typeMap = {
    'rent_receipt': 'Receipt',
    'tenancy_agreement': 'Tenancy Agreement',
    'quit_notice': 'Quit Notice',
    'house_rules': 'House Rules',
    'rent_increase': 'Rent Increase Notice',
    'tenant_application': 'Tenant Application',
    'rent_reminder': 'Rent Reminder'
  };
  return typeMap[documentType] || 'Document';
};

  // Search payments
  const searchPayments = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsSearching(true);
    try {
      // Search in saved receipts
      const { data, error } = await supabase
        .from("landlord_documents")
        .select("*")
        .eq("shop_id", shopId)
        .eq("document_type", "rent_receipt")
        .or(
          `document_data->>name.ilike.%${searchTerm}%,document_data->>property.ilike.%${searchTerm}%`
        );

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
      if (data.length === 0) {
        toast.info("No matching payments found");
      }
    } catch (error) {
      toast.error("Error searching payments: " + error.message);
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Load a saved receipt for reprinting
  const loadReceiptForReprint = (receipt) => {
    const receiptData = receipt.document_data;

    if (!validateReceiptData(receiptData)) {
    return;
  }
    setTenantData({
      ...receiptData,
      startDate: receiptData.startDate ? new Date(receiptData.startDate) : null,
      endDate: receiptData.endDate ? new Date(receiptData.endDate) : null,
      paymentDate: receiptData.paymentDate
        ? new Date(receiptData.paymentDate)
        : new Date(),
    });
    setActiveTab("receipt");
    toast.success("Receipt loaded for reprinting");
  };

  // Generate a unique reminder number
function generateReminderNumber() {
  return "REM-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

const handleInputChange = (section, field, value) => {
  // Capitalize text inputs
  if (
    typeof value === "string" &&
    field !== "receiptNumber" &&
    field !== "amount" &&
    field !== "rentAmount" &&
    !field.includes("Amount") &&
    !field.includes("Percentage") &&
    field !== "reminderType" && // Don't capitalize reminderType
    field !== "reason" // Don't capitalize reason fields
  ) {
    value = capitalizeInput(value);
  }

   if (section === "tenant") {
    setTenantData({ ...tenantData, [field]: value });
  } else if (section === "agreement") {
    setAgreementData({ ...agreementData, [field]: value });
  } else if (section === "notice") {
    handleNoticeChange(field, value);  // This works for notice
  } else if (section === "increase") {
    handleIncreaseChange(field, value);  // This works for increase
  } else if (section === "application") {
    setApplicationData({ ...applicationData, [field]: value });
  } else if (section === "reminder") {
    handleReminderChange(field, value);  // This should work but might have issues
  }
};

  const handleDateChange = (dateType, date) => {
    setTenantData((prev) => ({
      ...prev,
      [dateType]: date,
    }));
  };


// Handle tenant selection from dropdown
const handleTenantSelect = (tenantName, section) => {
  const selectedTenant = tenants.find((t) => t.name === tenantName);
  if (selectedTenant) {
    if (section === "tenant") {
      setTenantData((prev) => ({
        ...prev,
        name: selectedTenant.name,
      }));
    } else if (section === "agreement") {
      setAgreementData((prev) => ({
        ...prev,
        tenantName: selectedTenant.name,
      }));
    } else if (section === "notice") {
      setNoticeData((prev) => ({
        ...prev,
        tenantName: selectedTenant.name,
      }));
    } else if (section === "increase") {
      setIncreaseData((prev) => ({
        ...prev,
        tenantName: selectedTenant.name,
        currentRent: formatCurrency(selectedTenant.rent_amount?.toString() || ""),
      }));
    } else if (section === "application") {
      setApplicationData((prev) => ({
        ...prev,
        fullName: selectedTenant.name,
        // You can auto-fill other fields from tenant data if available
        phoneNumber: selectedTenant.contact_phone || prev.phoneNumber,

      }));
    } else if (section === "reminder") {
      setReminderData((prev) => ({
        ...prev,
        tenantName: selectedTenant.name,
        amountDue: formatCurrency(selectedTenant.rent_amount?.toString() || ""),
        propertyAddress: capitalizeInput(shop?.address || ""),
      }));
    }
  }
};

  // Share functionality
  const handleShare = async () => {
    const documentTitle = getDocumentTitle();
    const documentContent = getDocumentContent();

    if (navigator.share) {
      try {
        await navigator.share({
          title: documentTitle,
          text: `Please find attached the ${documentTitle} for ${
            shop?.name || "Property"
          }`,
          url: window.location.href,
        });
        toast.success("Document shared successfully!");
      } catch (error) {
        if (error.name !== "AbortError") {
          toast.error("Error sharing document: " + error.message);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `${documentTitle}\n\n${documentContent}`
        );
        toast.success("Document content copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy to clipboard: " + error.message);
      }
    }
  };


  // Handle rent reminder data changes
// Handle rent reminder data changes
const handleReminderChange = (field, value) => {
  setReminderData((prev) => {
    const newData = { ...prev, [field]: value };

    // Handle currency fields
    if (field === "amountDue" || field === "lateFee") {
      const formattedValue = formatCurrency(value);
      newData[field] = formattedValue;
    }

    // Auto-calculate due date based on reminder type
    if (field === "reminderType" || field === "dueDate") {
      const dueDate = field === "dueDate" ? new Date(value) : new Date(newData.dueDate);
      const reminderDate = new Date(dueDate);
      
      switch (field === "reminderType" ? value : newData.reminderType) {
        case "friendly":
          reminderDate.setDate(reminderDate.getDate() - 5); // 5 days before
          break;
        case "due_date":
          reminderDate.setDate(reminderDate.getDate()); // On due date
          break;
        case "late":
          reminderDate.setDate(reminderDate.getDate() + 5); // 5 days after
          break;
        case "final":
          reminderDate.setDate(reminderDate.getDate() + 10); // 10 days after
          break;
        default:
          break;
      }
      
      newData.reminderDate = reminderDate;
    }

    return newData;
  });
};

// Handle input changes for rent reminder
const handleReminderInputChange = (field, value) => {
  if (field === "amountDue" || field === "lateFee") {
    // Handle currency fields
    const formattedValue = formatCurrency(value);
    setReminderData(prev => ({ ...prev, [field]: formattedValue }));
  } else if (typeof value === "string" && !field.includes("Amount") && !field.includes("Percentage")) {
    // Capitalize text fields
    value = capitalizeInput(value);
    setReminderData(prev => ({ ...prev, [field]: value }));
  } else {
    setReminderData(prev => ({ ...prev, [field]: value }));
  }
};

  // Download functionality
  const handleDownload = () => {
    const documentTitle = getDocumentTitle();
    const documentContent = getDocumentContent();

    const element = document.createElement("a");
    const file = new Blob([documentContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${documentTitle.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Document downloaded successfully!");
  };

  // Get document title based on active tab
  const getDocumentTitle = () => {
    switch (activeTab) {
      case "receipt":
        return "Rent Receipt";
      case "agreement":
        return "Tenancy Agreement";
      case "notice":
        return "Notice to Quit";
      case "rules":
        return "House Rules";
      case "increase":
        return "Rent Increase Notice";
      case "application":
        return "Tenant Application Form"; 
      default:
        return "Document";
      
    }
  };

 



  // Get document content based on active tab
  const getDocumentContent = () => {
    let content = "";

    switch (activeTab) {
      case "receipt":
        content = `
RENT RECEIPT
${shop?.name ? shop.name.toUpperCase() : "PROPERTY"}
Receipt Number: ${tenantData.receiptNumber}
Date: ${formatDate(tenantData.paymentDate)}

Received from: ${tenantData.name}
Property: ${tenantData.property}
Amount: ${tenantData.amount}
For the period: ${formatDateRange(tenantData.startDate, tenantData.endDate)}
Payment Method: ${tenantData.paymentMethod}

Thank you for your payment.

LANDLORD'S SIGNATURE
____________________
[Digital Signature]
OR
[Uploaded Signature Image]
OR
[Physical Signature on Printed Copy]
OR
[Email Confirmation]
OR
[SMS Authorization]
      `;
        break;

      case "agreement":
        content = `
TENANCY AGREEMENT
${shop?.name ? shop.name.toUpperCase() : "PROPERTY"}
Date: ${new Date().toLocaleDateString()}

BETWEEN
Landlord: ${agreementData.landlordName}
Address: ${agreementData.landlordAddress}

AND
Tenant: ${agreementData.tenantName}
Address: ${agreementData.tenantAddress}

PROPERTY: ${agreementData.propertyAddress}

TERMS:
1. Tenancy Duration: ${agreementData.duration}
2. Commencement Date: ${formatDate(agreementData.commencementDate)}
3. Yearly Rent: ${agreementData.rentAmount}
4. Rent Due Date: ${agreementData.rentDueDate}
5. Caution Fee: ${agreementData.securityDeposit}
6. Utilities: ${agreementData.utilities}

LANDLORD'S SIGNATURE: ____________________ Date: ${new Date().toLocaleDateString()}
[Choose one: Digital Signature | Uploaded Signature | Physical Signature | Email Verification]

TENANT'S SIGNATURE: ____________________ Date: ${new Date().toLocaleDateString()}
[Choose one: Digital Signature | Uploaded Signature | Physical Signature | Email Verification]
      `;
        break;

      case "notice":
        content = `
NOTICE TO QUIT
${shop?.name ? shop.name.toUpperCase() : "PROPERTY"}
Date: ${formatDate(noticeData.noticeDate)}

To: ${noticeData.tenantName}
Property: ${noticeData.propertyAddress}

You are hereby given notice to quit and deliver up possession of the premises on or before ${formatDate(
          noticeData.vacateDate
        )}.

Reason: ${noticeData.reason}
${
  noticeData.additionalNotes
    ? `Additional Notes: ${noticeData.additionalNotes}`
    : ""
}

LANDLORD'S SIGNATURE
____________________
[Signature Method: Digital | Uploaded Image | Physical | Email Auth | SMS Code]
      `;
        break;

      case "increase":
        content = `
RENT INCREASE NOTICE
${shop?.name ? shop.name.toUpperCase() : "PROPERTY"}
Date: ${formatDate(increaseData.noticeDate)}

To: ${increaseData.tenantName}
Property: ${increaseData.propertyAddress}

Current Rent: ${increaseData.currentRent}
New Rent: ${increaseData.newRent}
Increase Amount: ${increaseData.increaseAmount}
Increase Percentage: ${increaseData.increasePercentage}
Effective Date: ${formatDate(increaseData.effectiveDate)}

Reason: ${increaseData.reason}
${
  increaseData.additionalNotes
    ? `Additional Notes: ${increaseData.additionalNotes}`
    : ""
}

LANDLORD'S SIGNATURE
____________________
[Signature Options: Digital Signature | Image Upload | Physical Sign | Email Verification | Mobile Auth]
      `;
        break;

      case "rules":
        content = `
HOUSE RULES
${shop?.name ? shop.name.toUpperCase() : "PROPERTY"}
Date: ${new Date().toLocaleDateString()}

1. Quiet hours are from 10:00 PM to 7:00 AM
2. No pets allowed without written consent
3. Keep units clean and sanitary
4. No smoking inside the building
5. No alterations without landlord's consent
6. Proper garbage disposal required
7. Report maintenance issues promptly
8. Park only in designated areas
9. Guests must not disturb others
10. Pay utilities promptly

TENANT ACKNOWLEDGEMENT:
I, ${tenantData.name}, acknowledge receipt and understanding of these rules.

TENANT'S SIGNATURE: ____________________ Date: ${new Date().toLocaleDateString()}
[Signature Method: Digital | Physical | Email Confirmation]

LANDLORD'S SIGNATURE: ____________________ Date: ${new Date().toLocaleDateString()}
[Signature Method: Digital | Physical | Email Confirmation]
      `;
        break;
        case "application":
  content = `
TENANT APPLICATION FORM
 ${shop?.name ? shop.name.toUpperCase() : "PROPERTY MANAGEMENT"}

PERSONAL INFORMATION:
Full Name: ${applicationData.fullName}
Phone Number: ${applicationData.phoneNumber}
Email Address: ${applicationData.emailAddress}
Application Date: ${formatDate(applicationData.applicationDate)}

HOUSING PREFERENCE:
Apartment Type: ${applicationData.apartmentType}
Rooms Occupied: ${applicationData.roomsOccupied}

NEXT OF KIN:
Full Name: ${applicationData.nextOfKinFullName}
Relationship: ${applicationData.nextOfKinRelationship}
Phone Number: ${applicationData.nextOfKinPhoneNumber}

GUARANTOR:
Full Name: ${applicationData.guarantorFullName}
Relationship: ${applicationData.guarantorRelationship}
Phone Number: ${applicationData.guarantorPhoneNumber}

ADDITIONAL INFORMATION:
Current Address: ${applicationData.currentAddress}
Employment Status: ${applicationData.employmentStatus}
Monthly Income: ${applicationData.monthlyIncome}
Reason for Moving: ${applicationData.reasonForMoving}
Special Requirements: ${applicationData.specialRequirements}

DECLARATION:
I hereby declare that the information provided is true and correct.

Applicant's Signature: ___________________ Date: ${new Date().toLocaleDateString()}
Landlord's Signature: ___________________ Date: ${new Date().toLocaleDateString()}
  `;
  break;
    }
    

    return content;
  };

  // Enhanced print function that works for all document types
// Enhanced print function that works for all document types and auto-saves
const handleEnhancedPrint = async () => {
  let documentTitle = "";
  let documentContent = "";
  let documentType = "";
  let documentData = {};

  // Get content based on active tab
  switch (activeTab) {
    case "receipt":
      documentTitle = "RENT RECEIPT";
      documentContent = printRef.current.innerHTML;
      documentType = "rent_receipt";
      documentData = {
        ...tenantData,
        receiptNumber: generateReceiptNumber(),
        printedAt: new Date().toISOString(),
        printCount: (tenantData.printCount || 0) + 1
      };
      break;
    case "agreement":
      documentTitle = "TENANCY AGREEMENT";
      documentContent =
        document.querySelector(".agreement-container")?.innerHTML ||
        renderAgreementAsHTML();
      documentType = "tenancy_agreement";
      documentData = {
        ...agreementData,
        printedAt: new Date().toISOString(),
        printCount: (agreementData.printCount || 0) + 1
      };
      break;
    case "notice":
      documentTitle = "NOTICE TO QUIT";
      documentContent =
        document.querySelector(".notice-container")?.innerHTML ||
        renderQuitNoticeAsHTML();
      documentType = "quit_notice";
      documentData = {
        ...noticeData,
        printedAt: new Date().toISOString(),
        printCount: (noticeData.printCount || 0) + 1
      };
      break;
    case "rules":
      documentTitle = "HOUSE RULES";
      documentContent =
        document.querySelector(".rules-container")?.innerHTML ||
        renderHouseRulesAsHTML();
      documentType = "house_rules";
      documentData = {
        ...tenantData,
        printedAt: new Date().toISOString(),
        printCount: (tenantData.printCount || 0) + 1
      };
      break;
    case "increase":
      documentTitle = "RENT INCREASE NOTICE";
      documentContent =
        document.querySelector(".increase-container")?.innerHTML ||
        renderRentIncreaseAsHTML();
      documentType = "rent_increase";
      documentData = {
        ...increaseData,
        increaseNumber: generateIncreaseNumber(),
        printedAt: new Date().toISOString(),
        printCount: (increaseData.printCount || 0) + 1
      };
      break;
    case "application":
      documentTitle = "TENANT APPLICATION FORM";
      documentContent = document.querySelector(".application-container")?.innerHTML || renderTenantApplicationAsHTML();
      documentType = "tenant_application";
      documentData = {
        ...applicationData,
        printedAt: new Date().toISOString(),
        printCount: (applicationData.printCount || 0) + 1
      };
      break;

      case "reminder":
      documentTitle = "RENT REMINDER";
      documentContent = document.querySelector(".reminder-container")?.innerHTML || renderRentReminderAsHTML();
      documentType = "rent_reminder";
      documentData = {
        ...reminderData,
        reminderNumber: generateReminderNumber(),
        printedAt: new Date().toISOString(),
        printCount: (reminderData.printCount || 0) + 1
      };
      break;
    default:
      toast.error("No document to print");
      return;
  }

  try {
    // Auto-save the document before printing
    setSaveLoading(true);
    await saveDocumentToSupabase(documentType, documentData);
    
    // Proceed with printing
    const printWindow = window.open("", "_blank");

    // Base styles for all documents
    const baseStyles = `
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background: #f9f9f9;
          line-height: 1.6;
        }

        .print-container {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 25px;
          max-width: 600px;
          margin: 30px auto;
         
        }

        .print-header {
          text-align: center;
          padding-bottom: 15px;
          margin-bottom: 20px;
          border-bottom: 2px dashed #333;
        }

        .print-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #222;
          text-transform: uppercase;
        }

        .print-header h2 {
          margin: 10px 0 5px 0;
          font-size: 20px;
          font-weight: 600px;
          color: #e67a00;
         
        }

        .print-header small {
          font-size: 12px;
          color: #777;
        }

        .document-body {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-row .label {
          font-weight: bold;
          color: #333;
          min-width: 150px;
        }

        .signature-section {
          margin-top: 50px;
          text-align: right;
        }

        .signature-line {
          width: 250px;
          border-top: 1px solid #000;
          display: inline-block;
          margin-bottom: 5px;
        }

        .signature-section p {
          margin: 5px 0;
          font-size: 14px;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px dashed #ccc;
          padding-top: 10px;
        }

        /* Agreement specific styles */
        .agreement h3 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 16px;
        }

        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .party {
          width: 48%;
        }

        .party h4 {
          margin-bottom: 10px;
          font-size: 14px;
        }

        .terms ol {
          padding-left: 20px;
        }

        .terms li {
          margin-bottom: 10px;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }

        .signature-block {
          text-align: center;
        }

        /* Notice specific styles */
        .notice-text {
          margin-bottom: 15px;
          text-align: justify;
        }

        .notice-warning {
          margin-top: 20px;
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          font-weight: bold;
        }

        /* Increase specific styles */
        .increase-details {
          margin: 20px 0;
        }

        .increase-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }

        .rent-box {
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          text-align: center;
        }

        .current-rent {
          border-color: #dc3545;
        }

        .new-rent {
          border-color: #28a745;
        }

        .rent-amount {
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0;
        }

        .increase-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }

        /* Rules specific styles */
        .rules ol {
          padding-left: 20px;
        }

        .rules li {
          margin-bottom: 10px;
        }

        .acknowledgement {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }

        @media print {
          body { 
            background: #fff; 
            margin: 0; 
            padding: 0;
          }
          .no-print { 
            display: none; 
          }
          .print-container { 
            box-shadow: none; 
            margin: 0; 
            border: none; 
            padding: 15px;
          }
        }
      `;


printWindow.document.write(`
  <html>
    <head>
      <title>Print ${documentTitle}</title>
      <style>
        ${baseStyles}
        
        /* Force white background for the entire document */
        * {
          background: white !important;
          background-color: white !important;
        }
        
        body {
          background: white !important;
          background-color: white !important;
          margin: 0;
          padding: 20px;
        }
        
        /* Ensure print container has white background */
        .print-container {
          background: white !important;
          background-color: white !important;
          color: black !important;
        }
        
        /* Ensure all child elements have white background */
        .print-container * {
          background: white !important;
          background-color: white !important;
        }
        
        .no-print {
          text-align: center; 
          margin-top: 30px; 
          padding: 20px;
          background: white !important;
        }
        
        button {
          padding: 10px 20px; 
          margin: 5px; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
          font-weight: bold;
        }
        
        /* Specific button colors */
        button:nth-child(1) { /* Print button */
          background: #e67a00 !important;
          background-color: #e67a00 !important;
        }
        
        button:nth-child(2) { /* Save as PDF button */
          background: #2563eb !important;
          background-color: #2563eb !important;
        }
        
        button:nth-child(3) { /* Save as Image button */
          background: #64748b !important;
          background-color: #64748b !important;
        }
        
        button:nth-child(4) { /* Share button */
          background: #e67a00 !important;
          background-color: #e67a00 !important;
        }
        
        button:nth-child(5) { /* Close button */
          background: #64748b !important;
          background-color: #64748b !important;
        }
        
        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    </head>
    <body style="background: white !important; background-color: white !important;">
      <div class="print-container" style="background: white !important; background-color: white !important;">
        <div class="print-header" style="background: white !important;">
          <h1 style="background: white !important;">${documentTitle}</h1>
          <h2 style="background: white !important;">${
            shop?.name.toUpperCase()
              ? shop.name.replace(/\b\w/g, (char) => char.toUpperCase())
              : "Property"
          }</h2>
          <small style="background: white !important;">Document generated on ${new Date().toLocaleString()}</small>
        </div>

        <div class="document-body" style="background: white !important;">
          ${documentContent}
        </div>
        <div class="footer" style="background: white !important;">
          Powered by ShopStack
        </div>
      </div>

      <div class="no-print" style="background: white !important;">
        <button onclick="window.print()">🖨️ Print</button>
        <button onclick="window.saveAsPDF()">📄 Save as PDF</button>
      
        <button onclick="window.shareDocument()">📤 Share</button>
        <button onclick="window.close()">❌ Close</button>
      </div>

      <script>
        const { jsPDF } = window.jspdf;

        // Configure html2canvas to use white background
        const html2canvasOptions = {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff', // Force white background for captures
          onclone: function(clonedDoc) {
            // Force white background on all elements in the cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              el.style.background = '#ffffff';
              el.style.backgroundColor = '#ffffff';
            });
            clonedDoc.body.style.background = '#ffffff';
            clonedDoc.body.style.backgroundColor = '#ffffff';
          }
        };

        window.saveAsPDF = function() {
          const element = document.querySelector('.print-container');
          
          html2canvas(element, html2canvasOptions).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            pdf.save('${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf');
          });
        };

        window.saveAsImage = function() {
          const element = document.querySelector('.print-container');
          
          html2canvas(element, html2canvasOptions).then(canvas => {
            const link = document.createElement('a');
            link.download = '${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          });
        };

        window.shareDocument = function() {
          const element = document.querySelector('.print-container');
          
          html2canvas(element, {
            scale: 1,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff', // Force white background for sharing
            onclone: function(clonedDoc) {
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach(el => {
                el.style.background = '#ffffff';
                el.style.backgroundColor = '#ffffff';
              });
              clonedDoc.body.style.background = '#ffffff';
              clonedDoc.body.style.backgroundColor = '#ffffff';
            }
          }).then(canvas => {
            canvas.toBlob(function(blob) {
              const file = new File([blob], '${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png', { 
                type: 'image/png' 
              });
              
              if (navigator.share) {
                navigator.share({
                  title: '${documentTitle}',
                  text: 'Check out this document from ${shop?.name || "Property"}',
                  files: [file]
                }).catch(error => {
                  console.log('Sharing cancelled or failed:', error);
                });
              } else {
                const imageData = canvas.toDataURL('image/png');
                const text = 'Check out this document: ${documentTitle} from ${shop?.name || "Property"}';
                const encodedText = encodeURIComponent(text);
                
                const whatsappUrl = 'https://wa.me/?text=' + encodedText;
                const emailUrl = 'mailto:?subject=' + encodeURIComponent('${documentTitle}') + 
                                '&body=' + encodedText;
                
                if (confirm('Share via: OK for WhatsApp, Cancel for Email')) {
                  window.open(whatsappUrl, '_blank');
                } else {
                  window.location.href = emailUrl;
                }
              }
            });
          });
        };
      </script>
    </body>
  </html>
`);
printWindow.document.close();

toast.success("Document printed and saved successfully!");





  } catch (error) {
    console.error("Error during print operation:", error);
    toast.error("Failed to save document before printing");
  } finally {
    setSaveLoading(false);
  }
};
  // Helper functions to render documents as HTML strings
  const renderAgreementAsHTML = () => {
    return `
        <div class="agreement">
          <h3>THIS TENANCY AGREEMENT IS MADE ON THE ${new Date().toLocaleDateString()}</h3>
          
          <div class="parties">
            <div class="party">
              <h4>BETWEEN</h4>
              <p><strong class="capitalize">${
                agreementData.landlordName
              }</strong></p>
              <p class="capitalize">Address: ${
                agreementData.landlordAddress
              }</p>
              <p>(Hereinafter called "the Landlord")</p>
            </div>
            
            <div class="party">
              <h4>AND</h4>
              <p><strong class="capitalize">${
                agreementData.tenantName
              }</strong></p>
              <p class="capitalize">Address: ${agreementData.tenantAddress}</p>
              <p>(Hereinafter called "the Tenant")</p>
            </div>
          </div>
          
          <div class="terms">
            <h4>TERMS OF AGREEMENT</h4>
            <ol>
            
              <li>The Landlord agrees to let and the Tenant agrees to take the property located at: <strong class="capitalize">${
                agreementData.propertyAddress
              }</strong></li>
              <li>The tenancy shall be for a term of <strong>${
                agreementData.duration
              }</strong> commencing on <strong>${formatDate(
      agreementData.commencementDate
    )}</strong></li>
              <li>The Tenant shall pay a rent of <strong>${
                agreementData.rentAmount.toLocaleString()
              }</strong> per year in advance on the <strong>${
      agreementData.rentDueDate
    }</strong></li>
              <li>The Tenant shall pay a caution fee of <strong>${
                agreementData.securityDeposit
              }</strong> which shall be refundable at the end of the tenancy</li>
              <li>The Tenant shall be responsible for <strong>${
                agreementData.utilities
              }</strong></li>
            </ol>
          </div>
          
          <div class="signatures">
            <div class="signature-block">
              <div class="signature-line"></div>
              <p>Landlord's Signature</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <p>Tenant's Signature</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      `;
  };
  

  const renderQuitNoticeAsHTML = () => {
    return `
        <div class="notice">
          <div class="notice-details">
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formatDate(noticeData.noticeDate)}</span>
            </div>
            <div class="detail-row">
              <span class="label">To:</span>
              <span class="value capitalize">${
                noticeData.tenantName || "Tenant Name"
              }</span>
            </div>
            <div class="detail-row">
              <span class="label">Address:</span>
              <span class="value capitalize">${
                noticeData.propertyAddress
              }</span>
            </div>
            
            <div class="notice-text">
              You are hereby given notice to quit and deliver up possession of the premises known as 
              <strong class="capitalize"> ${
                noticeData.propertyAddress
              }</strong> 
              on or before <strong>${formatDate(
                noticeData.vacateDate
              )}</strong>.
            </div>
            
            <div class="notice-text">
              This notice is given because: <strong>${
                noticeData.reason
              }</strong>
            </div>
            
            ${
              noticeData.additionalNotes
                ? `
              <div class="notice-text">
                Additional Notes: ${noticeData.additionalNotes}
              </div>
            `
                : ""
            }
            
            <div class="notice-warning">
              If you fail to quit the premises on or before the date specified, legal action will be taken against you 
              to recover possession of the premises, and you may be liable for costs and expenses incurred.
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-line"></div>
            <p>Landlord's Signature</p>
            <p>Date: ${formatDate(noticeData.noticeDate)}</p>
          </div>
        </div>
      `;
  };

  const renderRentIncreaseAsHTML = () => {
    return `
        <div class="increase">
          <div class="increase-details">
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formatDate(increaseData.noticeDate)}</span>
            </div>
            <div class="detail-row">
              <span class="label">To:</span>
              <span class="value capitalize">${
                increaseData.tenantName || "Tenant Name"
              }</span>
            </div>
            <div class="detail-row">
              <span class="label">Property Address:</span>
              <span class="value capitalize">${
                increaseData.propertyAddress
              }</span>
            </div>
          </div>

          <div class="increase-comparison">
            <div class="rent-box current-rent">
              <h4>Current Rent</h4>
              <div class="rent-amount">${increaseData.currentRent || "₦0"}</div>
              <p>Per Year</p>
            </div>
            <div class="rent-box new-rent">
              <h4>New Rent</h4>
              <div class="rent-amount">${increaseData.newRent || "₦0"}</div>
              <p>Per Year</p>
            </div>
          </div>

          <div class="increase-summary">
            <h4>Rent Increase Summary</h4>
            <p>Increase Amount: <strong>${
              increaseData.increaseAmount || "₦0"
            }</strong></p>
            <p>Increase Percentage: <strong>${
              increaseData.increasePercentage || "0%"
            }</strong></p>
            <p>Effective Date: <strong>${formatDate(
              increaseData.effectiveDate
            )}</strong></p>
          </div>

          <div class="notice-text">
            This notice serves to inform you that your yearly rent will be increased as detailed above. 
            The new rent amount will take effect from <strong>${formatDate(
              increaseData.effectiveDate
            )}</strong>.
          </div>

          ${
            increaseData.reason
              ? `
            <div class="notice-text">
              Reason for increase: <strong>${increaseData.reason}</strong>
            </div>
          `
              : ""
          }

          ${
            increaseData.additionalNotes
              ? `
            <div class="notice-text">
              Additional Information: ${increaseData.additionalNotes}
            </div>
          `
              : ""
          }

          <div class="notice-text">
            Please ensure that all future payments reflect this new amount. If you have any questions or concerns, 
            please do not hesitate to contact us.
          </div>

          <div class="signature-section">
            <div class="signature-line"></div>
            <p>Landlord's Signature</p>
            <p>Date: ${formatDate(increaseData.noticeDate)}</p>
          </div>
        </div>

        <div className="signature-input">
  <label>Type Your Signature</label>
  <input
    type="text"
    value={typedSignature}
    onChange={(e) => setTypedSignature(e.target.value)}
    placeholder="Enter your full name as signature"
  />
  <div className="signature-preview" style={{fontFamily: 'Dancing Script, cursive'}}>
    {typedSignature}
  </div>
</div>

      `;
  };

  const renderHouseRulesAsHTML = () => {
    return `
        <div class="rules">
          <h3>RULES AND REGULATIONS @ ${
            shop?.name?.toUpperCase() || "PROPERTY"
          }</h3>
          
          <ol>
            <li>Quiet hours are from 10:00 PM to 7:00 AM. Please keep noise to a minimum during these hours.</li>
            <li>No pets are allowed without prior written consent from the landlord.</li>
            <li>Tenants are responsible for keeping their units clean and sanitary.</li>
            <li>Smoking is strictly prohibited inside the building.</li>
            <li>No alterations to the premises without the landlord's written consent.</li>
            <li>Properly dispose of garbage in designated areas only.</li>
            <li>Report any maintenance issues promptly to the landlord.</li>
            <li>Park only in designated areas and do not block access roads.</li>
            <li>Guests are allowed but must not disturb other residents.</li>
            <li>Utilities must be paid promptly as agreed in the tenancy agreement.</li>
          </ol>
          
          <div class="acknowledgement">
            <p class="capitalize">I, ${
              tenantData.name || "Tenant Name"
            }, acknowledge that I have received, read, and understood these house rules and agree to abide by them.</p>
            
            <div class="signature-section">
              <div class="signature-line"></div>
              <p>Tenant's Signature</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      `;
  };

  const renderTenantApplicationAsHTML = () => {
  return `
    <div class="application">
      <div class="application-notice">
        <p><strong>Note:</strong> Please fill out this form completely. All information will be kept confidential.</p>
      </div>

      <div class="form-section">
        <h3>PERSONAL INFORMATION</h3>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">Full Name:</span>
            <span class="value capitalize">${applicationData.fullName || "________________"}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone Number:</span>
            <span class="value">${applicationData.phoneNumber || "________________"}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email Address:</span>
            <span class="value">${applicationData.emailAddress || "________________"}</span>
          </div>
          <div class="detail-row">
            <span class="label">Application Date:</span>
            <span class="value">${formatDate(applicationData.applicationDate)}</span>
          </div>
        </div>
      </div>

      <!-- Add similar sections for other parts of the application -->
      
      <div class="declaration-section">
        <h3>DECLARATION</h3>
        <p>
          I hereby declare that the information provided in this application is true and correct to the best of my knowledge. 
          I understand that any false information may lead to the rejection of my application or termination of tenancy.
        </p>
        
        <div class="signatures">
          <div class="signature-block">
            <div class="signature-line"></div>
            <p>Applicant's Signature</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="signature-block">
            <div class="signature-line"></div>
            <p>Landlord/Agent's Signature</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Render rent reminder as HTML for print
const renderRentReminderAsHTML = () => {
  return `
    <div class="reminder">
      <div class="reminder-details">
        <div class="detail-row">
          <span class="label">Reminder Date:</span>
          <span class="value">${formatDate(reminderData.reminderDate)}</span>
        </div>
        <div class="detail-row">
          <span class="label">To:</span>
          <span class="value capitalize">${reminderData.tenantName || "Tenant Name"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Property Address:</span>
          <span class="value capitalize">${reminderData.propertyAddress}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount Due:</span>
          <span class="value">${reminderData.amountDue || "₦0"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due Date:</span>
          <span class="value">${formatDate(reminderData.dueDate)}</span>
        </div>
        ${reminderData.lateFee ? `
        <div class="detail-row">
          <span class="label">Late Fee:</span>
          <span class="value">${reminderData.lateFee}</span>
        </div>
        ` : ''}
      </div>

      <div class="reminder-message">
        <p>${reminderData.message}</p>
        
        ${reminderData.reminderType === "late" || reminderData.reminderType === "final" ? `
        <div class="reminder-warning">
          <strong>Important:</strong> Please note that failure to make payment by the due date may result in late fees and/or legal action as per your tenancy agreement.
        </div>
        ` : ''}
      </div>

      <div class="signature-section">
        <div class="signature-line"></div>
        <p>Landlord/Property Manager</p>
        <p>Date: ${formatDate(reminderData.reminderDate)}</p>
      </div>
    </div>
  `;
};

// Render rent reminder form
const renderRentReminder = () => (
  <div className="document-container reminder-container">
    <div className="document-body">
      <div className="reminder-details">
        <div className="detail-row">
          <span className="label">Reminder Date:</span>
          <span className="value">{formatDate(reminderData.reminderDate)}</span>
        </div>
        <div className="detail-row">
          <span className="label">To:</span>
          <span className="value capitalize">{reminderData.tenantName || "Tenant Name"}</span>
        </div>
        <div className="detail-row">
          <span className="label">Property Address:</span>
          <span className="value capitalize">{reminderData.propertyAddress}</span>
        </div>
        <div className="detail-row">
          <span className="label">Amount Due:</span>
          <span className="value">{reminderData.amountDue || "₦0"}</span>
        </div>
        <div className="detail-row">
          <span className="label">Due Date:</span>
          <span className="value">{formatDate(reminderData.dueDate)}</span>
        </div>
        {reminderData.lateFee && (
          <div className="detail-row">
            <span className="label">Late Fee:</span>
            <span className="value">{reminderData.lateFee}</span>
          </div>
        )}
      </div>

      <div className="reminder-message">
        <p>{reminderData.message}</p>
        
        {(reminderData.reminderType === "late" || reminderData.reminderType === "final") && (
          <div className="reminder-warning">
            <strong>Important:</strong> Please note that failure to make payment by the due date may result in late fees and/or legal action as per your tenancy agreement.
          </div>
        )}
      </div>

      <div className="signature-section">
        <div className="signature-line"></div>
        <p>Landlord/Property Manager</p>
        <p>Date: {formatDate(reminderData.reminderDate)}</p>
      </div>
    </div>
  </div>
);

  const handleSaveDocument = async () => {
    let documentData;
    let documentType;

    switch (activeTab) {
      case "receipt":
        documentType = "rent_receipt";
        // Generate new receipt number for each save
        documentData = {
          ...tenantData,
          receiptNumber: generateReceiptNumber(),
        };
        break;
      case "agreement":
        documentType = "tenancy_agreement";
        documentData = agreementData;
        break;
      case "notice":
        documentType = "quit_notice";
        documentData = noticeData;
        break;
      case "rules":
        documentType = "house_rules";
        documentData = tenantData;
        break;
      case "increase":
        documentType = "rent_increase";
        documentData = {
          ...increaseData,
          increaseNumber: generateIncreaseNumber(),
        };
        break;
        case "application":
  documentType = "tenant_application";
  documentData = applicationData;
  break;

  case "reminder":
      documentType = "rent_reminder";
      documentData = {
        ...reminderData,
        reminderNumber: generateReminderNumber(),
      };
      break;

      default:
        return;
    }

    await saveDocumentToSupabase(documentType, documentData);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "Not set";
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const renderReceipt = () => (
  
    <div className="document-container" ref={printRef}>
      <div className="document-body">
        <div className="receipt-details">
          <div className="detail-row">
            <span className="label">Receipt Number:</span>
            <span className="value">{tenantData.receiptNumber}</span>
          </div>
          <div className="detail-row">
            <span className="label">Received from:</span>
            <span className="value capitalize">{tenantData.name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Property:</span>
            <span className="value capitalize">{tenantData.property}</span>
          </div>
          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value">{tenantData.amount}</span>
          </div>
          <div className="detail-row">
            <span className="label">For the period:</span>
            <span className="value">
              {formatDateRange(tenantData.startDate, tenantData.endDate)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Payment date:</span>
            <span className="value">{formatDate(tenantData.paymentDate)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment method:</span>
            <span className="value capitalize">{tenantData.paymentMethod}</span>
          </div>
        </div>

        <div className="signature-section">
          <div className="signature-line"></div>
          <p>Landlord's Signature</p>
        </div>
      </div>
    </div>
  );

  const renderTenantApplication = () => (
  <div className="document-container application-container">
    <div className="document-header">
      {/* <h2>TENANT APPLICATION FORM</h2>
      {shop?.logo_url && (
        <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />
      )}
      {!shop?.logo_url && (
        <div className="logo">{shop?.name || "PROPERTY MANAGEMENT"}</div>
      )} */}
    </div>

    <div className="document-body application">
      <div className="application-notice">
        <p><strong>Note:</strong> Please fill out this form completely. All information will be kept confidential.</p>
      </div>

      <div className="form-section">
        <h3>PERSONAL INFORMATION</h3>
        <div className="detail-grid">
          <div className="detail-row">
            <span className="label">Full Name:</span>
            <span className="value capitalize">{applicationData.fullName || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone Number:</span>
            <span className="value">{applicationData.phoneNumber || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email Address:</span>
            <span className="value">{applicationData.emailAddress || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Application Date:</span>
            <span className="value">{formatDate(applicationData.applicationDate)}</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>HOUSING PREFERENCE</h3>
        <div className="detail-grid">
          <div className="detail-row">
            <span className="label">Preferred Apartment Type:</span>
            <span className="value">{applicationData.apartmentType || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Rooms to be Occupied:</span>
            <span className="value">{applicationData.roomsOccupied || "________________"}</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>NEXT OF KIN INFORMATION</h3>
        <div className="detail-grid">
          <div className="detail-row">
            <span className="label">Full Name:</span>
            <span className="value capitalize">{applicationData.nextOfKinFullName || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Relationship:</span>
            <span className="value">{applicationData.nextOfKinRelationship || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone Number:</span>
            <span className="value">{applicationData.nextOfKinPhoneNumber || "________________"}</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>GUARANTOR INFORMATION</h3>
        <div className="detail-grid">
          <div className="detail-row">
            <span className="label">Full Name:</span>
            <span className="value capitalize">{applicationData.guarantorFullName || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Relationship:</span>
            <span className="value">{applicationData.guarantorRelationship || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone Number:</span>
            <span className="value">{applicationData.guarantorPhoneNumber || "________________"}</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>ADDITIONAL INFORMATION</h3>
        <div className="detail-grid">
          <div className="detail-row full-width">
            <span className="label">Current Address:</span>
            <span className="value">{applicationData.currentAddress || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Employment Status:</span>
            <span className="value">{applicationData.employmentStatus || "________________"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Monthly Income:</span>
            <span className="value">{applicationData.monthlyIncome || "________________"}</span>
          </div>
          <div className="detail-row full-width">
            <span className="label">Reason for Moving:</span>
            <span className="value">{applicationData.reasonForMoving || "________________"}</span>
          </div>
          <div className="detail-row full-width">
            <span className="label">Special Requirements:</span>
            <span className="value">{applicationData.specialRequirements || "None"}</span>
          </div>
        </div>
      </div>

      <div className="declaration-section">
        <h3>DECLARATION</h3>
        <p>
          I hereby declare that the information provided in this application is true and correct to the best of my knowledge. 
          I understand that any false information may lead to the rejection of my application or termination of tenancy.
        </p>
        
        <div className="signatures">
          <div className="signature-block">
            <div className="signature-line"></div>
            <p>Applicant's Signature</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="signature-block">
            <div className="signature-line"></div>
            <p>Landlord/Agent's Signature</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  const renderAgreement = () => (
    <div className="document-container agreement-container">
      <div className="document-header">
     
      </div>

      <div className="document-body agreement">
        <h3>
          THIS TENANCY AGREEMENT IS MADE ON THE{" "}
          {new Date().toLocaleDateString()}
        </h3>

        <div className="parties">
          <div className="party">
            <h4>BETWEEN</h4>
            <p>
              <strong className="capitalize">
                {agreementData.landlordName}
              </strong>
            </p>
            <p className="capitalize">
              Address: {agreementData.landlordAddress}
            </p>
            <p>(Hereinafter called "the Landlord")</p>
          </div>

          <div className="party">
            <h4>AND</h4>
            <p>
              <strong className="capitalize">{agreementData.tenantName}</strong>
            </p>
            <p className="capitalize">Address: {agreementData.tenantAddress}</p>
            <p>(Hereinafter called "the Tenant")</p>
          </div>
        </div>

        <div className="terms">
          <h4>TERMS OF AGREEMENT</h4>
          <ol>
            <li>
              The Landlord agrees to let and the Tenant agrees to take the
              property known as:{" "}
              <strong className="capitalize">{shop?.name || "PROPERTY"}{" "} @
                {agreementData.propertyAddress}
              </strong>
            </li>
            <li>
              The tenancy shall be for a term of{" "}
              <strong>{agreementData.duration}</strong> commencing on{" "}
              <strong>{formatDate(agreementData.commencementDate)}</strong>
            </li>
            <li>
              The Tenant shall pay a rent of{" "}
              <strong>{agreementData.rentAmount}</strong> yearly
            </li>
            <li>
              The Tenant shall pay a caution fee of{" "}
              <strong>{agreementData.securityDeposit}</strong> which shall be
              refundable at the end of the tenancy
            </li>
            <li>
              The Tenant shall be responsible for his/her{" "}
              <strong>{agreementData.utilities}</strong>
            </li>
          </ol>
        </div>

        <div className="signatures">
          <div className="signature-block">
            <div className="signature-line"></div>
            <p>Landlord's Signature</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="signature-block">
            <div className="signature-line"></div>
            <p>Tenant's Signature</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuitNotice = () => (
    <div className="document-container notice-container">
      <div className="document-header">
     
      </div>

      <div className="document-body">
        <div className="notice-details">
          <p>Date: {formatDate(noticeData.noticeDate)}</p>
          <p className="capitalize">
            To: {noticeData.tenantName || "Tenant Name"}
          </p>
          <p className="capitalize">Address: {noticeData.propertyAddress}</p>

          <p className="notice-text">
            You are hereby given notice to quit and deliver up possession of the
            premises known as{" "}
            <strong className="capitalize">{noticeData.propertyAddress}</strong>
            on or before <strong>{formatDate(noticeData.vacateDate)}</strong>.
          </p>

          <p className="notice-text">
            This notice is given because: <strong>{noticeData.reason}</strong>
          </p>

          {noticeData.additionalNotes && (
            <p className="notice-text">
              Additional Notes: {noticeData.additionalNotes}
            </p>
          )}

          <p className="notice-warning">
            If you fail to quit the premises on or before the date specified,
            legal action will be taken against you to recover possession of the
            premises, and you may be liable for costs and expenses incurred.
          </p>
        </div>

        <div className="signature-section">
          <div className="signature-line"></div>
          <p>Landlord's Signature</p>
          <p>Date: {formatDate(noticeData.noticeDate)}</p>
        </div>
      </div>
    </div>
  );

  const renderRentIncrease = () => (
    <div className="document-container increase-container">
      <div className="document-header">
        {/* <h2>RENT INCREASE NOTICE</h2> */}
        {/* {shop?.logo_url && (
          <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />
        )}
        {!shop?.logo_url && (
          <div className="logo">{shop?.name || "REALTY PRO"}</div>
        )} */}
      </div>

      <div className="document-body">
        <div className="increase-details">
          <div className="detail-row">
            <span className="label">Notice Date:</span>
            <span className="value">{formatDate(increaseData.noticeDate)}</span>
          </div>
          <div className="detail-row">
            <span className="label">To:</span>
            <span className="value capitalize">
              {increaseData.tenantName || "Tenant Name"}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Property Address:</span>
            <span className="value capitalize">
              {increaseData.propertyAddress}
            </span>
          </div>
        </div>

        <div className="increase-comparison">
          <div className="rent-box current-rent">
            <h4>Current Rent</h4>
            <div className="rent-amount">
              {increaseData.currentRent || "₦0"}
            </div>
            <p>Per Year</p>
          </div>
          <div className="rent-box new-rent">
            <h4>New Rent</h4>
            <div className="rent-amount">{increaseData.newRent || "₦0"}</div>
            <p>Per Year</p>
          </div>
        </div>

        <div className="increase-summary">
          <h4>Rent Increase Summary</h4>
          <p>
            Increase Amount:{" "}
            <strong>{increaseData.increaseAmount || "₦0"}</strong>
          </p>
          <p>
            Increase Percentage:{" "}
            <strong>{increaseData.increasePercentage || "0%"}</strong>
          </p>
          <p>
            Effective Date:{" "}
            <strong>{formatDate(increaseData.effectiveDate)}</strong>
          </p>
        </div>

        <div className="notice-text">
          This notice serves to inform you that your yearly rent will be
          increased as detailed above. The new rent amount will take effect from{" "}
          <strong>{formatDate(increaseData.effectiveDate)}</strong>.
        </div>

        {increaseData.reason && (
          <div className="notice-text">
            Reason for increase: <strong>{increaseData.reason}</strong>
          </div>
        )}

        {increaseData.additionalNotes && (
          <div className="notice-text">
            Additional Information: {increaseData.additionalNotes}
          </div>
        )}

        <div className="notice-text">
          Please ensure that all future payments reflect this new amount. If you
          have any questions or concerns, please do not hesitate to contact us.
        </div>

        <div className="signature-section">
          <div className="signature-line"></div>
          <p>Landlord's Signature</p>
          <p>Date: {formatDate(increaseData.noticeDate)}</p>
        </div>
      </div>
    </div>
  );

  const renderHouseRules = () => (
    <div className="document-container rules-container">
      <div className="document-header">
        {/* <h2>HOUSE RULES</h2>
        {shop?.logo_url && (
          <img src={shop.logo_url} alt="Shop Logo" className="shop-logo" />
        )}
        {!shop?.logo_url && (
          <div className="logo">{shop?.name || "REALTY PRO"}</div>
        )} */}
      </div>

      <div className="document-body rules">
        <h3>RULES AND REGULATIONS @ {shop?.name.toUpperCase()}</h3>

        <ol>
          <li>
            Quiet hours are from 10:00 PM to 7:00 AM. Please keep noise to a
            minimum during these hours.
          </li>
          <li>
            No pets are allowed without prior written consent from the landlord.
          </li>
          <li>
            Tenants are responsible for keeping their units clean and sanitary.
          </li>
          <li>Smoking is strictly prohibited inside the building.</li>
          <li>
            No alterations to the premises without the landlord's written
            consent.
          </li>
          <li>Properly dispose of garbage in designated areas only.</li>
          <li>Report any maintenance issues promptly to the landlord.</li>
          <li>Park only in designated areas and do not block access roads.</li>
          <li>Guests are allowed but must not disturb other residents.</li>
          <li>
            Utilities must be paid promptly as agreed in the tenancy agreement.
          </li>
        </ol>

        <div className="acknowledgement">
          <p className="capitalize">
            I, {tenantData.name}, acknowledge that I have received, read, and
            understood these house rules and agree to abide by them.
          </p>

          <div className="signature-section">
            <div className="signature-line"></div>
            <p>Tenant's Signature</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const validateReceiptData = (receiptData) => {
  const requiredFields = [
    'name', 'property', 'amount', 'paymentDate', 
    'paymentMethod', 'receiptNumber'
  ];
  
  const missingFields = requiredFields.filter(field => !receiptData[field]);
  
  if (missingFields.length > 0) {
    toast.error(`Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  return true;
};

  const renderReprintReceipt = () => (
    <div className="landlordreprint-section">
      <h3>Reprint Previous Receipts</h3>
      <div className="landlordsearch-box">
        <input
          type="text"
          placeholder="Search by tenant name or property address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchPayments()}
          className="capitalize-input"
        />
        <button
          className="landlordbtn landlordbtn-primary"
          onClick={searchPayments}
          disabled={isSearching}
        >
          {isSearching ? <FaSpinner className="spinner" /> : <FaSearch />}
          Search
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="landlordsearch-results">
          <h4>Search Results</h4>
          <div className="landlordreceipts-list">
            {searchResults.map((receipt) => (
              <div key={receipt.id} className="landlordreceipt-item">
                <div className="landlordreceipt-info">
                  <h5 className="capitalize">{receipt.document_data.name}</h5>
                  <p className="capitalize">{receipt.document_data.property}</p>
                  <p>
                    ₦{receipt.document_data.amount} •{" "}
                    {formatDate(receipt.document_data.paymentDate)}
                  </p>
                </div>
                <button
                  className="landlordbtn landlordbtn-secondary"
                  onClick={() => loadReceiptForReprint(receipt)}
                >
                  <FaRedo /> Reprint
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="landlordrecent-receipts">
        <h4>Recent Receipts</h4>

        {savedReceipts.length === 0 ? (
          <p>No receipts found. Create your first receipt above.</p>
        ) : (
          <div className="landlordreceipts-list">
            {savedReceipts.slice(0, 5).map((receipt) => (
              <div key={receipt.id} className="landlordreceipt-item">
                <div className="landlordreceipt-info">
                  <h5 className="capitalize">{receipt.document_data.name}</h5>
                  <p className="capitalize">{receipt.document_data.property}</p>
                  <p>
                    {receipt.document_data.amount} •{" "}
                    {formatDate(receipt.document_data.paymentDate)}
                  </p>
                </div>
                <button
                  className="landlordbtn landlordbtn-secondary"
                  onClick={() => loadReceiptForReprint(receipt)}
                >
                  <FaRedo /> Reprint
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // if (loading) {
  //   return (
  //     <div className="loading-container">
  //       <FaSpinner className="spinner" />
  //       <p>Loading property information...</p>
  //     </div>
  //   );
  // }

   if (loading) return <Loading />;


  return (
    <div className="landlord-dashboard">
      {/* Mobile Navigation */}
      <div className="landlord-mobile-nav">
        <button className="landlord-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
      <h2 className="landlord-mobile-title">
  {activeTab === "receipt" && "Rent Receipt"}
  {activeTab === "reprint" && "Reprint Receipt"}
  {activeTab === "agreement" && "Tenancy Agreement"}
  {activeTab === "notice" && "Quit Notice"}
  {activeTab === "rules" && "House Rules"}
  {activeTab === "increase" && "Rent Increase"}
  {activeTab === "application" && "Tenant Application"}
  {activeTab === "reminder" && "Rent Reminder"}
</h2>
<div className="landlord-mobile-actions">
  {activeTab !== "reprint" && (
    <>
      <button
        className="landlord-mobile-action-btn"
        onClick={handleEnhancedPrint}
        disabled={saveLoading}
        data-tooltip-id="action-tooltip"
        data-tooltip-content={saveLoading ? "Saving..." : "Save & Print Document"}
      >
        {saveLoading ? (
          <FaSpinner className="spinner" />
        ) : (
          <FaPrint />
        )}
      </button>
      
      <button
        className="landlord-mobile-action-btn"
        onClick={handleDownload}
        data-tooltip-id="action-tooltip"
        data-tooltip-content="Download Document"
      >
        <FaDownload />
      </button>
      
      <button
        className="landlord-mobile-action-btn"
        onClick={handleShare}
        data-tooltip-id="action-tooltip"
        data-tooltip-content="Share Document"
      >
        <FaShare />
      </button>
      
      <button
        className="landlord-mobile-action-btn"
        onClick={handleSaveDocument}
        disabled={saveLoading}
        data-tooltip-id="action-tooltip"
        data-tooltip-content={saveLoading ? "Saving..." : "Save Document Only"}
      >
        {saveLoading ? (
          <FaSpinner className="spinner" />
        ) : (
          <FaFilePdf />
        )}
      </button>
    </>
  )}
</div>

<Tooltip id="action-tooltip" place="bottom" effect="solid" />
      </div>

      {/* Mobile Tab Navigation */}
      <div className="landlord-mobile-tabs">
        <button
          className={`landlord-mobile-tab ${
            activeTab === "receipt" ? "active" : ""
          }`}
          onClick={() => setActiveTab("receipt")}
        >
          <FaReceipt />
          <span>Receipt</span>
        </button>
        <button
          className={`landlord-mobile-tab ${
            activeTab === "reprint" ? "active" : ""
          }`}
          onClick={() => setActiveTab("reprint")}
        >
          <FaHistory />
          <span>Reprint</span>
        </button>
        <button
          className={`landlord-mobile-tab ${
            activeTab === "agreement" ? "active" : ""
          }`}
          onClick={() => setActiveTab("agreement")}
        >
          <FaFileContract />
          <span>Agreement</span>
        </button>
        <button
          className={`landlord-mobile-tab ${
            activeTab === "notice" ? "active" : ""
          }`}
          onClick={() => setActiveTab("notice")}
        >
          <FaClipboardList />
          <span>Notice</span>
        </button>
        <button
          className={`landlord-mobile-tab ${
            activeTab === "increase" ? "active" : ""
          }`}
          onClick={() => setActiveTab("increase")}
        >
          <FaChartLine />
          <span>Increase</span>
        </button>
        <button
          className={`landlord-mobile-tab ${
            activeTab === "rules" ? "active" : ""
          }`}
          onClick={() => setActiveTab("rules")}
        >
          <FaUsers />
          <span>Rules</span>
        </button>

        <button
  className={`landlord-mobile-tab ${
    activeTab === "application" ? "active" : ""
  }`}
  onClick={() => setActiveTab("application")}
>
  <FaUser />
  <span>Application</span>
</button>

<button
  className={`landlord-mobile-tab ${
    activeTab === "reminder" ? "active" : ""
  }`}
  onClick={() => setActiveTab("reminder")}
>
  <FaMoneyBillWave />
  <span>Reminder</span>
</button>
      </div>

      {/* Main Content */}
      <div className="landlorddashboard-content">
        <div className="landlordmain-content">
          <div className="landlordcontent-header">
            <h3 className="capitalize">{shop.name.toUpperCase()}</h3>
            {/* Desktop Actions */}
            {/* {activeTab !== 'reprint' && (
                <div className="landlord-desktop-actions">
                  <button className="landlordbtn landlordbtn-primary" onClick={handleEnhancedPrint}>
                    <FaPrint /> Print
                  </button>
                  <button className="landlordbtn landlordbtn-primary" onClick={handleDownload}>
                    <FaDownload /> Download
                  </button>
                  <button className="landlordbtn landlordbtn-primary" onClick={handleShare}>
                    <FaShare /> Share
                  </button>
                  <button className="landlordbtn landlordbtn-secondary" onClick={handleSaveDocument} disabled={saveLoading}>
                    {saveLoading ? <FaSpinner className="spinner" /> : <FaFilePdf />} Save
                  </button>
                </div>
              )} */}
          </div>

          {activeTab === "reprint" ? (
            renderReprintReceipt()
          ) : (
            <>
              <div className="landlordform-section">
                <h3>Document Details</h3>
                <div className="landlordform-grid">
                  {activeTab === "receipt" && (
                    <>
                      <div className="landlordform-group">
                        <label>Tenant Name</label>
                        <select
                          value={tenantData.name}
                          onChange={(e) =>
                            handleTenantSelect(e.target.value, "tenant")
                          }
                          className="capitalize-input"
                        >
                          <option value="">Select a tenant</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.name}>
                              {tenant.name} - {tenant.apartment_type} (₦
                              {tenant.rent_amount})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="landlordform-group">
                        <label>Property Address</label>
                        <input
                          type="text"
                          value={tenantData.property}
                          onChange={(e) =>
                            handleInputChange(
                              "tenant",
                              "property",
                              e.target.value
                            )
                          }
                          className="capitalize-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Amount (₦)</label>
                        <input
                          type="text"
                          value={tenantData.amount}
                          onChange={(e) =>
                            handleCurrencyChange(
                              "tenant",
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="₦0.00"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Payment Method</label>
                        <select
                          value={tenantData.paymentMethod}
                          onChange={(e) =>
                            handleInputChange(
                              "tenant",
                              "paymentMethod",
                              e.target.value
                            )
                          }
                          className="capitalize-input"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="POS">POS</option>
                          <option value="Mobile Money">Mobile Money</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="landlordform-group">
                        <label>Lease Start Date</label>
                        <DatePicker
                          selected={tenantData.startDate}
                          onChange={(date) =>
                            handleDateChange("startDate", date)
                          }
                          dateFormat="MMMM d, yyyy"
                          placeholderText="Select start date"
                          className="landlorddate-picker-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Lease End Date</label>
                        <DatePicker
                          selected={tenantData.endDate}
                          onChange={(date) => handleDateChange("endDate", date)}
                          dateFormat="MMMM d, yyyy"
                          placeholderText="Select end date"
                          className="landlorddate-picker-input"
                          minDate={tenantData.startDate}
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Payment Date</label>
                        <DatePicker
                          selected={tenantData.paymentDate}
                          onChange={(date) =>
                            handleDateChange("paymentDate", date)
                          }
                          dateFormat="MMMM d, yyyy"
                          className="landlorddate-picker-input"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === "agreement" && (
                    <>
                      <div className="landlordform-group">
                        <label>Landlord Name</label>
                        <input
                          type="text"
                          value={agreementData.landlordName}
                          onChange={(e) =>
                            handleInputChange(
                              "agreement",
                              "landlordName",
                              e.target.value
                            )
                          }
                          className="capitalize-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Tenant Name</label>
                        <select
                          value={agreementData.tenantName}
                          onChange={(e) =>
                            handleTenantSelect(e.target.value, "agreement")
                          }
                          className="capitalize-input"
                        >
                          <option value="">Select a tenant</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.name}>
                              {tenant.name} - {tenant.apartment_type} (₦
                              {tenant.rent_amount})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="landlordform-group">
                        <label>Property Address</label>
                        <input
                          type="text"
                          value={agreementData.propertyAddress}
                          onChange={(e) =>
                            handleInputChange(
                              "agreement",
                              "propertyAddress",
                              e.target.value
                            )
                          }
                          className="capitalize-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Yearly Rent (₦)</label>
                        <input
                          type="text"
                          value={agreementData.rentAmount}
                          onChange={(e) =>
                            handleCurrencyChange(
                              "agreement",
                              "rentAmount",
                              e.target.value
                            )
                          }
                          placeholder="₦0.00"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Caution Fee (₦)</label>
                        <input
                          type="text"
                          value={agreementData.securityDeposit}
                          onChange={(e) =>
                            handleCurrencyChange(
                              "agreement",
                              "securityDeposit",
                              e.target.value
                            )
                          }
                          placeholder="₦0.00"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Agreement Start Date</label>
                        <DatePicker
                          selected={agreementData.commencementDate}
                          onChange={(date) =>
                            setAgreementData({
                              ...agreementData,
                              commencementDate: date,
                            })
                          }
                          dateFormat="MMMM d, yyyy"
                          className="landlorddate-picker-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Rent Due Date</label>
                        <input
                          type="text"
                          value={agreementData.rentDueDate}
                          onChange={(e) =>
                            handleInputChange(
                              "agreement",
                              "rentDueDate",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 1st of every month"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Tenancy Duration</label>
                        <input
                          type="text"
                          value={agreementData.duration}
                          onChange={(e) =>
                            handleInputChange(
                              "agreement",
                              "duration",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 12 months"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === "notice" && (
                    <>
                      <div className="landlordform-group">
                        <label>Tenant Name</label>
                        <select
                          value={noticeData.tenantName}
                          onChange={(e) =>
                            handleTenantSelect(e.target.value, "notice")
                          }
                          className="capitalize-input"
                        >
                          <option value="">Select a tenant</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.name}>
                              {tenant.name} - {tenant.apartment_type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="landlordform-group">
                        <label>Property Address</label>
                        <input
                          type="text"
                          value={noticeData.propertyAddress}
                          onChange={(e) =>
                            handleInputChange(
                              "notice",
                              "propertyAddress",
                              e.target.value
                            )
                          }
                          className="capitalize-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Notice Period (Days)</label>
                        <select
                          value={noticeData.noticePeriod}
                          onChange={(e) =>
                            handleInputChange(
                              "notice",
                              "noticePeriod",
                              e.target.value
                            )
                          }
                        >
                          <option value="7">7 Days</option>
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                          <option value="90">90 Days</option>
                        </select>
                      </div>
                      <div className="landlordform-group">
                        <label>Notice Date</label>
                        <DatePicker
                          selected={noticeData.noticeDate}
                          onChange={(date) =>
                            handleInputChange("notice", "noticeDate", date)
                          }
                          dateFormat="MMMM d, yyyy"
                          className="landlorddate-picker-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Vacate Date</label>
                        <DatePicker
                          selected={noticeData.vacateDate}
                          onChange={(date) =>
                            handleInputChange("notice", "vacateDate", date)
                          }
                          dateFormat="MMMM d, yyyy"
                          className="landlorddate-picker-input"
                          readOnly
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Reason for Notice</label>
                        <select
                          value={noticeData.reason}
  onChange={(e) => handleInputChange("notice", "reason", e.target.value)}
                        >
                       <option value="Expiry of tenancy">Expiry of tenancy</option>
  <option value="Breach of agreement">Breach of agreement</option>
  <option value="Non-payment of rent">Non-payment of rent</option>
  <option value="Property renovation">Property renovation</option>
  <option value="Personal use">Personal use</option>
  <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="landlordform-group full-width">
                        <label>Additional Notes (Optional)</label>
                        <textarea
                          value={noticeData.additionalNotes}
                          onChange={(e) =>
                            handleInputChange(
                              "notice",
                              "additionalNotes",
                              e.target.value
                            )
                          }
                          placeholder="Any additional information for the tenant..."
                          rows="3"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === "increase" && (
                    <>
                      <div className="landlordform-group">
                        <label>Tenant Name</label>
                        <select
                          value={increaseData.tenantName}
                          onChange={(e) =>
                            handleTenantSelect(e.target.value, "increase")
                          }
                          className="capitalize-input"
                        >
                          <option value="">Select a tenant</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.name}>
                              {tenant.name} - {tenant.apartment_type} (₦
                              {tenant.rent_amount})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="landlordform-group">
                        <label>Property Address</label>
                        <input
                          type="text"
                          value={increaseData.propertyAddress}
                          onChange={(e) =>
                            handleInputChange(
                              "increase",
                              "propertyAddress",
                              e.target.value
                            )
                          }
                          className="capitalize-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Current Yearly Rent (₦)</label>
                        <input
                          type="text"
                          value={increaseData.currentRent}
                          onChange={(e) =>
                            handleCurrencyChange(
                              "increase",
                              "currentRent",
                              e.target.value
                            )
                          }
                          placeholder="₦0.00"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>New Yearly Rent (₦)</label>
                        <input
                          type="text"
                          value={increaseData.newRent}
                          onChange={(e) =>
                            handleCurrencyChange(
                              "increase",
                              "newRent",
                              e.target.value
                            )
                          }
                          placeholder="₦0.00"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Increase Amount (₦)</label>
                        <input
                          type="text"
                          value={increaseData.increaseAmount}
                          readOnly
                          className="readonly-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Increase Percentage</label>
                        <input
                          type="text"
                          value={increaseData.increasePercentage}
                          readOnly
                          className="readonly-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Notice Date</label>
                        <DatePicker
                          selected={increaseData.noticeDate}
                          onChange={(date) =>
                            handleInputChange("increase", "noticeDate", date)
                          }
                          dateFormat="MMMM d, yyyy"
                          className="landlorddate-picker-input"
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Effective Date</label>
                        <DatePicker
                          selected={increaseData.effectiveDate}
                          onChange={(date) =>
                            handleInputChange("increase", "effectiveDate", date)
                          }
                          dateFormat="MMMM d, yyyy"
                          className="landlorddate-picker-input"
                          minDate={new Date()}
                        />
                      </div>
                      <div className="landlordform-group">
                        <label>Reason for Increase</label>
                        <select
                          value={increaseData.reason}
  onChange={(e) => handleInputChange("increase", "reason", e.target.value)}
                          
                        >
                         <option value="Market adjustment">Market adjustment</option>
  <option value="Property improvements">Property improvements</option>
  <option value="Increased operating costs">Increased operating costs</option>
  <option value="Inflation">Inflation</option>
  <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="landlordform-group full-width">
                        <label>Additional Notes (Optional)</label>
                        <textarea
                          value={increaseData.additionalNotes}
                          onChange={(e) =>
                            handleInputChange(
                              "increase",
                              "additionalNotes",
                              e.target.value
                            )
                          }
                          placeholder="Any additional information for the tenant..."
                          rows="3"
                        />
                      </div>
              
                </>
                  )}
   {activeTab === "application" && (
  <>
    <div className="landlordform-group">
      <label>Full Name *</label>
      <input
        type="text"
        value={applicationData.fullName}
        onChange={(e) => handleInputChange("application", "fullName", e.target.value)}
        className="capitalize-input"
        placeholder="Enter full name"
      />
    </div>
    <div className="landlordform-group">
      <label>Phone Number *</label>
      <input
        type="tel"
        value={applicationData.phoneNumber}
        onChange={(e) => handleInputChange("application", "phoneNumber", e.target.value)}
        placeholder="Enter phone number"
      />
    </div>
    <div className="landlordform-group">
      <label>Email Address</label>
      <input
        type="email"
        value={applicationData.emailAddress}
        onChange={(e) => handleInputChange("application", "emailAddress", e.target.value)}
        placeholder="Enter email address"
      />
    </div>
    <div className="landlordform-group">
      <label>Apartment Type *</label>
      <select
        value={applicationData.apartmentType}
        onChange={(e) => handleInputChange("application", "apartmentType", e.target.value)}
      >
        <option value="">Select apartment type</option>
        <option value="Studio">Studio</option>
        <option value="1 Bedroom">1 Bedroom</option>
        <option value="2 Bedrooms">2 Bedrooms</option>
        <option value="3 Bedrooms">3 Bedrooms</option>
        <option value="4 Bedrooms">4 Bedrooms</option>
        <option value="Duplex">Duplex</option>
        <option value="Penthouse">Penthouse</option>
      </select>
    </div>
    <div className="landlordform-group">
      <label>Rooms Occupied *</label>
      <input
        type="text"
        value={applicationData.roomsOccupied}
        onChange={(e) => handleInputChange("application", "roomsOccupied", e.target.value)}
        placeholder="e.g., 2 rooms, entire apartment, etc."
      />
    </div>
    
    <div className="form-section-divider">
      <h4>Next of Kin Information</h4>
    </div>
    
    <div className="landlordform-group">
      <label>Next of Kin Full Name *</label>
      <input
        type="text"
        value={applicationData.nextOfKinFullName}
        onChange={(e) => handleInputChange("application", "nextOfKinFullName", e.target.value)}
        className="capitalize-input"
        placeholder="Enter next of kin full name"
      />
    </div>
    <div className="landlordform-group">
      <label>Relationship *</label>
      <select
        value={applicationData.nextOfKinRelationship}
        onChange={(e) => handleInputChange("application", "nextOfKinRelationship", e.target.value)}
      >
        <option value="">Select relationship</option>
        <option value="Spouse">Spouse</option>
        <option value="Parent">Parent</option>
        <option value="Sibling">Sibling</option>
        <option value="Child">Child</option>
        <option value="Relative">Relative</option>
        <option value="Friend">Friend</option>
      </select>
    </div>
    <div className="landlordform-group">
      <label>Next of Kin Phone Number *</label>
      <input
        type="tel"
        value={applicationData.nextOfKinPhoneNumber}
        onChange={(e) => handleInputChange("application", "nextOfKinPhoneNumber", e.target.value)}
        placeholder="Enter phone number"
      />
    </div>
    
    <div className="form-section-divider">
      <h4>Guarantor Information</h4>
    </div>
    
    <div className="landlordform-group">
      <label>Guarantor Full Name *</label>
      <input
        type="text"
        value={applicationData.guarantorFullName}
        onChange={(e) => handleInputChange("application", "guarantorFullName", e.target.value)}
        className="capitalize-input"
        placeholder="Enter guarantor full name"
      />
    </div>
    <div className="landlordform-group">
      <label>Relationship *</label>
      <select
        value={applicationData.guarantorRelationship}
        onChange={(e) => handleInputChange("application", "guarantorRelationship", e.target.value)}
      >
        <option value="">Select relationship</option>
        <option value="Employer">Employer</option>
        <option value="Relative">Relative</option>
        <option value="Friend">Friend</option>
        <option value="Business Partner">Business Partner</option>
      </select>
    </div>
    <div className="landlordform-group">
      <label>Guarantor Phone Number *</label>
      <input
        type="tel"
        value={applicationData.guarantorPhoneNumber}
        onChange={(e) => handleInputChange("application", "guarantorPhoneNumber", e.target.value)}
        placeholder="Enter phone number"
      />
    </div>
    
    <div className="form-section-divider">
      <h4>Additional Information</h4>
    </div>
    
    <div className="landlordform-group">
      <label>Current Address</label>
      <textarea
        value={applicationData.currentAddress}
        onChange={(e) => handleInputChange("application", "currentAddress", e.target.value)}
        placeholder="Enter current residential address"
        rows="2"
      />
    </div>
    <div className="landlordform-group">
      <label>Employment Status</label>
      <select
        value={applicationData.employmentStatus}
        onChange={(e) => handleInputChange("application", "employmentStatus", e.target.value)}
      >
        <option value="">Select employment status</option>
        <option value="Employed">Employed</option>
        <option value="Self-Employed">Self-Employed</option>
        <option value="Student">Student</option>
        <option value="Unemployed">Unemployed</option>
        <option value="Retired">Retired</option>
      </select>
    </div>
    <div className="landlordform-group">
      <label>Monthly Income (₦)</label>
      <input
        type="text"
        value={applicationData.monthlyIncome}
        onChange={(e) => handleCurrencyChange("application", "monthlyIncome", e.target.value)}
        placeholder="₦0.00"
      />
    </div>
    <div className="landlordform-group">
      <label>Reason for Moving</label>
      <textarea
        value={applicationData.reasonForMoving}
        onChange={(e) => handleInputChange("application", "reasonForMoving", e.target.value)}
        placeholder="Why are you moving?"
        rows="2"
      />
    </div>
    <div className="landlordform-group full-width">
      <label>Special Requirements/Notes</label>
      <textarea
        value={applicationData.specialRequirements}
        onChange={(e) => handleInputChange("application", "specialRequirements", e.target.value)}
        placeholder="Any special requirements or additional notes..."
        rows="3"
      />
    </div>
  </>
)}

{activeTab === "reminder" && (
  <>
    <div className="landlordform-group">
      <label>Tenant Name</label>
      <select
        value={reminderData.tenantName}
        onChange={(e) => handleTenantSelect(e.target.value, "reminder")}
        className="capitalize-input"
      >
        <option value="">Select a tenant</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.name}>
            {tenant.name} - {tenant.apartment_type} (₦{tenant.rent_amount})
          </option>
        ))}
      </select>
    </div>
    <div className="landlordform-group">
      <label>Property Address</label>
      <input
        type="text"
        value={reminderData.propertyAddress}
        onChange={(e) => handleInputChange("reminder", "propertyAddress", e.target.value)}
        className="capitalize-input"
      />
    </div>
    <div className="landlordform-group">
      <label>Reminder Type</label>
      <select
       value={reminderData.reminderType}
  onChange={(e) => handleInputChange("reminder", "reminderType", e.target.value)}
      >
       <option value="friendly">Friendly Reminder (5 days before)</option>
  <option value="due_date">Due Date Reminder</option>
  <option value="late">Late Payment Reminder (5 days after)</option>
  <option value="final">Final Notice (10 days after)</option>
      </select>
    </div>
    <div className="landlordform-group">
      <label>Amount Due (₦)</label>
      <input
        type="text"
        value={reminderData.amountDue}
        onChange={(e) => handleInputChange("reminder", "amountDue", e.target.value)}
        placeholder="₦0.00"
      />
    </div>
    <div className="landlordform-group">
      <label>Due Date</label>
      <DatePicker
        selected={reminderData.dueDate}
        onChange={(date) => handleInputChange("reminder", "dueDate", date)}
        dateFormat="MMMM d, yyyy"
        className="landlorddate-picker-input"
      />
    </div>
    <div className="landlordform-group">
      <label>Late Fee (₦) - Optional</label>
      <input
        type="text"
        value={reminderData.lateFee}
        onChange={(e) => handleInputChange("reminder", "lateFee", e.target.value)}
        placeholder="₦0.00"
      />
    </div>
    <div className="landlordform-group full-width">
      <label>Reminder Message</label>
      <textarea
        value={reminderData.message}
        onChange={(e) => handleInputChange("reminder", "message", e.target.value)}
        rows="4"
        placeholder="Enter your reminder message..."
      />
    </div>
  </>
)}
    
                  
                </div>

                
              </div>
              

              <div className="document-preview">
                {activeTab === "receipt" && renderReceipt()}
                {activeTab === "agreement" && renderAgreement()}
                {activeTab === "notice" && renderQuitNotice()}
                {activeTab === "increase" && renderRentIncrease()}
                {activeTab === "rules" && renderHouseRules()}
                {activeTab === "application" && renderTenantApplication()}
                {activeTab === "reminder" && renderRentReminder()}
              </div>
            </>
            
          )}
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;
