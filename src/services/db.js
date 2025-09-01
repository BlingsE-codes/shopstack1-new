import Dexie from "dexie";

export const db = new Dexie("shopstackDB");

db.version(1).stores({
  sales: "++id, product_id, quantity, amount, shop_id, created_at, synced",
  transactions: "++id, total_amount, shop_id, created_at, synced",
  transaction_items: "++id, transaction_id, product_id, name, quantity, price, amount",
});
