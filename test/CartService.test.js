'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CartService } = require('../src/CartService');

const apple = { id: 'apple', price: 2, quantity: 3 };

test('refresh returns items and total for a filled cart', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  const view = svc.refreshCart('u1');
  assert.equal(view.itemCount, 1);
  assert.equal(view.total, 6);
});

test('refresh after clearing the cart returns an empty cart instead of throwing', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.clearCart('u1');
  assert.deepEqual(svc.refreshCart('u1'), { userId: 'u1', items: [], itemCount: 0, total: 0 });
});

test('refresh for a user who never had a cart returns an empty cart', () => {
  const svc = new CartService();
  assert.deepEqual(svc.refreshCart('new-user'), { userId: 'new-user', items: [], itemCount: 0, total: 0 });
});

test('items can be added again after clearing', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.clearCart('u1');
  svc.addItem('u1', { id: 'pear', price: 5, quantity: 1 });
  const view = svc.refreshCart('u1');
  assert.equal(view.itemCount, 1);
  assert.equal(view.total, 5);
});

test('removing the last item leaves an empty cart that refreshes cleanly', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.removeItem('u1', 'apple');
  assert.equal(svc.refreshCart('u1').total, 0);
});
