'use strict';

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => i !== null && typeof i === 'object');
}

function lineTotal(i) {
  const validPrice = typeof i.price === 'number' && i.price >= 0;
  const validQuantity = typeof i.quantity === 'number' && i.quantity > 0;
  return validPrice && validQuantity ? i.price * i.quantity : 0;
}

class CartService {
  constructor(store = new Map()) {
    this.store = store;
  }

  getCart(userId) {
    return this.store.get(userId);
  }

  addItem(userId, item) {
    if (!item || !item.id || !(item.price >= 0) || !(item.quantity > 0)) {
      throw new Error('Invalid item');
    }
    let cart = this.store.get(userId);
    if (!cart) {
      cart = { userId, items: [] };
      this.store.set(userId, cart);
    }
    cart.items = normalizeItems(cart.items);
    const existing = cart.items.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.items.push({ ...item });
    }
    return cart;
  }

  removeItem(userId, itemId) {
    const cart = this.store.get(userId);
    if (!cart) return;
    cart.items = normalizeItems(cart.items).filter((i) => i.id !== itemId);
  }

  clearCart(userId) {
    const cart = this.store.get(userId);
    if (cart) cart.items = [];
  }

  refreshCart(userId) {
    const cart = this.getCart(userId);
    const items = normalizeItems(cart?.items);
    const total = items.reduce((sum, i) => sum + lineTotal(i), 0);
    return { userId, items: [...items], itemCount: items.length, total };
  }

  getCartSummary(userId) {
    return this.refreshCart(userId);
  }
}

module.exports = { CartService };
