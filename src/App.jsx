import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth-store";

import HowItWorks from "./pages/HowItWorks";
import Feedback from "./pages/Feedback";
import ModernReceipt from "./components/ModernReceipt";
import PosMerchantFlow from "./components/PosMerchantFlow";

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

import "./styles/base.css";
import "./index.css";

export default function App() {
  const { user, profileComplete } = useAuthStore(); 
  // 🔑 Make sure your store tracks if profile is complete or not

  return (
    <div className="app-base">
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/login" element={user ? <Navigate to="/shops" /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/shops" /> : <Signup />} />
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
            </Route>

            {/* Static Pages */}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/howitworks" element={<HowItWorks />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/modern-receipt" element={<ModernReceipt />} />
            <Route path="/pos-merchant-flow" element={<PosMerchantFlow />} />

            {/* Catch-all → Landing */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
