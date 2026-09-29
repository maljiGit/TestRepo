'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CartService } = require('../src/CartService');

const apple = { id: 'apple', price: 2, quantity: 3 };
const empty = (userId) => ({ userId, items: [], itemCount: 0, total: 0 });

test('adding to a stored cart that has no items list starts a new list', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1' }]]));
  svc.addItem('u1', apple);
  assert.equal(svc.refreshCart('u1').itemCount, 1);
  assert.equal(svc.refreshCart('u1').total, 6);
});

test('removing from a stored cart that has no items list leaves an empty cart', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1' }]]));
  assert.doesNotThrow(() => svc.removeItem('u1', 'apple'));
  assert.deepEqual(svc.getCart('u1').items, []);
  assert.deepEqual(svc.refreshCart('u1'), empty('u1'));
});

test('getCartSummary matches refreshCart for a filled cart', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  assert.deepEqual(svc.getCartSummary('u1'), svc.refreshCart('u1'));
});

test('getCartSummary returns an empty cart after clearing', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.clearCart('u1');
  assert.deepEqual(svc.getCartSummary('u1'), empty('u1'));
  assert.deepEqual(svc.getCartSummary('u1'), svc.refreshCart('u1'));
});

test('getCartSummary returns an empty cart for an unknown user', () => {
  const svc = new CartService();
  assert.deepEqual(svc.getCartSummary('nobody'), empty('nobody'));
});

test('invalid items are rejected', () => {
  const svc = new CartService();
  assert.throws(() => svc.addItem('u1', { price: 1, quantity: 1 }), /Invalid item/);
  assert.throws(() => svc.addItem('u1', { id: 'x', price: -1, quantity: 1 }), /Invalid item/);
  assert.throws(() => svc.addItem('u1', { id: 'x', price: 1, quantity: 0 }), /Invalid item/);
});

test('a free item with price 0 is accepted', () => {
  const svc = new CartService();
  svc.addItem('u1', { id: 'gift', price: 0, quantity: 1 });
  assert.equal(svc.refreshCart('u1').itemCount, 1);
  assert.equal(svc.refreshCart('u1').total, 0);
});

test('adding the same item twice merges the quantity', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.addItem('u1', { id: 'apple', price: 2, quantity: 2 });
  const view = svc.refreshCart('u1');
  assert.equal(view.itemCount, 1);
  assert.equal(view.items[0].quantity, 5);
  assert.equal(view.total, 10);
});
