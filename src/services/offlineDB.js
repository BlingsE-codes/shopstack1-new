// services/offlineDB.js
export const offlineDB = {
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ShopStackOfflineDB', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('pendingProductUpdates')) {
          const store = db.createObjectStore('pendingProductUpdates', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('product_id', 'product_id', { unique: false });
        }
        
        // Create object store for pending sales
        if (!db.objectStoreNames.contains('pendingSales')) {
          const store = db.createObjectStore('pendingSales', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('shop_id', 'shop_id', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
        
        // Create object store for pending transactions
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          const store = db.createObjectStore('pendingTransactions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('shop_id', 'shop_id', { unique: false });
        }
        
        // Create object store for pending transaction items
        if (!db.objectStoreNames.contains('pendingTransactionItems')) {
          const store = db.createObjectStore('pendingTransactionItems', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('transaction_id', 'transaction_id', { unique: false });
        }
      };
    });
  },
  
  async addPendingSale(sale) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSales'], 'readwrite');
      const store = transaction.objectStore('pendingSales');
      const request = store.add({
        ...sale,
        created_at: new Date().toISOString(),
        status: 'pending'
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async addPendingTransaction(transactionData) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingTransactions'], 'readwrite');
      const store = transaction.objectStore('pendingTransactions');
      const request = store.add({
        ...transactionData,
        created_at: new Date().toISOString(),
        status: 'pending'
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async addPendingTransactionItems(items) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingTransactionItems'], 'readwrite');
      const store = transaction.objectStore('pendingTransactionItems');
      
      const requests = items.map(item => store.add(item));
      Promise.all(requests.map(req => 
        new Promise((res, rej) => {
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        })
      ))
      .then(results => resolve(results))
      .catch(error => reject(error));
    });
  },
  
  async getPendingSales() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSales'], 'readonly');
      const store = transaction.objectStore('pendingSales');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async getPendingTransactions() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingTransactions'], 'readonly');
      const store = transaction.objectStore('pendingTransactions');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async getPendingTransactionItems(transactionId) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingTransactionItems'], 'readonly');
      const store = transaction.objectStore('pendingTransactionItems');
      const index = store.index('transaction_id');
      const request = index.getAll(transactionId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async removePendingSale(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSales'], 'readwrite');
      const store = transaction.objectStore('pendingSales');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async removePendingTransaction(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingTransactions'], 'readwrite');
      const store = transaction.objectStore('pendingTransactions');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async removePendingTransactionItems(transactionId) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingTransactionItems'], 'readwrite');
      const store = transaction.objectStore('pendingTransactionItems');
      const index = store.index('transaction_id');
      const request = index.openCursor(transactionId);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  },
  
  async addPendingProductUpdate(productId, updates) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingProductUpdates'], 'readwrite');
      const store = transaction.objectStore('pendingProductUpdates');
      const request = store.add({
        product_id: productId,
        updates: updates,
        created_at: new Date().toISOString(),
        status: 'pending'
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async getPendingProductUpdates() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingProductUpdates'], 'readonly');
      const store = transaction.objectStore('pendingProductUpdates');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async removePendingProductUpdate(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingProductUpdates'], 'readwrite');
      const store = transaction.objectStore('pendingProductUpdates');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

