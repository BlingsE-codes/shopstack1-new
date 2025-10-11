// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth-store";
import ScrollToTop from "./components/ScrollToTop";
import Passwordreset from "./pages/PasswordRest";
import LandlordDashboard from "./components/LandlordDashboard";
import LandlordTenantManagement from "./components/LandlordTenantManagement";
import Landlordnavbar from "./components/Landlordnavbar";
import LandlordOverview from "./components/LandlordOverview";
import LandlordTenantDetailsPage from "./components/Landlordtenantdetailspage";


import HowItWorks from "./pages/HowItWorks";
import Feedback from "./pages/Feedback";
import ModernReceipt from "./components/ModernReceipt";
import PosMerchantFlow from "./components/PosMerchantFlow";
import PosSidebar from "./components/PosSidebar";
import Pospage from "./pages/Pospage";
import Landlordpage from "./pages/Landlordpage";
import PosBillsPage from "./pages/PosBillsPage";
// import PosReportPage from "./pages/Posreportpage";
import PosReportPage from "./pages/PosReportPage";


import ProtectedRoute from "./ProtectedRoute";
import Shop from "./pages/Shop";
import Shops from "./pages/Shops";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/products";
import Sales from "./components/sales";
import Expenses from "./components/Expenses";
import Profile from "./components/profile";
import CreateShop from "./pages/CreateShop";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import EmailConfirmation from "./pages/EmailConfirmation";
import Subscribe from "./pages/Subscribe";
import Debtors from "./components/Debtors";
import Landing from "./pages/Landing";
import SalonShop from "./components/shoptypes/SalonShop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Pricing from "./pages/Pricing";
import PosDashboard from "./components/PosDashboard";
import PosTransactions from "./pages/PosTransactions";
import PosAirtimePage from "./pages/PosAirtimePage";

import "./styles/base.css";
import "./index.css";

export default function App() {
  const { user, profileComplete } = useAuthStore();

  return (
    <div className="app-base">
      <ScrollToTop />
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route
              path="/login"
              element={user ? <Navigate to="/shops" /> : <Login />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/shops" /> : <Signup />}
            />
            <Route path="/confirm-email" element={<EmailConfirmation />} />

            {/* First-time user flow → Profile first */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  {!profileComplete ? <Profile /> : <Navigate to="/shops" />}
                </ProtectedRoute>
              }
            />

            {/* Authenticated Users → Shops */}
            <Route
              path="/shops"
              element={
                <ProtectedRoute>
                  <Shops />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-shop"
              element={
                <ProtectedRoute>
                  <CreateShop />
                </ProtectedRoute>
              }
            />

            {/* Shop-specific routes */}
            <Route
              path="/shops/:id"
              element={
                <ProtectedRoute>
                  <Shop />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="profile" element={<Profile />} />
              <Route path="debtors" element={<Debtors />} />
              <Route path="pos" element={<Pospage />} />
              <Route path="landlordpage" element={<Landlordpage />} />
            </Route>

            {/* POS Routes */}
            <Route path="/pospage/:shopId" element={<Pospage><PosDashboard/></Pospage>} />
            <Route path="/transactions/:shopId" element={<Pospage><PosTransactions /></Pospage>} />
            <Route path="/posairtimepage/:shopId" element={<Pospage><PosAirtimePage /></Pospage>} />
            <Route path="/posbillspage/:shopId" element={<Pospage><PosBillsPage /></Pospage>} />
            <Route path="/posreportpage/:shopId" element={<Pospage><PosReportPage /></Pospage>} />

            {/* Landlord Routes */}
            <Route path="/landlordpage/:shopId" element={<Landlordpage><LandlordDashboard/></Landlordpage>} />
            <Route path="/landlordtenantmanagement/:shopId" element={<Landlordpage><LandlordTenantManagement /></Landlordpage>} />
            <Route path="/landlordoverview/:shopId" element={<Landlordpage><LandlordOverview/></Landlordpage>} />
            <Route path="/landlordtenantdetailspage/:tenantId" element={<Landlordpage><LandlordTenantDetailsPage/></Landlordpage>} />
            {/* <Route path="/landlordtenantdetailspage/:shopId" element={<LandlordTenantDetailsPage />} /> */}


            {/* Static Pages */}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/howitworks" element={<HowItWorks />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/modern-receipt" element={<ModernReceipt />} />
            <Route path="/pos-merchant-flow" element={<PosMerchantFlow />} />
            <Route path="/pos-dashboard" element={<PosDashboard />} />
            <Route path="/passwordreset" element={<Passwordreset />} />
            <Route path="/pos-sidebar" element={<PosSidebar />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}