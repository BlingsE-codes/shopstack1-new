import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/auth-store";

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
import Footer from "./components/Footer";
import EmailConfirmation from "./pages/EmailConfirmation";
import Subscribe from "./pages/Subscribe";
import Debtors from "./components/Debtors";
import Landing from "./pages/Landing"

import "./index.css";

export default function App() {
  const { user } = useAuthStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
<div style={{ flex: 1 }}>
 <Routes>
  {/* Landing Page is PUBLIC and FIRST */}
  <Route path="/" element={<Landing />} />
  <Route path="/subscribe" element={<Subscribe />} />

  {/* Auth Routes - PUBLIC */}
  <Route path="login" element={<Login />} />
  <Route path="signup" element={<Signup />} />
  <Route path="confirm-email" element={<EmailConfirmation />} />

  {/* Protected Routes */}
  <Route
    path="shops"
    element={
      <ProtectedRoute>
        <Shops />
      </ProtectedRoute>
    }
  />
  <Route
    path="create-shop"
    element={
      <ProtectedRoute>
        <CreateShop />
      </ProtectedRoute>
    }
  />
  <Route
    path="shops/:id"
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
    {/* <Route path="subscribe" element={<Subscribe />} /> */}
    <Route path="debtors" element={<Debtors />} />
  </Route>
</Routes>

</div>
<Footer className={user ? "footer show" : "footer"} />
    </div>
  );
}
