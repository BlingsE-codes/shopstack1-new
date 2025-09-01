import React from "react";
import { useShopStore } from "/src/store/shop-store";

export default function SalonShop() {

     const { shop } = useShopStore();
  // Sample salon services — ideally from DB
  const services = [
    { id: 1, name: "Haircut", price: 1500 },
    { id: 2, name: "Beard Shave", price: 1000 },
    { id: 3, name: "Hair Styling", price: 2000 },
    { id: 4, name: "Hair Wash", price: 800 },
  ];

  return (
    <div className="salon-shop-card" style={styles.card}>
      <h2>{shop.name}</h2>
      <p>{shop.address}</p>
      <h3>Services & Prices</h3>
      <ul>
        {services.map((service) => (
          <li key={service.id} style={styles.serviceItem}>
            {service.name} - ₦{service.price.toLocaleString()}
            {/* Add buttons or inputs here to book or add to cart */}
          </li>
        ))}
      </ul>
      <p>
        <strong>Opening Hours:</strong> Mon-Sat, 9am - 7pm
      </p>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    maxWidth: 400,
  },
  serviceItem: {
    marginBottom: 8,
  },
};
