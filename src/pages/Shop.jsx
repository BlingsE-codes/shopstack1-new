import { Link, Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
// import "../styles/shop.css";
import { useShopStore } from "../store/shop-store";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../styles/shop.css";

export default function Shop() {
  const { id } = useParams();
  const { shop } = useShopStore();
  useEffect(() => {}, []);
  return (
    <div>
      <div className="shop-header-in">
        <NavLink
          to={`/shops/${id}`}
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Overview
        </NavLink>
        <NavLink
          to={`/shops/${id}/products`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Products
        </NavLink>
        <NavLink
          to={`/shops/${id}/sales`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Sales
        </NavLink>
        <NavLink
          to={`/shops/${id}/expenses`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Expenses
        </NavLink>
        <NavLink
          to={`/shops/${id}/profile`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Profile
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
