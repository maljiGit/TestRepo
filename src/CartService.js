'use strict';

class CartService {
  constructor(store = new Map()) {
    this.store = store;
  }

  getCart(userId) {
    return this.store.get(userId);
  }

  addItem(userId, item) {
    if (!item || !item.id || !Number.isFinite(item.price) || item.price < 0
      || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error('Invalid item');
    }
    let cart = this.store.get(userId);
    if (!cart) {
      cart = { userId, items: [] };
      this.store.set(userId, cart);
    }
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
    cart.items = cart.items.filter((i) => i.id !== itemId);
  }

  clearCart(userId) {
    const cart = this.store.get(userId);
    if (cart) cart.items = [];
  }

  refreshCart(userId) {
    const cart = this.getCart(userId);
    const items = cart?.items ?? [];
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { userId, items, itemCount: items.length, total };
  }
}

module.exports = { CartService };
