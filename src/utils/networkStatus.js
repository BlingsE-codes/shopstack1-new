// utils/networkStatus.js
export const NetworkStatus = {
  isOnline: () => navigator.onLine,
  
  addOnlineListener(callback) {
    window.addEventListener('online', callback);
  },
  
  addOfflineListener(callback) {
    window.addEventListener('offline', callback);
  },
  
  removeOnlineListener(callback) {
    window.removeEventListener('online', callback);
  },
  
  removeOfflineListener(callback) {
    window.removeEventListener('offline', callback);
  }
};