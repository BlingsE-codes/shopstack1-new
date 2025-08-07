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

import "./index.css";

export default function App() {
  const { user } = useAuthStore();

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <ProtectedRoute>
              <Shops />
            </ProtectedRoute>
          }
        />

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
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Routes>

      <Footer className={user ? "footer show" : "footer"} />
    </>
  );
}
