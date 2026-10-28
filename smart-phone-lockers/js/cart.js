/**
 * Lockia - Cart & State Management
 * Persists cart items in localStorage across pages and sessions
 */

(function () {
  const STORAGE_KEY = 'lockia_cart_v1';

  window.LockiaCart = {
    getItems: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Error reading cart from localStorage', e);
        return [];
      }
    },

    saveItems: function (items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        this.updateBadge();
      } catch (e) {
        console.error('Error saving cart to localStorage', e);
      }
    },

    addItem: function (item) {
      const items = this.getItems();
      items.push({
        id: Date.now() + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        ...item,
      });
      this.saveItems(items);
      return items;
    },

    removeItem: function (index) {
      const items = this.getItems();
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
        this.saveItems(items);
      }
      return items;
    },

    clear: function () {
      localStorage.removeItem(STORAGE_KEY);
      this.updateBadge();
    },

    getCount: function () {
      const items = this.getItems();
      return items.reduce((total, item) => total + (parseInt(item.quantity, 10) || 1), 0);
    },

    updateBadge: function () {
      const badges = document.querySelectorAll('.cart-count-badge');
      const count = this.getCount();
      badges.forEach((badge) => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.LockiaCart.updateBadge();
  });
})();
